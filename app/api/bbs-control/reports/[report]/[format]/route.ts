import { NextResponse } from "next/server";
import { getBackOfficeUser } from "../../../../../../lib/bbs-control/supabase-server";
import { getReportData, parseReportId } from "../../../../../../lib/bbs-control/reports";
import { reportCsv } from "../../../../../../lib/bbs-control/reports-math";
import { renderReportPdf } from "../../../../../../lib/bbs-control/reports-pdf";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ report: string; format: string }> }) {
  const failure = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  if (!await getBackOfficeUser()) return failure("No autorizado.", 401);
  const route = await params;
  if (!["csv", "pdf"].includes(route.format)) return failure("Formato inválido.", 400);
  try {
    const id = parseReportId(route.report), query = Object.fromEntries(new URL(request.url).searchParams), data = await getReportData(id, query);
    const output = route.format === "csv" ? reportCsv(data.report) : new Uint8Array(await renderReportPdf(data.report, data.business));
    const disposition = new URL(request.url).searchParams.get("inline") === "1" ? "inline" : "attachment";
    return new NextResponse(output, { headers: { "Content-Type": route.format === "csv" ? "text/csv; charset=utf-8" : "application/pdf", "Content-Disposition": `${disposition}; filename="${id}-${data.report.cutoff}.${route.format}"`, "Cache-Control": "no-store" } });
  } catch (error) { return failure(error instanceof Error ? error.message : "No se pudo generar el informe.", 400); }
}
