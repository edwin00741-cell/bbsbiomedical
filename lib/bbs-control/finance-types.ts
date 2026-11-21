import type { DocumentInput, CommercialDocument } from "./document-types";
import type { BusinessSettings } from "./types";
import type { CommercialClient, ClientCatalog } from "./client-commercial";

export type FinanceAllocationInput = { invoice_id: string; amount: number };
export type FinanceCommand =
  | { operation: "payment.create"; client_id: string; amount: number; date: string; payment_method_id: string | null; reference: string | null; notes: string | null; allocations: FinanceAllocationInput[] }
  | { operation: "payment.update"; id: string; version: string; date: string; payment_method_id: string | null; reference: string | null; notes: string | null }
  | { operation: "payment.void"; id: string; reason: string }
  | { operation: "application.apply"; source_kind: "payment" | "credit"; source_id: string; allocations: FinanceAllocationInput[] }
  | { operation: "application.unapply"; application_id: string; reason: string }
  | { operation: "credit.create"; document: DocumentInput; source_invoice_id: string | null; reason: string; allocations: FinanceAllocationInput[] }
  | { operation: "credit.update"; id: string; version: string; document: DocumentInput; reason: string }
  | { operation: "credit.void"; id: string; reason: string }
  | { operation: "refund.create"; payment_id: string; credit_note_id: string | null; client_id: string; amount: number; date: string; payment_method_id: string | null; reference: string | null; reason: string }
  | { operation: "refund.void"; id: string; reason: string };

export type FinanceInvoice = { id: string; invoice_number: string; client_id: string | null; client_name: string; issue_date: string; due_date: string; total: number; amount_paid: number; amount_credited: number; balance: number; status: string };
export type FinanceApplication = { id: string; source_kind: "payment" | "credit"; source_id: string; invoice_id: string; invoice_number: string; client_id: string; amount: number; created_at: string; reversed_at: string | null; reversal_reason: string | null; locked_by_refund: boolean };
export type FinancePayment = { id: string; number: string; client_id: string; client_name: string; amount: number; applied_amount: number; refunded_amount: number; available_amount: number; date: string; payment_method_id: string | null; payment_method_name: string | null; reference: string | null; notes: string | null; status: string; voided_at: string | null; updated_at: string; business_snapshot: BusinessSettings | null; finance_version: number };
export type FinanceCredit = { id: string; number: string; client_id: string; client_name: string; source_invoice_id: string | null; total: number; applied_amount: number; refunded_amount: number; available_amount: number; date: string; reason: string | null; status: string; updated_at: string; document: CommercialDocument | null; finance_version: number };
export type FinanceRefund = { id: string; number: string; client_id: string; client_name: string; payment_id: string; credit_note_id: string | null; amount: number; date: string; payment_method_id: string | null; payment_method_name: string | null; reference: string | null; reason: string | null; status: string; updated_at: string; business_snapshot: BusinessSettings | null; finance_version: number };
export type FinanceEvent = { id: string; entity_kind: string; entity_id: string; event_type: string; payload: Record<string, unknown>; created_at: string };
export type FinanceData = { clients: CommercialClient[]; methods: ClientCatalog[]; invoices: FinanceInvoice[]; payments: FinancePayment[]; credits: FinanceCredit[]; refunds: FinanceRefund[]; applications: FinanceApplication[]; events: FinanceEvent[]; settings: BusinessSettings };
