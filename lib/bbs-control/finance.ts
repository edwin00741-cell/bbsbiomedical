import { createSupabaseServerClient } from "./supabase-server";
import { readAllPages } from "./dashboard";
import { getBusinessSettings } from "./quotes";
import { financeCommandSchema } from "./finance-validation";
import { calculateDocumentTotals } from "./document-math";
import type { CommercialClient, ClientCatalog } from "./client-commercial";
import type { CommercialDocument } from "./document-types";
import type { BusinessSettings } from "./types";
import type { FinanceCommand, FinanceData, FinanceApplication, FinanceCredit, FinancePayment, FinanceRefund, FinanceInvoice, FinanceEvent } from "./finance-types";

const money = (value: number) => Math.round(value * 100) / 100;
type Row = Record<string, unknown>;
const numeric = (row: Row, name: string) => Number(row[name] || 0);
const nullable = (value: unknown) => value ? String(value) : null;

export async function executeFinanceCommand(command: FinanceCommand, requestId: string): Promise<string> {
  const parsed = financeCommandSchema.parse(command);
  if (parsed.operation === "credit.create" || parsed.operation === "credit.update") calculateDocumentTotals(parsed.document);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("bbs_finance_command", { p_command: parsed, p_request_id: requestId });
  if (error) throw new Error(error.message || "No se pudo registrar la operación financiera.");
  return String(data);
}

