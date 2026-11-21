"use server";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import { getFinanceData } from "../../lib/bbs-control/finance";
import { findFinanceRecord, renderFinanceReceiptPdf } from "../../lib/bbs-control/finance-receipt-pdf";

export async function sendFinanceEmail(form: FormData): Promise<{ error: string; success?: string }> {
  await requireBackOfficeUser();
  const parsed = z.object({ kind: z.enum(["payment", "credit", "refund"]), document_id: z.uuid(), request_id: z.uuid(),
    recipients: z.string().transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean)).pipe(z.array(z.email("Revise los destinatarios.")).min(1).max(10)),
    subject: z.string().trim().min(1).max(200), message: z.string().trim().max(5000),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise los datos del correo." };
  if (!process.env.RESEND_API_KEY) return { error: "El correo no está configurado. Puede descargar el PDF." };
  try {
    const data = await getFinanceData();
    const values = parsed.data;
    const record = findFinanceRecord(data, values.kind, values.document_id);
    if (!record) return { error: "Documento no encontrado." };
    const pdf = await renderFinanceReceiptPdf(data, values.kind, values.document_id);
    const key = createHash("sha256").update(JSON.stringify(values)).digest("hex");
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Biomedical Business and Service <no-reply@bbsbiomedical.com>",
      to: values.recipients, subject: values.subject, text: values.message,
      attachments: [{ filename: `${record.number.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`, content: pdf }],
    }, { idempotencyKey: `bbs-finance-${key}` });
    if (result.error || !result.data?.id) return { error: "No se pudo enviar el correo. Revise los destinatarios y la configuración." };
    return { error: "", success: "Documento enviado." };
  } catch { return { error: "No se pudo confirmar el envío. Revise su correo antes de reenviar." }; }
}
