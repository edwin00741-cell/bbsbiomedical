import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser } from "./supabase-server";
import { getCommercialDocument } from "./documents";
import { getBusinessSettings } from "./quotes";
import { renderDeliveryPdf } from "./delivery-pdf";
export async function serveDeliveryPdf(request: Request, id: string, kind: "delivery-note" | "shipping-label") {
  const failure = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  try {
    if (!await getBackOfficeUser()) return failure("No autorizado.", 401);
    if (!z.uuid().safeParse(id).success) return failure("Factura inválida.", 400);
    const document = await getCommercialDocument("invoice", id);
    if (!document) return failure("Factura no encontrada.", 404);
    if (["draft", "void"].includes(document.status)) return failure("Emita una factura activa antes de preparar su entrega.", 409);
    const output = await renderDeliveryPdf(document, await getBusinessSettings(), kind);
    const filename = `${kind === "delivery-note" ? "entrega" : "etiqueta"}-${document.number.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)}.pdf`;
    return new NextResponse(new Uint8Array(output), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${new URL(request.url).searchParams.get("inline") === "1" ? "inline" : "attachment"}; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch { return failure("No se pudo generar el documento de entrega.", 503); }
}
