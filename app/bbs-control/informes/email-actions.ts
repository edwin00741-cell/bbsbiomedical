"use server";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { getReportData, parseReportId } from "../../../lib/bbs-control/reports";
import { reportCsv } from "../../../lib/bbs-control/reports-math";
import { renderReportPdf } from "../../../lib/bbs-control/reports-pdf";
const schema = z.object({ report_id: z.string(), request_id: z.uuid(), format: z.enum(["pdf", "csv"]),
  recipients: z.string().transform((value) => value.split(",").map((row) => row.trim()).filter(Boolean)).pipe(z.array(z.email("Revise los destinatarios.")).min(1).max(10)),
  subject: z.string().trim().min(1).max(200), message: z.string().trim().max(5000), filters: z.string().max(10000),
});
export async function emailReport(_previous: { error: string; success?: string }, form: FormData): Promise<{ error: string; success?: string }> {
  const user = await requireBackOfficeUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise los destinatarios." };
  if (!process.env.RESEND_API_KEY) return { error: "El correo no está configurado. Puede descargar el informe." };
  try {
    const values = parsed.data, filters = z.record(z.string().max(50), z.string().max(300)).parse(JSON.parse(values.filters));
    const data = await getReportData(parseReportId(values.report_id), filters);
    const attachment = values.format === "pdf" ? await renderReportPdf(data.report, data.business) : Buffer.from(reportCsv(data.report), "utf8");
    const key = createHash("sha256").update(JSON.stringify({ actor: user.id, ...values })).digest("hex");
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Biomedical Business and Service <no-reply@bbsbiomedical.com>", to: values.recipients,
      subject: values.subject, text: values.message,
      attachments: [{ filename: `${data.report.id}-${data.report.cutoff}.${values.format}`, content: attachment }],
    }, { idempotencyKey: `bbs-report-${key}` });
    if (result.error || !result.data?.id) return { error: "No se pudo confirmar el envío del informe. Revise destinatarios y configuración antes de reintentar." };
    return { error: "", success: "Informe enviado." };
  } catch { return { error: "No se pudo preparar o confirmar el envío del informe. Revise los filtros y su correo antes de reintentar." }; }
}
