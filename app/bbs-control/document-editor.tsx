"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus, RotateCcw, Trash2, Truck, Percent, X } from "lucide-react";
import { saveCommercialDocument } from "./document-actions";
import { calculateDocumentTotals, calculateDueDate } from "../../lib/bbs-control/document-math";
import type { DiscountMode, DocumentEditorData, DocumentInput, DocumentTotals, EditorTax } from "../../lib/bbs-control/document-types";
import "./document-editor.css";
import type{BbsRole}from"../../lib/bbs-control/types";

type Row = { key: string; item_id: string; sku: string; description: string; quantity: string; unit_price: string; tax_rate: string; discount_percent: string };
type Draft = Omit<DocumentInput, "items" | "discount_value" | "shipping_amount" | "shipping_tax_rate" | "payment_terms_days"> & {
  discount_value: string; shipping_amount: string; shipping_tax_rate: string; payment_terms_days: string;
};
const number = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
const emptyTotals: DocumentTotals = { subtotal: 0, discount_total: 0, net_subtotal: 0, shipping_amount: 0, shipping_tax_total: 0, tax_total: 0, total: 0, items: [] };
const noteTabs = [["public", "Nota pública"], ["private", "Nota privada"], ["footer", "Nota al pie"]] as const;

function blankRow(key: string, tax = 0): Row {
  return { key, item_id: "", sku: "", description: "", quantity: "1", unit_price: "0", tax_rate: String(tax), discount_percent: "0" };
}

function initialDraft(data: DocumentEditorData, sellerName: string, issueDate: string, validUntil: string): Draft {
  const source = data.document || data.sourceQuote;
  return {
    kind: data.kind, document_kind: source?.document_kind || "quote", client_id: source?.client_id || null,
    client_name: source?.client_name || "", client_email: source?.client_email || "", seller_name: source?.seller_name || sellerName,
    billing_address: source?.billing_address || "", shipping_address: source?.shipping_address || "",
    payment_terms: source?.payment_terms || "days", payment_terms_days: String(source?.payment_terms_days ?? data.settings.document_preferences?.default_terms_days ?? 30),
    payment_method_id: source?.payment_method_id || null, payment_method_name: source?.payment_method_name || null,
    tax_exempt: source?.tax_exempt || false, issue_date: data.document?.issue_date || issueDate,
    valid_until: data.document?.valid_until || validUntil, purchase_order: source?.purchase_order || "",
    project_description: source?.project_description || "", public_notes: source ? source.public_notes || "" : data.settings.document_preferences?.default_public_notes || "", private_notes: source?.private_notes || "",
    footer_notes: source ? source.footer_notes || "" : data.settings.document_preferences?.default_footer_notes || "", discount_mode: source?.discount_mode || "none", discount_value: String(source?.discount_value ?? 0),
    shipping_amount: String(source?.shipping_amount ?? 0), shipping_tax_rate: String(source?.shipping_tax_rate ?? 0),
  };
}

function initialRows(data: DocumentEditorData): Row[] {
  const source = data.document || data.sourceQuote;
  return source?.items.length ? source.items.map((item, index) => ({ key: `row-${index}`, item_id: item.item_id || "", sku: item.sku || "",
    description: item.description, quantity: String(item.quantity), unit_price: String(item.unit_price), tax_rate: String(item.tax_rate), discount_percent: String(item.discount_percent) })) : [blankRow("row-0",data.taxes.find(t=>t.is_default)?.rate)];
}

function TaxSelect({ taxes, value, onChange, label, disabled = false }: { taxes: EditorTax[]; value: string; onChange: (value: string) => void; label: string; disabled?: boolean }) {
  const rate = number(value);
  const rates = taxes.filter((tax, index, list) => tax.rate !== 0 && list.findIndex((entry) => entry.rate === tax.rate) === index);
  return <select className="bbs-select" aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
    <option value="0">[Ninguno]</option>
    {rates.map((tax) => <option value={String(tax.rate)} key={tax.id}>{tax.name} ({tax.rate}%)</option>)}
    {rate !== 0 && !rates.some((tax) => tax.rate === rate) ? <option value={value}>{rate}%</option> : null}
  </select>;
}

