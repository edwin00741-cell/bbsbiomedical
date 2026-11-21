"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import {can} from "../../lib/bbs-control/permissions";
import { documentInputSchema } from "../../lib/bbs-control/document-validation";
import { saveDocumentRecord } from "../../lib/bbs-control/documents";
import type { SaveDocumentResult } from "../../lib/bbs-control/document-types";

export async function saveCommercialDocument(formData: FormData): Promise<SaveDocumentResult> {
  const actor=await requireBackOfficeUser();
  let payload;
  try { payload = JSON.parse(String(formData.get("payload") || "")); } catch { return { error: "Formulario inválido. Recargue la página." }; }
  const parsed = documentInputSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise los datos del documento." };
  if(!can(actor.role,parsed.data.kind==="quote"?"quotes.write":"finance.write"))return{error:"Su rol no puede guardar este tipo de documento."};
  if(actor.role==="cotizador"&&!parsed.data.client_id)return{error:"Seleccione un cliente registrado por el administrador."};
  const metadata = z.object({ documentId: z.uuid().optional(), version: z.iso.datetime({ offset: true }).optional(), requestId: z.uuid(),
    sourceQuoteId: z.uuid().optional(), intent: z.enum(["save", "preview", "download", "draft", "email", "payment", "recurring"]) }).safeParse({
    documentId: formData.get("document_id") || undefined, version: formData.get("version") || undefined,
    requestId: formData.get("request_id"), sourceQuoteId: formData.get("source_quote_id") || undefined, intent: formData.get("intent") || "save",
  });
  if (!metadata.success) return { error: "Referencia del formulario inválida. Recargue la página." };
  if (metadata.data.documentId && !metadata.data.version) return { error: "Falta la versión del documento. Recargue la página." };
  let id: string;
  try { id = await saveDocumentRecord(parsed.data, { ...metadata.data, draft: metadata.data.intent === "draft" }); }
  catch (error) { return { error: error instanceof Error ? error.message : "No se pudo guardar el documento." }; }
  const slug = parsed.data.kind === "quote" ? "cotizaciones" : "facturas";
  revalidatePath(`/bbs-control/${slug}`); revalidatePath("/bbs-control"); revalidatePath("/bbs-control/clientes");
  if (metadata.data.intent === "email") redirect(`/bbs-control/${slug}/${id}?email=1`);
  if (metadata.data.intent === "payment" && parsed.data.kind === "invoice") redirect(`/bbs-control/pagos/nuevo?invoice_id=${id}&client_id=${parsed.data.client_id || ""}`);
  if (metadata.data.intent === "recurring" && parsed.data.kind === "invoice") redirect(`/bbs-control/recurrentes/nueva?invoice_id=${id}`);
  if (metadata.data.intent === "download") redirect(`/api/bbs-control/${parsed.data.kind === "quote" ? "quotes" : "invoices"}/${id}/pdf`);
  if (metadata.data.intent === "preview") redirect(`/api/bbs-control/${parsed.data.kind === "quote" ? "quotes" : "invoices"}/${id}/pdf?inline=1`);
  redirect(`/bbs-control/${slug}/${id}/editar?success=Documento%20guardado.`);
}
