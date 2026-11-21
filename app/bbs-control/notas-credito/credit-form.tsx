"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { calculateDocumentTotals } from "../../../lib/bbs-control/document-math";
import type { CommercialDocument, DiscountMode, DocumentEditorData, DocumentInput } from "../../../lib/bbs-control/document-types";
import type { FinanceCredit, FinanceData } from "../../../lib/bbs-control/finance-types";
import { money } from "../../../lib/bbs-control/format";
import { InvoiceAllocations, useFinanceAction } from "../finance-forms";
import { saveCredit } from "./actions";
import "../document-editor.css";
import "../finance.css";

type Row = { key: number; item_id: string; sku: string; description: string; quantity: string; unit_price: string; tax_rate: string; discount_percent: string };
const numeric = (value: string) => Number(value || 0);
const blank = (key: number): Row => ({ key, item_id: "", sku: "", description: "", quantity: "1", unit_price: "0", tax_rate: "0", discount_percent: "0" });

export function CreditNoteForm({ data, catalog, source: invoice, credit, today, seller, clientId: initialClient = "" }: { data: FinanceData; catalog: DocumentEditorData; source: CommercialDocument | null; credit?: FinanceCredit; today: string; seller: string; clientId?: string }) {
  const source = credit?.document || invoice;
  const sourceInvoiceId = credit?.source_invoice_id || invoice?.id;
  const [clientId, setClient] = useState(source?.client_id || initialClient);
  const client = data.clients.find((entry) => entry.id === clientId);
  const [name, setName] = useState(source?.client_name || client?.name || "");
  const [email, setEmail] = useState(source?.client_email || client?.email || "");
  const [billing, setBilling] = useState(source?.billing_address || client?.address || "");
  const [shipping, setShipping] = useState(source?.shipping_address || client?.shipping_address || "");
  const [sellerName, setSeller] = useState(source?.seller_name || client?.salesperson_name || seller);
  const [date, setDate] = useState(credit?.date || today);
  const [reason, setReason] = useState(credit?.reason || "");
  const [project, setProject] = useState(source?.project_description || "");
  const [exempt, setExempt] = useState(source?.tax_exempt || client?.tax_exempt || false);
  const [discountMode, setDiscount] = useState<DiscountMode>(source?.discount_mode || "none");
  const [discountValue, setDiscountValue] = useState(String(source?.discount_value || 0));
  const [shippingAmount, setShippingAmount] = useState(String(source?.shipping_amount || 0));
  const [shippingTax, setShippingTax] = useState(String(source?.shipping_tax_rate || 0));
  const [notes, setNotes] = useState({ public: source?.public_notes || "", private: source?.private_notes || "", footer: source?.footer_notes || "" });
  const [tab, setTab] = useState<"public" | "private" | "footer">("public");
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>(source?.items.length ? source.items.map((item, index) => ({ key: index, item_id: item.item_id || "", sku: item.sku || "", description: item.description, quantity: String(item.quantity), unit_price: String(item.unit_price), tax_rate: String(item.tax_rate), discount_percent: String(item.discount_percent) })) : [blank(0)]);
  const sequence = useRef(rows.length);
  const business = source?.business_snapshot || data.settings;
  const document: DocumentInput = { kind: "invoice", document_kind: "quote", client_id: clientId || null, client_name: name, client_email: email || null,
    seller_name: sellerName, billing_address: billing || null, shipping_address: shipping || null,
    payment_terms: source?.payment_terms || client?.payment_terms || "days", payment_terms_days: source?.payment_terms_days ?? client?.payment_terms_days ?? 30,
    payment_method_id: source?.payment_method_id || client?.payment_method_id || null, payment_method_name: source?.payment_method_name || client?.payment_method_name || null,
    tax_exempt: exempt, issue_date: date, valid_until: date, purchase_order: source?.purchase_order || null, project_description: project || null,
    public_notes: notes.public || null, private_notes: notes.private || null, footer_notes: notes.footer || null,
    discount_mode: discountMode, discount_value: numeric(discountValue), shipping_amount: numeric(shippingAmount), shipping_tax_rate: numeric(shippingTax),
    items: rows.map((row) => ({ item_id: row.item_id || null, sku: row.sku || null, description: row.description, quantity: numeric(row.quantity), unit_price: numeric(row.unit_price), tax_rate: numeric(row.tax_rate), discount_percent: discountMode === "line" ? numeric(row.discount_percent) : 0 })) };
  let totals: ReturnType<typeof calculateDocumentTotals> | null = null;
  let calculationError = "";
  try { totals = calculateDocumentTotals(document); } catch (error) { calculationError = error instanceof Error ? error.message : "Revise los importes."; }
  const [state, action, pending] = useFinanceAction(() => credit ? { operation: "credit.update", id: credit.id, version: credit.updated_at, document, reason }
    : { operation: "credit.create", document, source_invoice_id: invoice?.id || null, reason,
      allocations: Object.entries(allocations).filter(([, value]) => Number(value) > 0).map(([invoice_id, value]) => ({ invoice_id, amount: Number(value) })) }, saveCredit, credit?.id);
  function selectClient(id: string) {
    const selected = data.clients.find((entry) => entry.id === id); setClient(id); setAllocations({});
    setName(selected?.name || ""); setEmail(selected?.email || ""); setBilling(selected?.address || ""); setShipping(selected?.shipping_address || ""); setSeller(selected?.salesperson_name || seller); setExempt(selected?.tax_exempt || false);
  }
  function updateRow(key: number, values: Partial<Row>) { setRows((current) => current.map((row) => row.key === key ? { ...row, ...values } : row)); }
  return <form action={action} className="bbs-document-form" aria-busy={pending}>
    {state.error || calculationError ? <p className="bbs-message bbs-message-error" role="alert">{state.error || calculationError}</p> : null}
    <fieldset disabled={pending}>
      <div className="bbs-document-header"><div className="bbs-document-brand"><Image src="/brand/bbs-primary-horizontal-color.png" alt="BBS" width={220} height={57} /><p>{business.business_name}</p><p>{business.address}</p><p>{business.phone} {business.email}</p></div>
        <div className="bbs-document-metadata"><label className="bbs-document-field">Número:<input className="bbs-input" value={credit?.number || "Se genera al guardar"} readOnly /></label><label className="bbs-document-field">Fecha:<input className="bbs-input" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="bbs-document-field">Cliente:<select className="bbs-select" required disabled={Boolean(source)} value={clientId} onChange={(event) => selectClient(event.target.value)}><option value="">[Seleccionar cliente]</option>{data.clients.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}{source?.client_id && !data.clients.some((entry) => entry.id === source.client_id) ? <option value={source.client_id}>{source.client_name}</option> : null}</select></label>
          <label className="bbs-document-field">Vendedor:<input className="bbs-input" maxLength={200} value={sellerName} onChange={(event) => setSeller(event.target.value)} list="credit-sellers" /></label><datalist id="credit-sellers">{catalog.sellers.map((entry) => <option key={entry.id} value={entry.name} />)}</datalist>
        </div></div>
      {sourceInvoiceId ? <p className="bbs-finance-source">Creada a partir de <Link href={`/bbs-control/facturas/${sourceInvoiceId}`}>{data.invoices.find((entry) => entry.id === sourceInvoiceId)?.invoice_number || "Ver factura"}</Link>. Se conservan los datos comerciales de la factura. Puede ajustar las cantidades e importes del crédito.</p> : null}
      <div className="bbs-document-addresses"><div className="bbs-document-metadata"><label className="bbs-document-field">Facturar a:<input className="bbs-input" required value={name} maxLength={200} onChange={(event) => setName(event.target.value)} /></label><label className="bbs-document-field">Correo:<input className="bbs-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="bbs-document-field">Dirección:<textarea className="bbs-textarea" value={billing} maxLength={2000} onChange={(event) => setBilling(event.target.value)} /></label></div><label className="bbs-document-field">Enviar a:<textarea className="bbs-textarea" value={shipping} maxLength={2000} onChange={(event) => setShipping(event.target.value)} /></label></div>
      <div className="bbs-finance-fields"><label className="bbs-wide">Motivo del crédito:<textarea className="bbs-textarea" required minLength={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label><label className="bbs-wide">Proyecto / descripción:<textarea className="bbs-textarea" maxLength={5000} value={project} onChange={(event) => setProject(event.target.value)} /></label></div>
      <label className="bbs-checkbox"><input type="checkbox" checked={exempt} onChange={(event) => setExempt(event.target.checked)} />Cliente exento de impuestos</label>
      <div className="bbs-table-scroll"><table className="bbs-document-lines"><thead><tr><th>Cant.</th><th>Artículo</th><th>Descripción</th><th>Precio unitario</th>{discountMode === "line" ? <th>Desc. %</th> : null}<th>Impuesto %</th><th>Total</th><th /></tr></thead><tbody>{rows.map((row, index) => <tr key={row.key}>
        <td className="bbs-doc-qty"><input className="bbs-input" aria-label={`Cantidad ${index + 1}`} type="number" required min="0.01" max="9999999" step="0.01" value={row.quantity} onChange={(event) => updateRow(row.key, { quantity: event.target.value })} /></td>
        <td className="bbs-doc-code"><select className="bbs-select" aria-label={`Artículo ${index + 1}`} value={row.item_id} onChange={(event) => { const item = catalog.items.find((entry) => entry.id === event.target.value); updateRow(row.key, item ? { item_id: item.id, sku: item.sku || "", description: item.description || item.name, unit_price: String(item.unit_price), tax_rate: String(item.tax_rate) } : { item_id: "", sku: "" }); }}><option value="">[Personalizado]</option>{catalog.items.map((item) => <option key={item.id} value={item.id}>{item.sku || item.name}</option>)}</select></td>
        <td><textarea className="bbs-textarea" aria-label={`Descripción ${index + 1}`} required maxLength={5000} value={row.description} onChange={(event) => updateRow(row.key, { description: event.target.value })} /></td>
        <td className="bbs-doc-price"><input className="bbs-input" aria-label={`Precio ${index + 1}`} type="number" required min="0" max="9999999999" step="0.01" value={row.unit_price} onChange={(event) => updateRow(row.key, { unit_price: event.target.value })} /></td>
        {discountMode === "line" ? <td className="bbs-doc-discount"><input className="bbs-input" aria-label={`Descuento ${index + 1}`} type="number" min="0" max="100" step="0.0001" value={row.discount_percent} onChange={(event) => updateRow(row.key, { discount_percent: event.target.value })} /></td> : null}
        <td className="bbs-doc-tax"><input className="bbs-input" aria-label={`Impuesto ${index + 1}`} type="number" min="0" max="100" step="0.0001" disabled={exempt} value={row.tax_rate} onChange={(event) => updateRow(row.key, { tax_rate: event.target.value })} list="credit-tax-rates" /></td><td className="bbs-doc-total"><span className="bbs-document-line-total">{money(totals?.items[index]?.line_total || 0)}</span></td><td><button className="bbs-document-remove" type="button" aria-label={`Quitar artículo ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}>×</button></td>
      </tr>)}</tbody></table></div><datalist id="credit-tax-rates">{catalog.taxes.map((tax) => <option key={tax.id} value={tax.rate}>{tax.name}</option>)}</datalist>
      <button className="bbs-button" type="button" onClick={() => setRows((current) => [...current, blank(sequence.current++)])}>+ Añadir artículo</button>
      <div className="bbs-document-footer"><div className="bbs-document-notes"><div className="bbs-note-tabs" role="tablist">{[["public", "Nota pública"], ["private", "Nota privada"], ["footer", "Nota al pie"]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key as typeof tab)}>{label}</button>)}</div><div role="tabpanel"><textarea className="bbs-textarea" aria-label={tab === "public" ? "Nota pública" : tab === "private" ? "Nota privada" : "Nota al pie"} value={notes[tab]} maxLength={5000} onChange={(event) => setNotes({ ...notes, [tab]: event.target.value })} /></div><p className="bbs-field-hint">Las notas privadas solo aparecen en BBS Control.</p></div>
        <div><div className="bbs-finance-fields" style={{ gridTemplateColumns: "1fr", gap: 8 }}><label>Descuento:<select className="bbs-select" value={discountMode} onChange={(event) => setDiscount(event.target.value as DiscountMode)}><option value="none">Ninguno</option><option value="fixed">Importe fijo</option><option value="percent">Porcentaje</option><option value="line">Por artículo</option></select></label>{["fixed", "percent"].includes(discountMode) ? <label>Valor:<input className="bbs-input" type="number" min="0" max={discountMode === "percent" ? 100 : undefined} step="0.01" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} /></label> : null}<label>Envío:<input className="bbs-input" type="number" min="0" step="0.01" value={shippingAmount} onChange={(event) => setShippingAmount(event.target.value)} /></label><label>Impuesto envío %:<input className="bbs-input" type="number" min="0" max="100" step="0.0001" disabled={exempt} value={shippingTax} onChange={(event) => setShippingTax(event.target.value)} /></label></div>
          <dl className="bbs-document-totals"><div><dt>Subtotal</dt><dd>{money(totals?.subtotal || 0)}</dd></div><div><dt>Descuento</dt><dd>−{money(totals?.discount_total || 0)}</dd></div><div><dt>Envío</dt><dd>{money(totals?.shipping_amount || 0)}</dd></div><div><dt>Impuestos</dt><dd>{money(totals?.tax_total || 0)}</dd></div><div className="bbs-document-grand-total"><dt>Total crédito</dt><dd>{money(totals?.total || 0)}</dd></div></dl></div>
      </div>
      {!credit ? <InvoiceAllocations invoices={data.invoices.filter((entry) => entry.client_id === clientId && entry.balance > 0 && !["draft", "void"].includes(entry.status))} values={allocations} onChange={setAllocations} available={totals?.total || 0} /> : null}
      <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending || Boolean(calculationError) || !totals?.total}>{pending ? "Guardando…" : credit ? "Guardar cambios" : "Emitir nota de crédito"}</button><Link className="bbs-button" href={credit ? `/bbs-control/notas-credito/${credit.id}` : "/bbs-control/notas-credito"}>Cancelar</Link></div>
    </fieldset>
  </form>;
}
