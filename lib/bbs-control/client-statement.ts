import { createSupabaseServerClient } from "./supabase-server";
import { readAllPages } from "./dashboard";

export type StatementClient = {
  id: string; name: string; contact_name: string | null; email: string | null;
  address: string | null; public_notes: string | null; statement_footer: string | null;
};
export type StatementInvoice = {
  id: string; invoice_number: string; issue_date: string; due_date: string;
  total: number; amount_paid: number; amount_credited: number; status: string;
};

export async function getClientStatement(id: string) {
  const supabase = await createSupabaseServerClient();
  // Deliberately omit internal notes from all statement data.
  const { data: client, error } = await supabase.from("clients")
    .select("id,name,contact_name,email,address,public_notes,statement_footer").eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo cargar el cliente.");
  if (!client) return null;
  const invoices = await readAllPages<StatementInvoice>((from, to) => supabase.from("invoices")
    .select("id,invoice_number,issue_date,due_date,total,amount_paid,amount_credited,status", { count: "exact" })
    .eq("client_id", id).not("status", "in", "(draft,void)")
    .order("issue_date").order("id").range(from, to));
  if (invoices.error) throw new Error("No se pudieron cargar los movimientos.");
  return { client: client as StatementClient, invoices: invoices.data || [] };
}