export async function getFinanceData(clientId?: string): Promise<FinanceData> {
  const supabase = await createSupabaseServerClient();
  const read = async (table: string, order = "created_at") => {
    const result = await readAllPages<Row>((from, to) => {
      let query = supabase.from(table).select("*", { count: "exact" }).order(order, { ascending: false }).order("id");
      if (clientId && ["invoices", "payments", "credit_notes", "refunds", "finance_applications"].includes(table)) query = query.eq("client_id", clientId);
      return query.range(from, to);
    });
    if (result.error) throw new Error(`No se pudieron cargar los datos financieros (${table}).`);
    return result.data || [];
  };
  const [clients, methods, invoicesRaw, paymentsRaw, creditsRaw, refundsRaw, applicationsRaw, eventsRaw, settings] = await Promise.all([
    read("bbs_client_directory"), read("payment_methods"), read("invoices"), read("payments"), read("credit_notes"),
    read("refunds"), read("finance_applications"), read("finance_events"), getBusinessSettings(),
  ]);
  const clientNames = new Map(clients.map((row) => [String(row.id), String(row.name)]));
  const methodNames = new Map(methods.map((row) => [String(row.id), String(row.name)]));
  const invoiceNumbers = new Map(invoicesRaw.map((row) => [String(row.id), String(row.invoice_number)]));
  const refundLockedApplications = new Set(refundsRaw.filter((row) => row.status === "completed").map((row) => row.credit_application_id).filter(Boolean));
  const applications: FinanceApplication[] = applicationsRaw.map((row) => ({
    id: String(row.id), source_kind: row.source_kind as "payment" | "credit", source_id: String(row.source_id), invoice_id: String(row.invoice_id),
    invoice_number: invoiceNumbers.get(String(row.invoice_id)) || "Factura", client_id: String(row.client_id), amount: numeric(row, "amount"),
    created_at: String(row.created_at), reversed_at: nullable(row.reversed_at), reversal_reason: nullable(row.reversal_reason), locked_by_refund: refundLockedApplications.has(row.id),
  }));
  const active = applications.filter((row) => !row.reversed_at);
  const refunds: FinanceRefund[] = refundsRaw.map((row) => ({
    id: String(row.id), number: String(row.refund_number || "Sin número"), client_id: String(row.client_id),
    client_name: String(row.client_name || clientNames.get(String(row.client_id)) || "Cliente"), payment_id: String(row.payment_id),
    credit_note_id: nullable(row.credit_note_id), amount: numeric(row, "amount"), date: String(row.refunded_at || row.created_at).slice(0, 10),
    payment_method_id: nullable(row.payment_method_id), payment_method_name: nullable(row.payment_method_name) || methodNames.get(String(row.payment_method_id)) || null,
    reference: nullable(row.reference), reason: nullable(row.reason), status: String(row.status), updated_at: String(row.updated_at),
    business_snapshot: row.business_snapshot as BusinessSettings | null, finance_version: Number(row.finance_version || 0),
  }));
  const completedRefunds = refundsRaw.filter((row) => row.status === "completed");
  const payments: FinancePayment[] = paymentsRaw.map((row) => {
    const applied = money(active.filter((app) => app.source_kind === "payment" && app.source_id === row.id).reduce((sum, app) => sum + app.amount, 0));
    const refunded = money(completedRefunds.filter((refund) => refund.payment_id === row.id).reduce((sum, refund) => sum + numeric(refund, "amount"), 0));
    const amount = numeric(row, "amount");
    return { id: String(row.id), number: String(row.payment_number || "Sin número"), client_id: String(row.client_id),
      client_name: String(row.client_name || clientNames.get(String(row.client_id)) || "Cliente"), amount, applied_amount: applied, refunded_amount: refunded,
      available_amount: row.status === "completed" && !row.voided_at && row.finance_version === 1 ? Math.max(money(amount - applied - refunded), 0) : 0,
      date: String(row.paid_at).slice(0, 10), payment_method_id: nullable(row.payment_method_id), payment_method_name: nullable(row.payment_method_name) || methodNames.get(String(row.payment_method_id)) || null,
      reference: nullable(row.reference), notes: nullable(row.notes), status: row.voided_at ? "void" : String(row.status),
      voided_at: nullable(row.voided_at), updated_at: String(row.updated_at), business_snapshot: row.business_snapshot as BusinessSettings | null, finance_version: Number(row.finance_version || 0) };
  });
  const creditRefundApplications = new Set(completedRefunds.map((row) => row.credit_application_id).filter(Boolean));
  const credits: FinanceCredit[] = creditsRaw.map((row) => {
    const applied = money(active.filter((app) => app.source_kind === "credit" && app.source_id === row.id && !creditRefundApplications.has(app.id)).reduce((sum, app) => sum + app.amount, 0));
    const refunded = money(completedRefunds.filter((refund) => refund.credit_note_id === row.id).reduce((sum, refund) => sum + numeric(refund, "amount"), 0));
    const total = numeric(row, "total");
    return { id: String(row.id), number: String(row.credit_note_number), client_id: String(row.client_id), client_name: String(row.client_name),
      source_invoice_id: nullable(row.invoice_id), total, applied_amount: applied, refunded_amount: refunded,
      available_amount: row.status === "completed" && row.finance_version === 1 ? Math.max(money(total - applied - refunded), 0) : 0,
      date: String(row.issue_date), reason: nullable(row.reason), status: String(row.status), updated_at: String(row.updated_at), finance_version: Number(row.finance_version || 0),
      document: row.document_snapshot ? { ...(row.document_snapshot as CommercialDocument), status: String(row.status), updated_at: String(row.updated_at) } : null };
  });
  const invoices: FinanceInvoice[] = invoicesRaw.map((row) => ({ id: String(row.id), invoice_number: String(row.invoice_number), client_id: nullable(row.client_id),
    client_name: String(row.client_name), issue_date: String(row.issue_date), due_date: String(row.due_date), total: numeric(row, "total"),
    amount_paid: numeric(row, "amount_paid"), amount_credited: numeric(row, "amount_credited"),
    balance: Math.max(money(numeric(row, "total") - numeric(row, "amount_paid") - numeric(row, "amount_credited")), 0), status: String(row.status) }));
  return { clients: clients as CommercialClient[], methods: methods as ClientCatalog[], invoices, payments, credits, refunds, applications,
    events: eventsRaw as FinanceEvent[], settings };
}