export function DocumentEditor({ data, sellerName, issueDate, validUntil,actorRole="admin" }: { data: DocumentEditorData; sellerName: string; issueDate: string; validUntil: string;actorRole?:BbsRole }) {
  const [draft, setDraft] = useState(() => initialDraft(data, sellerName, issueDate, validUntil));
  const [rows, setRows] = useState(() => initialRows(data));
  const rowSequence = useRef(rows.length);
  const requestId = useRef<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const [tab, setTab] = useState<(typeof noteTabs)[number][0]>("public");
  const [saveIntent, setSaveIntent] = useState("save");
  const [previewPending, setPreviewPending] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewLink, setPreviewLink] = useState("");
  const previewUrls = useRef<string[]>([]);
  const [discountForm, setDiscountForm] = useState({ mode: draft.discount_mode, value: draft.discount_value });
  const [discountError, setDiscountError] = useState("");
  const [shippingForm, setShippingForm] = useState({ amount: draft.shipping_amount, tax: draft.shipping_tax_rate });
  const [shippingError, setShippingError] = useState("");
  const discountDialog = useRef<HTMLDialogElement>(null);
  const shippingDialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const isInvoice = data.kind === "invoice";
  const locked = Boolean(data.document && (isInvoice ? data.document.amount_paid > 0 || Number(data.document.amount_credited || 0) > 0 || ["paid", "partial", "void"].includes(data.document.status) : actorRole==="cotizador"&&!["draft","sent"].includes(data.document.status)));
  const noun = isInvoice ? "prefactura" : draft.document_kind === "estimate" ? "estimado" : "cotización";
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  function payload(): DocumentInput {
    return { ...draft, payment_terms_days: draft.payment_terms === "cod" ? 0 : number(draft.payment_terms_days),
      discount_value: number(draft.discount_value), shipping_amount: number(draft.shipping_amount), shipping_tax_rate: number(draft.shipping_tax_rate),
      items: rows.map((row) => ({ item_id: row.item_id || null, sku: row.sku || null, description: row.description,
        quantity: number(row.quantity), unit_price: number(row.unit_price), tax_rate: number(row.tax_rate),
        discount_percent: draft.discount_mode === "line" ? number(row.discount_percent) : 0 })) };
  }

  const input = payload();
  const [initialContent] = useState(() => JSON.stringify(input));
  const hasUnsavedChanges = JSON.stringify(input) !== initialContent;
  let totals = emptyTotals;
  let calculationError = "";
  try { totals = calculateDocumentTotals(input); }
  catch (error) { calculationError = error instanceof Error ? error.message : "Revise los importes del documento."; }
  const business = data.document?.business_snapshot || data.sourceQuote?.business_snapshot || data.settings;
  const currency = new Intl.NumberFormat("es-PA", { style: "currency", currency: business.currency || "USD" });
  const money = (value: number) => currency.format(value);
  let dueDate = "";
  try { dueDate = calculateDueDate(draft.issue_date, draft.payment_terms, number(draft.payment_terms_days)); } catch { /* Empty date remains editable. */ }

  const [result, formAction, pending] = useActionState(async (_previous: { error: string }, formData: FormData) => {
    if (locked) return { error: "Este documento es de solo lectura y no puede modificarse." };
    requestId.current ||= crypto.randomUUID();
    formData.set("payload", JSON.stringify(payload()));
    formData.set("request_id", requestId.current);
    if (data.document) { formData.set("document_id", data.document.id); formData.set("version", data.document.updated_at); }
    if (data.sourceQuote) formData.set("source_quote_id", data.sourceQuote.id);
    return await saveCommercialDocument(formData);
  }, { error: "" });

  useEffect(() => {
    const urls = previewUrls.current;
    return () => { for (const url of urls) URL.revokeObjectURL(url); };
  }, []);
  useEffect(() => {
    if (!hasUnsavedChanges || pending || locked) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, pending, locked]);

  function selectClient(clientId: string) {
    const client = data.clients.find((entry) => entry.id === clientId);
    if (!client) { update("client_id", null); return; }
    setDraft((current) => ({ ...current, client_id: client.id, client_name: client.name, client_email: client.email || "",
      seller_name: client.salesperson_name || sellerName, billing_address: client.address || "", shipping_address: client.shipping_address || "",
      payment_terms: client.payment_terms, payment_terms_days: String(client.payment_terms_days), payment_method_id: client.payment_method_id,
      payment_method_name: client.payment_method_name, tax_exempt: client.tax_exempt,
    }));
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function selectItem(index: number, itemId: string) {
    const item = data.items.find((entry) => entry.id === itemId);
    if (!item) { updateRow(index, { item_id: "", sku: "" }); return; }
    updateRow(index, { item_id: item.id, sku: item.sku || "", description: item.description || item.name,
      unit_price: String(item.unit_price), tax_rate: String(item.tax_rate) });
  }

  function clear() {
    if (!window.confirm(data.document ? "¿Descartar los cambios sin guardar?" : `¿Borrar los datos de esta ${isInvoice ? "prefactura" : "cotización"} sin guardar?`)) return;
    const resetData = data.document ? data : { ...data, document: null, sourceQuote: null };
    const resetRows = initialRows(resetData);
    setDraft(initialDraft(resetData, sellerName, issueDate, validUntil));
    setRows(resetRows); rowSequence.current = resetRows.length; requestId.current = null; setPreviewError(""); setPreviewLink("");
  }

  async function preview() {
    if (locked) return;
    if (!form.current?.reportValidity()) return;
    if (calculationError) { setPreviewError(calculationError); return; }
    const target = window.open("about:blank", "_blank");
    setPreviewPending(true); setPreviewError(""); setPreviewLink("");
    try {
      const response = await fetch("/api/bbs-control/documents/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(), document_id: data.document?.id, source_quote_id: data.sourceQuote?.id }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || "No se pudo generar la vista previa."); }
      const url = URL.createObjectURL(await response.blob()); previewUrls.current.push(url);
      if (target) target.location.href = url; else setPreviewLink(url);
    } catch (error) { target?.close(); setPreviewError(error instanceof Error ? error.message : "No se pudo generar la vista previa."); }
    finally { setPreviewPending(false); }
  }

  return <div className="bbs-document-editor">
    <form ref={form} action={formAction} aria-busy={pending} className="bbs-document-form">
      {result.error || previewError ? <div role="alert" className="bbs-message bbs-message-error bbs-document-errors"><p>{result.error || previewError}</p></div> : null}
      {locked && data.document ? <div role="status" className="bbs-document-snapshot">
        <p>{!isInvoice?"Esta cotización ya fue revisada y es de solo lectura para su rol.":data.document.status === "void" ? "Esta prefactura está anulada y es de solo lectura." : "Esta prefactura tiene pagos o créditos aplicados y es de solo lectura."}</p>
        <p>Puede consultar y descargar el documento guardado desde <Link href={`/bbs-control/${isInvoice?"facturas":"cotizaciones"}/${data.document.id}`}>Ver detalle</Link>.</p>
      </div> : null}
      {data.sourceQuote ? <p className="bbs-document-snapshot">Prefactura a partir de {data.sourceQuote.number}. Sus condiciones y artículos se han conservado.</p> : null}
      <fieldset disabled={pending || locked}>
        <div className="bbs-document-header">
          <div className="bbs-document-brand"><Image src="/brand/bbs-primary-horizontal-color.png" alt="Biomedical Business and Service" width={382} height={98} priority />
            <p>{business.business_name}</p><p>{business.address}</p><p>{business.phone}</p><p>{business.email}</p>
          </div>
          <div className="bbs-document-metadata">
            <label className="bbs-document-field">Cliente:<select className="bbs-select" name="client_id" required={isInvoice||actorRole==="cotizador"} value={draft.client_id || ""} onChange={(event) => selectClient(event.target.value)}>
              <option value="">{isInvoice||actorRole==="cotizador"?"Seleccione un cliente":"Cliente manual"}</option>{data.clients.map((client) => <option value={client.id} key={client.id}>{client.name}{!client.is_active ? " (inactivo)" : ""}</option>)}
            </select></label>
            <label className="bbs-document-field">Nombre del cliente:<input className="bbs-input" name="client_name" minLength={2} maxLength={200} required value={draft.client_name} onChange={(event) => update("client_name", event.target.value)} /></label>
            <label className="bbs-document-field">Correo electrónico:<input className="bbs-input" name="client_email" type="email" maxLength={254} value={draft.client_email || ""} onChange={(event) => update("client_email", event.target.value)} /></label>
            <label className="bbs-document-field">Fecha:<input className="bbs-input" name="issue_date" type="date" required value={draft.issue_date} onChange={(event) => update("issue_date", event.target.value)} /></label>
            <label className="bbs-document-field">Nº de {noun}:<input className="bbs-input" value={data.document?.number || "Automático al guardar"} readOnly aria-label={`Número de ${noun}`} /></label>
            {!isInvoice ? <label className="bbs-document-field">Válida hasta:<input className="bbs-input" name="valid_until" type="date" min={draft.issue_date} required value={draft.valid_until} onChange={(event) => update("valid_until", event.target.value)} /></label> : null}
            <div className="bbs-document-field"><label htmlFor={`${id}-terms`}>Condiciones de pago:</label><div className="bbs-document-inline">
              <select id={`${id}-terms`} className="bbs-select" name="payment_terms" value={draft.payment_terms} onChange={(event) => update("payment_terms", event.target.value as "cod" | "days")}><option value="cod">COD</option><option value="days">Pago en días</option></select>
              {draft.payment_terms === "days" ? <input className="bbs-input" name="payment_terms_days" type="number" min={0} max={3650} step={1} required aria-label="Días para pagar" value={draft.payment_terms_days} onChange={(event) => update("payment_terms_days", event.target.value)} /> : null}
            </div></div>
            {isInvoice ? <label className="bbs-document-field">Fecha de vencimiento:<input className="bbs-input" type="date" name="due_date" value={dueDate} readOnly /></label> : null}
            <label className="bbs-document-field">Método de pago:<select className="bbs-select" name="payment_method_id" value={draft.payment_method_id || ""} onChange={(event) => {
              const method = data.methods.find((entry) => entry.id === event.target.value); setDraft((current) => ({ ...current, payment_method_id: method?.id || null, payment_method_name: method?.name || null }));
            }}><option value="">Sin método predeterminado</option>{data.methods.map((method) => <option value={method.id} key={method.id}>{method.name}</option>)}
              {draft.payment_method_id && !data.methods.some((method) => method.id === draft.payment_method_id) ? <option value={draft.payment_method_id}>{draft.payment_method_name || "Método del documento"}</option> : null}
            </select></label>
            <label className="bbs-document-field">Nº orden de compra:<input className="bbs-input" name="purchase_order" maxLength={200} value={draft.purchase_order || ""} onChange={(event) => update("purchase_order", event.target.value)} /></label>
            <label className="bbs-document-field">Vendedor:<input className="bbs-input" name="seller_name" list={`${id}-sellers`} minLength={2} maxLength={200} required value={draft.seller_name} onChange={(event) => update("seller_name", event.target.value)} /></label>
            <datalist id={`${id}-sellers`}>{data.sellers.map((seller) => <option value={seller.name} key={seller.id} />)}</datalist>
          </div>
        </div>
        <div className="bbs-document-addresses">
          <label className="bbs-document-field">Dirección de facturación:<textarea className="bbs-textarea" name="billing_address" maxLength={2000} value={draft.billing_address || ""} onChange={(event) => update("billing_address", event.target.value)} /></label>
          <div><label className="bbs-document-field">Dirección de envío:<textarea className="bbs-textarea" name="shipping_address" maxLength={2000} value={draft.shipping_address || ""} onChange={(event) => update("shipping_address", event.target.value)} /></label>
            <button className="bbs-text-button" type="button" onClick={() => update("shipping_address", draft.billing_address)}>Copiar dirección de facturación</button></div>
        </div>
        <label className="bbs-document-field">Descripción del proyecto:<textarea className="bbs-textarea" name="project_description" maxLength={5000} value={draft.project_description || ""} onChange={(event) => update("project_description", event.target.value)} /></label>
        <div className="bbs-document-options"><label className="bbs-checkbox"><input type="checkbox" name="tax_exempt" checked={draft.tax_exempt} onChange={(event) => update("tax_exempt", event.target.checked)} />Cliente exento de impuestos</label>
          {!isInvoice ? <label className="bbs-document-inline">Tipo:<select className="bbs-select" name="document_kind" value={draft.document_kind} onChange={(event) => update("document_kind", event.target.value as "quote" | "estimate")}><option value="quote">Cotización</option><option value="estimate">Estimado</option></select></label> : null}
        </div>
        <div className="bbs-table-scroll"><table className="bbs-document-lines"><thead><tr>
          <th className="bbs-doc-qty" scope="col">Cant.</th><th className="bbs-doc-code" scope="col">Cód. artículo</th><th scope="col">Descripción</th><th className="bbs-doc-price" scope="col">Precio unitario</th>
          {draft.discount_mode === "line" ? <th className="bbs-doc-discount" scope="col">Desc. %</th> : null}<th className="bbs-doc-tax" scope="col">Impuesto</th><th className="bbs-doc-total" scope="col">Total</th><th className="bbs-doc-remove" scope="col"><span className="sr-only">Quitar</span></th>
        </tr></thead><tbody>{rows.map((row, index) => <tr key={row.key}>
          <td><input className="bbs-input" type="number" min="0.01" step="0.01" name={`item_quantity_${index}`} required aria-label={`Cantidad ${index + 1}`} value={row.quantity} onChange={(event) => updateRow(index, { quantity: event.target.value })} /></td>
          <td><select className="bbs-select" name={`item_id_${index}`} aria-label={`Artículo ${index + 1}`} value={row.item_id} onChange={(event) => selectItem(index, event.target.value)}><option value="">{!row.item_id && row.sku ? row.sku : "Manual"}</option>{data.items.map((item) => <option value={item.id} key={item.id}>{item.sku || item.name}</option>)}
            {row.item_id && !data.items.some((item) => item.id === row.item_id) ? <option value={row.item_id}>{row.sku || "Artículo del documento"}</option> : null}</select></td>
          <td><textarea className="bbs-textarea" name={`item_description_${index}`} rows={2} minLength={2} maxLength={5000} required aria-label={`Descripción ${index + 1}`} value={row.description} onChange={(event) => updateRow(index, { description: event.target.value })} /></td>
          <td><input className="bbs-input" type="number" min="0" step="0.01" name={`item_unit_price_${index}`} required aria-label={`Precio unitario ${index + 1}`} value={row.unit_price} onChange={(event) => updateRow(index, { unit_price: event.target.value })} /></td>
          {draft.discount_mode === "line" ? <td><input className="bbs-input" type="number" min="0" max="100" step="0.01" required aria-label={`Descuento porcentual ${index + 1}`} value={row.discount_percent} onChange={(event) => updateRow(index, { discount_percent: event.target.value })} /></td> : null}
          <td><TaxSelect taxes={data.taxes} value={row.tax_rate} label={`Impuesto ${index + 1}`} disabled={draft.tax_exempt} onChange={(value) => updateRow(index, { tax_rate: value })} /></td>
          <td><output className="bbs-document-line-total" aria-label={`Total de línea ${index + 1}`}>{money(totals.items[index]?.line_total || 0)}</output></td>
          <td><button className="bbs-document-remove" type="button" aria-label={`Quitar línea ${index + 1}`} onClick={() => setRows((current) => current.length === 1 ? [blankRow(`row-${rowSequence.current++}`)] : current.filter((_, currentIndex) => currentIndex !== index))}><Trash2 size={16} /></button></td>
        </tr>)}</tbody></table></div>
        <div className="bbs-document-line-actions">
          <button className="bbs-button" type="button" onClick={() => setRows((current) => [...current, blankRow(`row-${rowSequence.current++}`,data.taxes.find(t=>t.is_default)?.rate)])}><Plus size={15} />Agregar artículo</button>
          <button className="bbs-button" type="button" onClick={() => { setDiscountForm({ mode: draft.discount_mode, value: draft.discount_value }); setDiscountError(""); discountDialog.current?.showModal(); }}><Percent size={15} />{draft.discount_mode === "none" ? "Añadir descuento" : "Editar descuento"}</button>
          <button className="bbs-button" type="button" onClick={() => { setShippingForm({ amount: draft.shipping_amount, tax: draft.shipping_tax_rate }); setShippingError(""); shippingDialog.current?.showModal(); }}><Truck size={15} />{number(draft.shipping_amount) ? "Editar envío" : "Añadir envío"}</button>
        </div>
        <div className="bbs-document-footer"><div className="bbs-document-notes">
          <div role="tablist" aria-label="Notas del documento" className="bbs-note-tabs">{noteTabs.map(([key, label], index) => <button id={`${id}-${key}-tab`} key={key} role="tab" type="button" aria-controls={`${id}-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % noteTabs.length;
            else if (event.key === "ArrowLeft") next = (index + noteTabs.length - 1) % noteTabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = noteTabs.length - 1;
            else return;
            event.preventDefault(); setTab(noteTabs[next][0]); document.getElementById(`${id}-${noteTabs[next][0]}-tab`)?.focus();
          }}>{label}</button>)}</div>
          <div role="tabpanel" hidden={tab !== "public"} id={`${id}-public-panel`} aria-labelledby={`${id}-public-tab`}><textarea className="bbs-textarea" name="public_notes" aria-label="Nota pública" maxLength={10000} value={draft.public_notes || ""} onChange={(event) => update("public_notes", event.target.value)} /></div>
          <div role="tabpanel" hidden={tab !== "private"} id={`${id}-private-panel`} aria-labelledby={`${id}-private-tab`}><textarea className="bbs-textarea" name="private_notes" aria-label="Nota privada" maxLength={10000} value={draft.private_notes || ""} onChange={(event) => update("private_notes", event.target.value)} /><p className="bbs-field-hint">Esta nota no se imprime ni se envía al cliente.</p></div>
          <div role="tabpanel" hidden={tab !== "footer"} id={`${id}-footer-panel`} aria-labelledby={`${id}-footer-tab`}><textarea className="bbs-textarea" name="footer_notes" aria-label="Nota al pie" maxLength={10000} value={draft.footer_notes || ""} onChange={(event) => update("footer_notes", event.target.value)} /></div>
        </div><div>
          {calculationError ? <p className="bbs-message bbs-message-error" role="alert">{calculationError}</p> : null}
          <dl className="bbs-document-totals"><div><dt>Subtotal:</dt><dd>{money(totals.subtotal)}</dd></div>
            {draft.discount_mode !== "none" ? <div><dt>Descuento{draft.discount_mode === "percent" ? ` (${draft.discount_value}%)` : ""}:</dt><dd>−{money(totals.discount_total)}</dd></div> : null}
            {number(draft.shipping_amount) ? <div><dt>Envío:</dt><dd>{money(totals.shipping_amount)}</dd></div> : null}
            <div><dt>Impuestos{draft.tax_exempt ? " (exento)" : ""}:</dt><dd>{money(totals.tax_total)}</dd></div>
            <div className="bbs-document-grand-total"><dt>Total:</dt><dd><output aria-label="Total del documento">{money(totals.total)}</output></dd></div>
          </dl>
        </div></div>
        <div className="bbs-document-savebar">
          <div className="bbs-document-reset-actions">
            {data.document ? <Link href={isInvoice ? "/bbs-control/facturas" : "/bbs-control/cotizaciones"} className="bbs-button">Volver</Link> : null}
            <button className="bbs-button" type="button" onClick={clear}><RotateCcw size={15} />{data.document ? "Descartar cambios" : `Borrar ${noun}`}</button>
          </div>
          <div className="bbs-document-save-actions">
            <button className="bbs-button" type="button" disabled={previewPending} onClick={preview}>{previewPending ? "Preparando vista previa…" : "Vista previa"}</button>
            {isInvoice && (!data.document || data.document.status === "draft") ? <button className="bbs-button" type="submit" name="intent" value="draft" disabled={previewPending || Boolean(calculationError)}>Guardar borrador</button> : null}
            <label className="sr-only" htmlFor={`${id}-save-intent`}>Acción después de guardar</label><select id={`${id}-save-intent`} className="bbs-select" value={saveIntent} onChange={(event) => setSaveIntent(event.target.value)}><option value="save">Guardar documento</option><option value="email">Guardar y enviar por correo</option><option value="preview">Guardar y ver / imprimir PDF</option><option value="download">Guardar y descargar</option>{isInvoice?<><option value="payment">Guardar y aplicar pago</option><option value="recurring">Guardar y crear recurrente</option></>:null}</select>
            <button className="bbs-button bbs-button-primary" type="submit" name="intent" value={saveIntent} disabled={previewPending || Boolean(calculationError)}>{pending ? "Guardando…" : isInvoice && data.document?.status === "draft" ? "Emitir prefactura" : data.document ? "Guardar cambios" : isInvoice ? "Crear prefactura" : draft.document_kind === "estimate" ? "Crear estimado" : "Crear cotización"}</button>
          </div>
        </div>
        {previewLink ? <p className="bbs-field-hint"><a href={previewLink} target="_blank" rel="noopener noreferrer">Abrir vista previa PDF</a></p> : null}
      </fieldset>
    </form>
    <dialog ref={discountDialog} className="bbs-dialog bbs-document-dialog" aria-labelledby={`${id}-discount-title`}>
      <div className="bbs-dialog-header"><h2 id={`${id}-discount-title`}>Aplicar descuento</h2><button className="bbs-button" type="button" aria-label="Cerrar descuento" onClick={() => discountDialog.current?.close()}><X size={18} /></button></div>
      <form onSubmit={(event) => {
        event.preventDefault();
        try { calculateDocumentTotals({ ...input, discount_mode: discountForm.mode, discount_value: number(discountForm.value) }); }
        catch (error) { setDiscountError(error instanceof Error ? error.message : "Descuento inválido."); return; }
        setDraft((current) => ({ ...current, discount_mode: discountForm.mode, discount_value: discountForm.value })); discountDialog.current?.close();
      }}>
        <div className="bbs-document-discount-options">{[["none", "Sin descuento"], ["fixed", `Descuento fijo sobre el total de la ${isInvoice ? "prefactura" : "cotización"}.`], ["percent", "Descuento porcentual sobre el total."], ["line", "Aplicar descuentos línea por línea a artículos específicos."]].map(([mode, label]) => <label key={mode}><input type="radio" name="discount_mode" value={mode} checked={discountForm.mode === mode} onChange={() => setDiscountForm((current) => ({ ...current, mode: mode as DiscountMode }))} />{label}</label>)}</div>
        {discountForm.mode === "fixed" || discountForm.mode === "percent" ? <label className="bbs-document-discount-amount">{discountForm.mode === "fixed" ? "Importe del descuento:" : "Porcentaje de descuento:"}<input className="bbs-input" type="number" min={0} max={discountForm.mode === "percent" ? 100 : undefined} step="0.01" required value={discountForm.value} onChange={(event) => setDiscountForm((current) => ({ ...current, value: event.target.value }))} /></label> : null}
        {discountError ? <p className="bbs-message bbs-message-error" role="alert">{discountError}</p> : null}
        <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary">Aplicar</button><button className="bbs-button" type="button" onClick={() => discountDialog.current?.close()}>Cancelar</button></div>
      </form>
    </dialog>
    <dialog ref={shippingDialog} className="bbs-dialog bbs-document-dialog" aria-labelledby={`${id}-shipping-title`}>
      <div className="bbs-dialog-header"><h2 id={`${id}-shipping-title`}>Gastos de envío</h2><button className="bbs-button" type="button" aria-label="Cerrar envío" onClick={() => shippingDialog.current?.close()}><X size={18} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); if (number(shippingForm.amount) < 0) { setShippingError("El envío no puede ser negativo."); return; }
        setDraft((current) => ({ ...current, shipping_amount: shippingForm.amount, shipping_tax_rate: shippingForm.tax })); shippingDialog.current?.close(); }}>
        <div className="bbs-document-shipping-options"><label>Importe de envío:<input className="bbs-input" type="number" min={0} step="0.01" required value={shippingForm.amount} onChange={(event) => setShippingForm((current) => ({ ...current, amount: event.target.value }))} /></label>
          <label>Impuesto del envío:<TaxSelect taxes={data.taxes} value={shippingForm.tax} label="Impuesto del envío" disabled={draft.tax_exempt} onChange={(value) => setShippingForm((current) => ({ ...current, tax: value }))} /></label></div>
        {shippingError ? <p role="alert" className="bbs-message bbs-message-error">{shippingError}</p> : null}
        <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary">Aplicar</button><button className="bbs-button" type="button" onClick={() => shippingDialog.current?.close()}>Cancelar</button></div>
      </form>
    </dialog>
  </div>;
}
