import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser } from "../../../../../../lib/bbs-control/supabase-server";
import { getCommercialDocument } from "../../../../../../lib/bbs-control/documents";
import { renderCommercialDocumentPdf } from "../../../../../../lib/bbs-control/commercial-document-pdf";
import { getBusinessSettings } from "../../../../../../lib/bbs-control/quotes";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = (message: string, status: number) => NextResponse.json({ message }, {
    status, headers: { "Cache-Control": "no-store" },
  });
  try {
    if (!await getBackOfficeUser()) return errorResponse("No autorizado.", 401);
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return errorResponse("Factura inválida.", 400);
    const document = await getCommercialDocument("invoice", id);
    if (!document) return errorResponse("Factura no encontrada.", 404);
    const pdf = await renderCommercialDocumentPdf(document, await getBusinessSettings());
    const disposition = new URL(request.url).searchParams.get("inline") === "1" ? "inline" : "attachment";
    const filename = document.number.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "factura";
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${filename}.pdf"`, "Cache-Control": "no-store",
    } });
  } catch { return errorResponse("No se pudo generar el PDF. Intente nuevamente.", 503); }
}
