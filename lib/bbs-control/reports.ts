import { z } from "zod";
import { createSupabaseServerClient } from "./supabase-server";
import { readAllPages } from "./dashboard";
import { getBusinessSettings } from "./quotes";
import { param, parseListFilters, type SearchParams } from "./list-filters";
import { buildReport } from "./reports-math";
import { reportCatalog, type ReportId, type ReportSourceRow, type ReportSources } from "./reports-types";
export function parseReportFilters(params: SearchParams) {
  const base = parseListFilters(params);
  const client = param(params, "client"), seller = param(params, "seller").slice(0, 200), status = param(params, "status");
  if (client && !z.uuid().safeParse(client).success) throw new Error("Cliente inválido.");
  return { ...base, cutoff: base.end || base.today, client, seller, status };
}
export function parseReportId(id: string): ReportId {
  if (!reportCatalog.some((entry) => entry.id === id)) throw new Error("Informe no disponible.");
  return id as ReportId;
}
export async function getReportData(id: ReportId, params: SearchParams) {
  const filter = parseReportFilters(params), supabase = await createSupabaseServerClient();
  const tableColumns: Record<keyof ReportSources, string> = {
    invoices: "id,invoice_number,client_id,client_name,seller_name,status,issue_date,due_date,subtotal,discount_total,net_subtotal,tax_total,shipping_amount,shipping_tax_rate,shipping_tax_total,total,amount_paid,amount_paid_legacy,amount_credited,tax_exempt,commercial_version",
    quotes: "id,quote_number,client_id,client_name,seller_name,status,issue_date,subtotal,discount_total,tax_total,shipping_amount,total",
    clients: "id,name,email,phone,salesperson_name,group_name,is_active,created_at", invoice_items: "id,invoice_id,item_id,sku_snapshot,description,quantity,unit_price,tax_rate,line_subtotal,line_total,commercial_net_total,commercial_tax_total,commercial_tax_rate",
    credit_notes: "id,credit_note_number,client_id,client_name,status,issue_date,subtotal,tax_total,total,document_snapshot", credit_note_items: "id,credit_note_id,item_id,sku,description,quantity,tax_rate,net_total,tax_total,line_total",
    payments: "id,payment_number,client_id,client_name,payment_method_name,reference,amount,status,paid_at,voided_at", refunds: "id,refund_number,payment_id,client_id,client_name,payment_method_name,reference,amount,status,refunded_at,created_at",
    finance_applications: "id,invoice_id,source_kind,amount,created_at,reversed_at", document_events: "id,document_id,event_type,created_at", finance_events: "id,entity_id,event_type,created_at",
    items: "id,sku,name,manage_stock,stock_quantity,ideal_quantity,warning_quantity,supplier,unit_price,created_at", inventory_movements: "id,item_id,quantity,created_at",
  };
  const settings = getBusinessSettings();
  const entries = await Promise.all(Object.entries(tableColumns).map(async ([key, columns]) => {
    const result = await readAllPages<ReportSourceRow>((from, to) => supabase.from(key === "clients" ? "bbs_client_directory" : key).select(columns, { count: "exact" }).order("id").range(from, to).returns<ReportSourceRow[]>());
    if (result.error) throw new Error(`No se pudieron cargar los datos del informe (${key}).`);
    return [key, result.data || []] as const;
  }));
  const sources = Object.fromEntries(entries) as ReportSources, business = await settings;
  return { report: buildReport(id, sources, filter, business.currency), filter, business, clients: sources.clients.map((row) => ({ id: String(row.id), name: String(row.name) })), sellers: [...new Set(sources.invoices.map((row) => String(row.seller_name)).concat(sources.clients.map((row) => String(row.salesperson_name || ""))))].filter(Boolean).sort() };
}
