import { createSupabaseServerClient,requireCapability } from "./supabase-server";
import {can} from "./permissions";
import { getBusinessSettings } from "./quotes";
import { readAllPages } from "./dashboard";
import { calculateDocumentTotals } from "./document-math";
import { quoteLineTotal } from "./quote-totals";
import { documentInputSchema } from "./document-validation";
import type { CommercialClient, ClientCatalog } from "./client-commercial";
import type { CommercialDocument, DocumentEditorData, DocumentInput, DocumentKind, EditorCatalogItem, EditorTax } from "./document-types";

export async function getCommercialDocument(kind: DocumentKind, id: string): Promise<CommercialDocument | null> {
  const supabase = await createSupabaseServerClient();
  const table = kind === "quote" ? "quotes" : "invoices";
  const { data: row, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo cargar el documento.");
  if (!row) return null;
  const lines = await readAllPages<Record<string, unknown>>((from, to) => supabase.from(kind === "quote" ? "quote_items" : "invoice_items")
    .select("*", { count: "exact" }).eq(kind === "quote" ? "quote_id" : "invoice_id", id).order("position").order("id").range(from, to));
  if (lines.error) throw new Error("No se pudieron cargar los artículos.");
  const version = Number(row.commercial_version || 0);
  const items = (lines.data || []).map((item) => ({
    item_id: item.item_id as string | null, description: String(item.description), quantity: Number(item.quantity), unit_price: Number(item.unit_price),
    sku: item.sku_snapshot as string | null || null,
    tax_rate: version ? Number(item.commercial_tax_rate || 0) : Number((Number(item.tax_rate || 0) * 100).toFixed(4)),
    discount_percent: Number(item.discount_percent || 0),
    gross_total: version ? Number(item.commercial_gross_total) : quoteLineTotal(Number(item.quantity), Number(item.unit_price)),
    discount_total: version ? Number(item.commercial_discount_total) : 0,
    net_total: version ? Number(item.commercial_net_total) : quoteLineTotal(Number(item.quantity), Number(item.unit_price)),
    tax_total: version ? Number(item.commercial_tax_total) : Math.round((Number(item.line_total) - quoteLineTotal(Number(item.quantity), Number(item.unit_price))) * 100) / 100,
    line_total: version ? Number(item.commercial_line_total) : Number(item.line_total),
  }));
  let legacyClient = null;
  if (!version && row.client_id) {
    const result = await supabase.from("clients").select("address").eq("id", row.client_id).maybeSingle();
    legacyClient = result.data;
  }
  const subtotal = Number(row.subtotal);
  return {
    kind, document_kind: row.document_kind || "quote", id: row.id, number: kind === "quote" ? row.quote_number : row.invoice_number,
    client_id: row.client_id, client_name: row.client_name, client_email: row.client_email,
    seller_name: row.seller_name, billing_address: version ? row.billing_address : legacyClient?.address || null,
    shipping_address: row.shipping_address || null, payment_terms: row.payment_terms || "days", payment_terms_days: Number(row.payment_terms_days ?? 30),
    payment_method_id: row.payment_method_id || null, payment_method_name: row.payment_method_name || null, tax_exempt: Boolean(row.tax_exempt),
    issue_date: row.issue_date, valid_until: row.valid_until || row.due_date || row.issue_date, due_date: row.due_date || row.issue_date,
    purchase_order: row.purchase_order || null, project_description: row.project_description || null,
    public_notes: row.notes || null, private_notes: row.private_notes || null, footer_notes: row.footer_notes || null,
    discount_mode: row.discount_mode || "none", discount_value: Number(row.discount_value || 0),
    shipping_amount: Number(row.shipping_amount || 0), shipping_tax_rate: Number(row.shipping_tax_rate || 0),
    subtotal, discount_total: Number(row.discount_total || 0), net_subtotal: version ? Number(row.net_subtotal) : subtotal,
    shipping_tax_total: Number(row.shipping_tax_total || 0), tax_total: version ? Number(row.tax_total || 0) : Math.round(items.reduce((sum, item) => sum + item.tax_total, 0) * 100) / 100, total: Number(row.total),
    items, status: row.status, created_at: row.created_at, updated_at: row.updated_at, amount_paid: Number(row.amount_paid || 0), amount_credited: Number(row.amount_credited || 0),
    source_quote_id: row.quote_id || null, source_worksheet_id: row.source_worksheet_id || null, source_worksheet_number: row.source_worksheet_number || null, commercial_version: version, business_snapshot: row.business_snapshot || null, emailed_at: row.emailed_at || null,
  };
}

export async function getDocumentEditorData(kind: DocumentKind, id?: string, sourceQuoteId?: string): Promise<DocumentEditorData> {
  const actor=await requireCapability(kind==="quote"?"quotes.write":"finance.write");
  const supabase = await createSupabaseServerClient();
  const [document, sourceQuote, settings] = await Promise.all([
    id ? getCommercialDocument(kind, id) : Promise.resolve(null),
    sourceQuoteId ? getCommercialDocument("quote", sourceQuoteId) : Promise.resolve(null), getBusinessSettings(),
  ]);
  if (id && !document) throw new Error("Documento no encontrado.");
  if (sourceQuoteId && !sourceQuote) throw new Error("Cotización de origen no encontrada.");
  if(!can(actor.role,"finance.read")){
    const [clients,catalog]=await Promise.all([supabase.rpc("get_quote_clients"),supabase.rpc("get_quote_catalog")]);
    if(clients.error||catalog.error)throw new Error("No se pudieron cargar los clientes y artículos aprobados.");
    const safe=catalog.data as {items:EditorCatalogItem[];taxes:EditorTax[];methods:ClientCatalog[];sellers:ClientCatalog[]};
    return {kind,document,sourceQuote,settings,clients:clients.data as CommercialClient[],...safe};
  }
  const [clients, items, taxes, methods, sellers] = await Promise.all([
    readAllPages<CommercialClient>((from, to) => {
      let query = supabase.from("bbs_client_directory").select("*", { count: "exact" }).order("name").order("id");
      const clientId = document?.client_id || sourceQuote?.client_id;
      query = clientId ? query.or(`is_active.eq.true,id.eq.${clientId}`) : query.eq("is_active", true);
      return query.range(from, to);
    }),
    readAllPages<Record<string, unknown>>((from, to) => supabase.from("items").select("*", { count: "exact" }).eq("is_active", true).order("name").order("id").range(from, to)),
    readAllPages<EditorTax>((from, to) => supabase.from("tax_rates").select("id,name,rate,is_default", { count: "exact" }).eq("is_active", true).order("rate").order("id").range(from, to)),
    readAllPages<ClientCatalog>((from, to) => supabase.from("payment_methods").select("id,name", { count: "exact" }).order("name").order("id").range(from, to)),
    readAllPages<ClientCatalog>((from, to) => supabase.from("salespeople").select("id,name", { count: "exact" }).order("name").order("id").range(from, to)),
  ]);
  if (clients.error || items.error || taxes.error || methods.error || sellers.error) throw new Error("No se pudieron cargar los catálogos comerciales.");
  const rates = (taxes.data || []).map((tax) => ({ ...tax, rate: Number((Number(tax.rate) * 100).toFixed(4)) }));
  return { kind, document, sourceQuote, settings, clients: clients.data || [], taxes: rates, methods: methods.data || [], sellers: sellers.data || [],
    items: (items.data || []).map((item): EditorCatalogItem => ({ id: String(item.id), sku: item.sku as string | null, name: String(item.name),
      description: item.description as string | null, unit_price: Number(item.unit_price), tax_rate: rates.find((rate) => rate.id === item.tax_rate_id)?.rate ?? rates.find((rate) => rate.is_default)?.rate ?? 0 })) };
}

export type SaveDocumentOptions = { documentId?: string; version?: string; requestId: string; sourceQuoteId?: string | null; draft?: boolean };
export async function saveDocumentRecord(input: DocumentInput, options: SaveDocumentOptions): Promise<string> {
  const parsed = documentInputSchema.parse(input);
  calculateDocumentTotals(parsed);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_commercial_document", {
    p_document: parsed, p_document_id: options.documentId || null, p_expected_version: options.version || null,
    p_request_id: options.requestId, p_source_quote_id: options.sourceQuoteId || null, p_draft: Boolean(options.draft),
  });
  if (error) throw new Error(error.message || "No se pudo guardar el documento.");
  return String(data);
}
