"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { z } from "zod";
import { getCommercialDocument, saveDocumentRecord } from "../../lib/bbs-control/documents";
import { renderCommercialDocumentPdf } from "../../lib/bbs-control/commercial-document-pdf";
import { renderQuotePdfBuffer } from "../../lib/bbs-control/quote-pdf";
import { getBusinessSettings, getQuoteWithItems } from "../../lib/bbs-control/quotes";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import { panamaToday } from "../../lib/bbs-control/list-filters";
import type { DocumentInput } from "../../lib/bbs-control/document-types";
import { redirect } from "next/navigation";

const emailSchema = z.object({
  kind: z.enum(["quote", "invoice"]), document_id: z.uuid(), request_id: z.uuid(),
  recipients: z.string().transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean))
    .pipe(z.array(z.email("Revise los destinatarios.")).min(1).max(10)),
  subject: z.string().trim().min(1).max(200), message: z.string().trim().max(5000),
});

export async function sendDocumentEmail(formData: FormData): Promise<{ error: string; success?: string }> {
  await requireBackOfficeUser();
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise los datos." };
  if (!process.env.RESEND_API_KEY) return { error: "El correo no está configurado. Puede descargar el PDF." };
  try {
    const values = parsed.data;
    const document = await getCommercialDocument(values.kind, values.document_id);
    if (!document) return { error: "Documento no encontrado." };
    if (document.kind === "invoice" && ["draft", "void"].includes(document.status)) return { error: "Emita la factura antes de enviarla." };
    const settings = await getBusinessSettings();
    let pdf: Buffer;
    if (document.kind === "quote" && document.commercial_version === 0) {
      const legacy = await getQuoteWithItems(document.id);
      if (!legacy) return { error: "Cotización no encontrada." };
      pdf = await renderQuotePdfBuffer(legacy, settings);
    } else pdf = await renderCommercialDocumentPdf(document, document.business_snapshot || settings);
    const key = createHash("sha256").update(JSON.stringify(values)).digest("hex");
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Biomedical Business and Service <no-reply@bbsbiomedical.com>",
      to: values.recipients, subject: values.subject, text: values.message,
      attachments: [{ filename: `${document.number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`, content: pdf }],
    }, { idempotencyKey: `bbs-document-${key}` });
    if (result.error || !result.data?.id) return { error: "No se pudo enviar el correo. Revise destinatarios y configuración." };
    const supabase = await createSupabaseServerClient();
    const payload = { emailed_at: new Date().toISOString(), ...(document.kind === "quote" && document.status === "draft" ? { status: "sent" } : {}) };
    const { data, error } = await supabase.from(document.kind === "quote" ? "quotes" : "invoices").update(payload)
      .eq("id", document.id).eq("updated_at", document.updated_at).select("id").maybeSingle();
    revalidatePath(document.kind === "quote" ? "/bbs-control/cotizaciones" : "/bbs-control/facturas");
    if (error || !data) return { error: "Correo enviado. El documento cambió durante el envío; revise su estado antes de reenviar." };
    return { error: "", success: "Documento enviado." };
  } catch { return { error: "No se pudo confirmar el envío. Revise su correo antes de reenviar." }; }
}

export async function duplicateDocument(formData: FormData) {
  await requireBackOfficeUser();
  const parsed = z.object({ kind: z.enum(["quote", "invoice"]), document_id: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/bbs-control?error=Documento%20inválido.");
  const { kind, document_id: id } = parsed.data;
  const path = kind === "quote" ? "/bbs-control/cotizaciones" : "/bbs-control/facturas";
  let newId = "";
  try {
    const source = await getCommercialDocument(kind, id);
    if (!source) throw new Error("Documento no encontrado.");
    const today = panamaToday();
    const settings = await getBusinessSettings();
    const until = new Date(`${today}T12:00:00Z`); until.setUTCDate(until.getUTCDate() + settings.default_validity_days);
    const input: DocumentInput = { ...source, issue_date: today, valid_until: until.toISOString().slice(0, 10),
      items: source.items.map((item) => ({ item_id: item.item_id, sku: item.sku, description: item.description,
        quantity: Number(item.quantity), unit_price: Number(item.unit_price), tax_rate: Number(item.tax_rate), discount_percent: Number(item.discount_percent) })) };
    newId = await saveDocumentRecord(input, { requestId: randomUUID(), draft: true });
  } catch (error) {
    redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "No se pudo duplicar.")}`);
  }
  revalidatePath(path);
  redirect(`${path}/${newId}/editar?success=Documento%20duplicado.`);
}

