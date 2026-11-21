"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recurrenceSchema } from "../../../lib/bbs-control/recurrence";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";

export type RecurrenceActionState = { error: string; success?: string };
export async function createRecurrence(_previous: RecurrenceActionState, form: FormData): Promise<RecurrenceActionState> {
  await requireBackOfficeUser();
  const parsed = recurrenceSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise la programación." };
  const row = parsed.data, supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_invoice_recurrence", { p_source_invoice_id: row.invoice_id, p_name: row.name,
    p_start_date: row.start_date, p_end_date: row.end_date, p_interval_unit: row.interval_unit, p_interval_count: row.interval_count, p_request_id: row.request_id });
  if (error) return { error: error.message };
  revalidatePath("/bbs-control/recurrentes");
  redirect(`/bbs-control/recurrentes/${data}?success=Programación%20guardada.`);
}
export async function updateRecurrence(_previous: RecurrenceActionState, form: FormData): Promise<RecurrenceActionState> {
  await requireBackOfficeUser();
  const parsed = z.object({ id: z.uuid(), version: z.iso.datetime({ offset: true }), name: z.string().trim().min(2).max(160), status: z.enum(["active", "paused"]), end_date: z.union([z.iso.date(), z.literal("")]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Revise nombre, estado y fecha final." };
  const row = parsed.data, supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_invoice_recurrence", { p_id: row.id, p_version: row.version, p_name: row.name, p_end_date: row.end_date || null, p_status: row.status });
  if (error) return { error: error.message };
  revalidatePath("/bbs-control/recurrentes"); revalidatePath(`/bbs-control/recurrentes/${row.id}`);
  redirect(`/bbs-control/recurrentes/${row.id}?success=Programación%20actualizada.`);
}
export async function runRecurrences(): Promise<RecurrenceActionState> {
  await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("run_due_invoice_recurrences");
  if (error) return { error: error.message };
  revalidatePath("/bbs-control/recurrentes"); revalidatePath("/bbs-control/facturas"); revalidatePath("/bbs-control"); revalidatePath("/bbs-control/clientes");
  return { error: "", success: `${Number(data?.generated || 0)} facturas generadas. ${Number(data?.failed || 0)} programaciones requieren revisión.` };
}
