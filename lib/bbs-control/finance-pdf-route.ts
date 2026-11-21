import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser } from "./supabase-server";
import { getFinanceData } from "./finance";
import { findFinanceRecord, renderFinanceReceiptPdf, type FinancePdfKind } from "./finance-receipt-pdf";

export async function financePdfResponse(request: Request, id: string, kind: FinancePdfKind) {
  const error = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  try {
    if (!await getBackOfficeUser()) return error("No autorizado.", 401);
    if (!z.uuid().safeParse(id).success) return error("Documento inválido.", 400);
    const data = await getFinanceData();
    const record = findFinanceRecord(data, kind, id);
    if (!record) return error("Documento no encontrado.", 404);
    const pdf = await renderFinanceReceiptPdf(data, kind, id);
    const disposition = new URL(request.url).searchParams.get("inline") === "1" ? "inline" : "attachment";
    const filename = record.number.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "comprobante";
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${filename}.pdf"`, "Cache-Control": "no-store" } });
  } catch { return error("No se pudo generar el PDF. Intente nuevamente.", 503); }
}
