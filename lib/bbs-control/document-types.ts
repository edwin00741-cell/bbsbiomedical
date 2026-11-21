import type { BusinessSettings } from "./types";
import type { CommercialClient, ClientCatalog } from "./client-commercial";

export type DocumentKind = "quote" | "invoice";
export type DiscountMode = "none" | "fixed" | "percent" | "line";
/** All commercial tax/discount rates are percentages: 7 means 7%. */
export type DocumentLineInput = {
  item_id: string | null; description: string; quantity: number; unit_price: number;
  tax_rate: number; discount_percent: number; sku?: string | null;
};
export type CalculatedDocumentLine = DocumentLineInput & {
  gross_total: number; discount_total: number; net_total: number; tax_total: number; line_total: number;
};
export type DocumentTotals = {
  subtotal: number; discount_total: number; net_subtotal: number; shipping_amount: number;
  shipping_tax_total: number; tax_total: number; total: number; items: CalculatedDocumentLine[];
};
export type DocumentInput = {
  kind: DocumentKind; document_kind: "quote" | "estimate";
  client_id: string | null; client_name: string; client_email: string | null;
  seller_name: string; billing_address: string | null; shipping_address: string | null;
  payment_terms: "cod" | "days"; payment_terms_days: number;
  payment_method_id: string | null; payment_method_name: string | null; tax_exempt: boolean;
  issue_date: string; valid_until: string; purchase_order: string | null;
  project_description: string | null; public_notes: string | null; private_notes: string | null; footer_notes: string | null;
  discount_mode: DiscountMode; discount_value: number; shipping_amount: number; shipping_tax_rate: number;
  items: DocumentLineInput[];
};
export type CommercialDocument = Omit<DocumentInput, "items"> & DocumentTotals & {
  id: string; number: string; status: string; updated_at: string; created_at: string;
  due_date: string; amount_paid: number; amount_credited?: number; source_quote_id: string | null;
  commercial_version: number; business_snapshot: BusinessSettings | null;
  source_worksheet_id?: string | null;
  source_worksheet_number?: string | null;
  emailed_at?: string | null;
};
export type EditorCatalogItem = {
  id: string; sku: string | null; name: string; description: string | null; unit_price: number;
  tax_rate: number;
};
export type EditorTax = { id: string; name: string; rate: number; is_default?: boolean };
export type DocumentEditorData = {
  kind: DocumentKind; clients: CommercialClient[]; items: EditorCatalogItem[]; taxes: EditorTax[];
  methods: ClientCatalog[]; sellers: ClientCatalog[]; settings: BusinessSettings;
  document: CommercialDocument | null; sourceQuote: CommercialDocument | null;
};
export type SaveDocumentResult = { error: string };
