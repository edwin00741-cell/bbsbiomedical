import { z } from "zod";
import { createSupabaseServerClient } from "./supabase-server";
import { readAllPages } from "./dashboard";
import type { CommercialDocument, DocumentInput } from "./document-types";
import type { BusinessSettings } from "./types";

export const recurrenceSchema = z.object({
  invoice_id: z.uuid("Seleccione una factura de origen."), name: z.string().trim().min(2).max(160),
  start_date: z.iso.date(), end_date: z.union([z.iso.date(), z.literal("")]).transform((value) => value || null),
  interval_unit: z.enum(["days", "weeks", "months", "years"]), interval_count: z.coerce.number().int().min(1).max(365),
  request_id: z.uuid(),
});
export type RecurrenceSummary = {
  id: string; name: string; source_invoice_id: string; interval_unit: string; interval_count: number;
  start_date: string; end_date: string | null; next_run_date: string; run_count: number; status: "active" | "paused" | "completed";
  last_error: string | null; last_run_at: string | null; updated_at: string; client_name?: string; total?: string;
};
export type InvoiceRecurrence = RecurrenceSummary & { document_snapshot: DocumentInput & { invoice_number: string; total: number }; business_snapshot: BusinessSettings | null };
export type RecurrenceRun = { id: string; scheduled_date: string; invoice_id: string; created_at: string; invoices: { invoice_number: string; total: number; status: string } | null };
export const recurrenceInterval = (row: Pick<RecurrenceSummary, "interval_count" | "interval_unit">) => {
  const labels: Record<string, [string, string]> = { days: ["día", "días"], weeks: ["semana", "semanas"], months: ["mes", "meses"], years: ["año", "años"] };
  return `Cada ${row.interval_count} ${labels[row.interval_unit]?.[row.interval_count === 1 ? 0 : 1] || row.interval_unit}`;
};
export async function getRecurrences(page = 1, keyword = "") {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("recurring_invoices").select("id,name,source_invoice_id,interval_unit,interval_count,start_date,end_date,next_run_date,run_count,status,last_error,last_run_at,updated_at,client_name:document_snapshot->>client_name,total:document_snapshot->>total", { count: "exact" });
  if (keyword) query = query.ilike("name", `%${keyword.replace(/[\\%_]/g, "\\$&")}%`);
  const [rows, scheduler] = await Promise.all([
    query.order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1),
    supabase.from("recurrence_scheduler_state").select("installed,last_run_at,installation_error").eq("id", true).single(),
  ]);
  if (rows.error || scheduler.error) throw new Error("No se pudo cargar la programación recurrente.");
  return { rows: rows.data as unknown as RecurrenceSummary[], count: rows.count || 0, scheduler: scheduler.data };
}
export async function getRecurrence(id: string) {
  const supabase = await createSupabaseServerClient();
  const [row, runs] = await Promise.all([
    supabase.from("recurring_invoices").select("*").eq("id", id).maybeSingle(),
    readAllPages<RecurrenceRun>((from, to) => supabase.from("recurring_invoice_runs").select("id,scheduled_date,invoice_id,created_at,invoices(invoice_number,total,status)", { count: "exact" }).eq("recurrence_id", id).order("scheduled_date", { ascending: false }).order("id").range(from, to).returns<RecurrenceRun[]>()),
  ]);
  if (row.error || runs.error) throw new Error("No se pudo cargar la plantilla.");
  return { recurrence: row.data as InvoiceRecurrence | null, runs: runs.data || [] };
}
export async function getRecurringSourceInvoices() {
  const supabase = await createSupabaseServerClient();
  const result = await readAllPages<Pick<CommercialDocument, "id" | "client_name" | "total"> & { invoice_number: string }>((from, to) => supabase.from("invoices").select("id,invoice_number,client_name,total", { count: "exact" }).eq("commercial_version", 1).neq("status", "void").order("created_at", { ascending: false }).order("id").range(from, to));
  if (result.error) throw new Error("No se pudieron cargar las facturas de origen.");
  return result.data || [];
}
