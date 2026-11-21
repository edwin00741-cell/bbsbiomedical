import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser } from "../../../../../../lib/bbs-control/supabase-server";
import { getBusinessSettings } from "../../../../../../lib/bbs-control/quotes";
import { getClientStatement } from "../../../../../../lib/bbs-control/client-statement";
import { renderClientStatementPdf } from "../../../../../../lib/bbs-control/client-statement-pdf";
import { panamaToday } from "../../../../../../lib/bbs-control/list-filters";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jsonError = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  if (!await getBackOfficeUser()) return jsonError("No autorizado.", 401);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError("Cliente inválido.", 400);
  try {
    const statement = await getClientStatement(id);
    if (!statement) return jsonError("Cliente no encontrado.", 404);
    const settings = await getBusinessSettings();
    const pdf = await renderClientStatementPdf(statement.client, statement.invoices, settings, panamaToday());
    const disposition = new URL(request.url).searchParams.get("inline") === "1" ? "inline" : "attachment";
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="estado-de-cuenta-${id}.pdf"`, "Cache-Control": "no-store",
    } });
  } catch { return jsonError("No se pudo generar el estado de cuenta. Intente nuevamente.", 503); }
}
