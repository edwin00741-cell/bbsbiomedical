import { NextResponse } from "next/server";
import { renderQuotePdfBuffer } from "../../../../../../lib/bbs-control/quote-pdf";
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
  const quote = await getQuoteWithItems(id);

  if (!quote) {
    return NextResponse.json({ message: "Cotización no encontrada." }, { status: 404 });
  }

  const settings = await getBusinessSettings();
  const pdf = await renderQuotePdfBuffer(quote, settings);
  const url = new URL(request.url);
  const disposition = url.searchParams.get("inline") === "1" ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Disposition": `${disposition}; filename="${quote.quote_number}.pdf"`,
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
    },
  });
}
