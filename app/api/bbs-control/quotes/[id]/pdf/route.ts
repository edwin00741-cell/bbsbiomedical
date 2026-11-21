import { NextResponse } from "next/server";
import { z } from "zod";
import { renderQuotePdfBuffer } from "../../../../../../lib/bbs-control/quote-pdf";
import { renderCommercialDocumentPdf } from "../../../../../../lib/bbs-control/commercial-document-pdf";
import { getCommercialDocument } from "../../../../../../lib/bbs-control/documents";
import { getBusinessSettings, getQuoteWithItems } from "../../../../../../lib/bbs-control/quotes";
import { getBackOfficeUser } from "../../../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getBackOfficeUser();

  if (!user) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ message: "Cotización inválida." }, { status: 400 });
  }
  try {
    const document = await getCommercialDocument("quote", id);

    if (!document) {
      return NextResponse.json({ message: "Cotización no encontrada." }, { status: 404 });
    }

    const settings = await getBusinessSettings();
    const legacyQuote = document.commercial_version ? null : await getQuoteWithItems(id);
    if (!document.commercial_version && !legacyQuote) {
      return NextResponse.json({ message: "Cotización no encontrada." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    const pdf = document.commercial_version
      ? await renderCommercialDocumentPdf(document, settings)
      : await renderQuotePdfBuffer(legacyQuote!, settings);
    const url = new URL(request.url);
    const disposition = url.searchParams.get("inline") === "1" ? "inline" : "attachment";

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Disposition": `${disposition}; filename="${document.number.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "cotizacion"}.pdf"`,
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo generar el PDF. Intenta nuevamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
