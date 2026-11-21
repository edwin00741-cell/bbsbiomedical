"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState, type ChangeEvent } from "react";
import type { ClientCatalog, CommercialClient } from "../../../lib/bbs-control/client-commercial";
import { saveCommercialClient, type ClientActionResult } from "./actions";
import { CatalogManager } from "./catalog-manager";

export function ClientForm({ client, groups, salespeople, methods, returnTo }: {
  client?: CommercialClient; groups: ClientCatalog[]; salespeople: ClientCatalog[]; methods: ClientCatalog[]; returnTo: string;
}) {
  const [state, action, pending] = useActionState(async (_: ClientActionResult, data: FormData) => saveCommercialClient(data), { error: "" });
  const [terms, setTerms] = useState(client?.payment_terms || "days");
  const [draft, setDraft] = useState({
    name: client?.name || "", email: client?.email || "", phone: client?.phone || "", contact_name: client?.contact_name || "",
    notes: client?.notes || "", statement_footer: client?.statement_footer || "", public_notes: client?.public_notes || "",
    payment_terms_days: String(client?.payment_terms_days ?? 30),
  });
  const [active, setActive] = useState(client?.is_active ?? true);
  const [taxExempt, setTaxExempt] = useState(client?.tax_exempt ?? false);
  const updateText = (key: keyof typeof draft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const [tab, setTab] = useState("private");
  const [billing, setBilling] = useState(client?.address || "");
  const [shipping, setShipping] = useState(client?.shipping_address || "");
  const [groupId, setGroupId] = useState(client?.group_id || "");
  const [sellerId, setSellerId] = useState(client?.salesperson_id || "");
  const [methodId, setMethodId] = useState(client?.payment_method_id || "");
  const [added, setAdded] = useState<Record<string, ClientCatalog[]>>({ group: [], salesperson: [], payment_method: [] });
  const [catalog, setCatalog] = useState<"group" | "salesperson" | "payment_method">("group");
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const options = (kind: string, records: ClientCatalog[]) => [...records, ...added[kind].filter((entry) => !records.some((record) => record.id === entry.id))];
  function openCatalog(kind: typeof catalog) { setCatalog(kind); dialog.current?.showModal(); }
  return <>
    <form action={action} className="bbs-client-form" aria-busy={pending}>
      <input type="hidden" name="return_to" value={returnTo} />
      {client ? <><input type="hidden" name="client_id" value={client.id} /><input type="hidden" name="version" value={client.updated_at} /></> : null}
      {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}
      <fieldset disabled={pending}>
        <div className="bbs-client-fields">
          <label className="bbs-client-field">Nombre del cliente:<input className="bbs-input" name="name" required minLength={2} maxLength={200} value={draft.name} onChange={updateText("name")} /></label>
          <label className="bbs-client-field">Correo electrónico:<input className="bbs-input" name="email" type="email" maxLength={254} value={draft.email} onChange={updateText("email")} /></label>
          <label className="bbs-client-field">Teléfono:<input className="bbs-input" name="phone" maxLength={100} value={draft.phone} onChange={updateText("phone")} /></label>
          <label className="bbs-client-field">Persona de contacto (opcional):<input className="bbs-input" name="contact_name" maxLength={200} value={draft.contact_name} onChange={updateText("contact_name")} /></label>
          <div className="bbs-client-field"><label htmlFor={`${id}-seller`}>Vendedor:</label><div className="bbs-select-add"><select id={`${id}-seller`} className="bbs-select" name="salesperson_id" value={sellerId} onChange={(event) => setSellerId(event.target.value)}>
            <option value="">Sin vendedor</option>{options("salesperson", salespeople).map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select><button type="button" className="bbs-button" aria-label="Administrar vendedores" onClick={() => openCatalog("salesperson")}>+</button></div></div>
          <div className="bbs-client-field"><label htmlFor={`${id}-group`}>Grupo:</label><div className="bbs-select-add"><select id={`${id}-group`} className="bbs-select" name="group_id" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="">Predeterminado</option>{options("group", groups).map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select><button type="button" className="bbs-button" aria-label="Administrar grupos del cliente" onClick={() => openCatalog("group")}>+</button></div></div>
          <label className="bbs-client-field">Dirección de facturación:<textarea className="bbs-textarea" name="address" maxLength={2000} value={billing} onChange={(event) => setBilling(event.target.value)} /></label>
          <div><label className="bbs-client-field">Dirección de envío:<textarea className="bbs-textarea" name="shipping_address" maxLength={2000} value={shipping} onChange={(event) => setShipping(event.target.value)} /></label><button className="bbs-text-button" type="button" onClick={() => setShipping(billing)}>Copiar dirección de facturación</button></div>
        </div>
        <label className="bbs-checkbox"><input type="checkbox" name="is_active" checked={active} onChange={(event) => setActive(event.target.checked)} />Este cliente está activo</label>
        <div className="bbs-client-commercial">
          <div>
            <div className="bbs-note-tabs" role="tablist" aria-label="Notas del cliente">
              <button id={`${id}-private-tab`} type="button" role="tab" aria-selected={tab === "private"} aria-controls={`${id}-private`} onClick={() => setTab("private")}>Nota privada</button>
              <button id={`${id}-footer-tab`} type="button" role="tab" aria-selected={tab === "footer"} aria-controls={`${id}-footer`} onClick={() => setTab("footer")}>Nota al pie del estado de cuenta</button>
            </div>
            <div id={`${id}-private`} role="tabpanel" aria-labelledby={`${id}-private-tab`} hidden={tab !== "private"}>
              <textarea className="bbs-textarea" aria-label="Nota privada" name="notes" maxLength={5000} value={draft.notes} onChange={updateText("notes")} /><p className="bbs-field-hint">Esta nota no está visible en el estado de cuenta.</p></div>
            <div id={`${id}-footer`} role="tabpanel" aria-labelledby={`${id}-footer-tab`} hidden={tab !== "footer"}>
              <textarea className="bbs-textarea" aria-label="Nota al pie del estado de cuenta" name="statement_footer" maxLength={5000} value={draft.statement_footer} onChange={updateText("statement_footer")} /></div>
          </div>
          <div className="bbs-commercial-settings">
            <label className="bbs-client-field">Información impresa adicional:<input className="bbs-input" name="public_notes" maxLength={2000} value={draft.public_notes} onChange={updateText("public_notes")} /></label>
            <div className="bbs-client-field"><label htmlFor={`${id}-terms`}>Condiciones de pago:</label><div className="bbs-select-add"><select id={`${id}-terms`} className="bbs-select" name="payment_terms" value={terms} onChange={(event) => setTerms(event.target.value as "cod" | "days")}>
              <option value="cod">COD</option><option value="days">Pago en días</option></select>
              {terms === "days" ? <input className="bbs-input bbs-days-input" aria-label="Días para pagar" type="number" name="payment_terms_days" min={0} max={3650} step={1} value={draft.payment_terms_days} onChange={updateText("payment_terms_days")} required /> : <input type="hidden" name="payment_terms_days" value="0" />}</div></div>
            <div className="bbs-client-field"><label htmlFor={`${id}-method`}>Método:</label><div className="bbs-select-add"><select id={`${id}-method`} className="bbs-select" name="payment_method_id" value={methodId} onChange={(event) => setMethodId(event.target.value)}>
              <option value="">Sin método predeterminado</option>{options("payment_method", methods).map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select><button type="button" className="bbs-button" aria-label="Administrar métodos de pago" onClick={() => openCatalog("payment_method")}>+</button></div></div>
            <label className="bbs-checkbox"><input name="tax_exempt" type="checkbox" checked={taxExempt} onChange={(event) => setTaxExempt(event.target.checked)} />¿Cliente exento de impuestos?</label>
          </div>
        </div>
        <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar cliente"}</button><Link href={returnTo} className="bbs-button">Cancelar</Link></div>
      </fieldset>
    </form>
    <dialog ref={dialog} className="bbs-dialog bbs-catalog-dialog" aria-labelledby={`${id}-catalog-title`} onClose={(event) => event.stopPropagation()}>
      <div className="bbs-dialog-header"><h2 id={`${id}-catalog-title`}>{catalog === "group" ? "Grupos" : catalog === "salesperson" ? "Vendedores" : "Métodos de pago"}</h2><button className="bbs-button" aria-label="Cerrar catálogo" onClick={() => dialog.current?.close()}>×</button></div>
      <CatalogManager key={catalog} kind={catalog} records={options(catalog, catalog === "group" ? groups : catalog === "salesperson" ? salespeople : methods)} onCreated={(entry) => {
        setAdded((current) => ({ ...current, [catalog]: [...current[catalog], entry] }));
        if (catalog === "group") setGroupId(entry.id); else if (catalog === "salesperson") setSellerId(entry.id); else setMethodId(entry.id);
        dialog.current?.close();
      }} />
    </dialog>
  </>;
}
