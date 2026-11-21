import { NextResponse } from "next/server";
import { getBackOfficeUser } from "../../../../../lib/bbs-control/supabase-server";
import { documentInputSchema } from "../../../../../lib/bbs-control/document-validation";
import { calculateDocumentTotals, calculateDueDate } from "../../../../../lib/bbs-control/document-math";
import { getBusinessSettings } from "../../../../../lib/bbs-control/quotes";
import { renderCommercialDocumentPdf } from "../../../../../lib/bbs-control/commercial-document-pdf";
import { getCommercialDocument } from "../../../../../lib/bbs-control/documents";
import { z } from "zod";
import {can} from "../../../../../lib/bbs-control/permissions";
import type { CommercialDocument } from "../../../../../lib/bbs-control/document-types";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const error = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  const actor=await getBackOfficeUser();
  if (!actor) return error("No autorizado.", 401);
  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > 1000000) return error("Documento demasiado extenso.", 413);
    raw = JSON.parse(body);
  } catch { return error("Datos de documento inválidos.", 400); }
  const parsed = documentInputSchema.safeParse(raw);
  if (!parsed.success) return error(parsed.error.issues[0]?.message || "Revise el documento.", 400);
  if(actor.must_change_password||!can(actor.role,parsed.data.kind==="quote"?"quotes.write":"finance.write"))return error("Su rol no permite esta operación.",403);
  try {
    const input = parsed.data;
    const metadata = z.object({ document_id: z.uuid().optional(), source_quote_id: z.uuid().optional() }).safeParse(raw);
    if (!metadata.success) return error("Referencia de documento inválida.", 400);
    const source = metadata.data.document_id ? await getCommercialDocument(input.kind, metadata.data.document_id)
      : metadata.data.source_quote_id ? await getCommercialDocument("quote", metadata.data.source_quote_id) : null;
    if ((metadata.data.document_id || metadata.data.source_quote_id) && !source) return error("Documento no encontrado.", 404);
    const settings = source?.business_snapshot || await getBusinessSettings();
    const totals = calculateDocumentTotals(input);
    const now = new Date().toISOString();
    const document: CommercialDocument = { ...input, ...totals, id: "preview", number: "VISTA PREVIA",
      status: "draft", updated_at: now, created_at: now, due_date: calculateDueDate(input.issue_date, input.payment_terms, input.payment_terms_days),
      amount_paid: 0, source_quote_id: null, commercial_version: 1, business_snapshot: settings };
    const pdf = await renderCommercialDocumentPdf(document, settings);
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="vista-previa.pdf"', "Cache-Control": "no-store" } });
  } catch { return error("No se pudo generar la vista previa. El documento no se ha guardado.", 503); }
}
