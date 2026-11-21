"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { savePayment } from "./pagos/actions";
import { saveCredit } from "./notas-credito/actions";
import { saveRefund } from "./reembolsos/actions";
import { money } from "../../lib/bbs-control/format";
import type { FinanceCommand, FinanceData, FinancePayment, FinanceInvoice, FinanceCredit } from "../../lib/bbs-control/finance-types";
import type { FinanceActionResult } from "./finance-actions";
import "./finance.css";

type Action = (form: FormData) => Promise<FinanceActionResult>;
const actions = { payment: savePayment, credit: saveCredit, refund: saveRefund };
const sum = (values: string[]) => values.reduce((total, value) => total + Math.round(Number(value || 0) * 100), 0) / 100;
const pennies = (value: number) => Math.round(value * 100) / 100;

export function useFinanceAction(command: () => FinanceCommand, action: Action, returnId?: string) {
  const token = useRef({ content: "", id: "" });
  return useActionState(async (_: FinanceActionResult, data: FormData) => {
    const content = JSON.stringify(command());
    if (content !== token.current.content) token.current = { content, id: crypto.randomUUID() };
    data.set("command", content); data.set("request_id", token.current.id);
    if (returnId) data.set("return_id", returnId);
    return action(data);
  }, { error: "" });
}

function Result({ error }: FinanceActionResult) { return error ? <p role="alert" className="bbs-message bbs-message-error">{error}</p> : null; }

export function InvoiceAllocations({ invoices, values, onChange, available }: {
  invoices: FinanceInvoice[]; values: Record<string, string>; onChange: (values: Record<string, string>) => void; available: number;
}) {
  const applied = sum(Object.values(values));
  function distribute() {
    let remaining = Math.round(available * 100);
    const next: Record<string, string> = {};
    for (const invoice of invoices) { const amount = Math.min(remaining, Math.round(invoice.balance * 100)); next[invoice.id] = amount ? (amount / 100).toFixed(2) : ""; remaining -= amount; }
    onChange(next);
  }
  return <>
    <div className="bbs-finance-toolbar"><h2>Aplicar a facturas</h2><button className="bbs-button" type="button" onClick={distribute} disabled={!invoices.length || available <= 0}>Aplicar automáticamente</button><button className="bbs-button" type="button" onClick={() => onChange({})}>Limpiar importes</button></div>
    <div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 700 }}><thead><tr><th>Factura</th><th>Fecha</th><th>Vencimiento</th><th className="bbs-money">Total</th><th className="bbs-money">Pendiente</th><th>Importe aplicado</th></tr></thead>
      <tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id}><td><Link href={`/bbs-control/facturas/${invoice.id}`} target="_blank">{invoice.invoice_number}</Link></td><td>{invoice.issue_date}</td><td>{invoice.due_date}</td><td className="bbs-money">{money(invoice.total)}</td><td className="bbs-money">{money(invoice.balance)}</td>
        <td><input aria-label={`Importe aplicado a ${invoice.invoice_number}`} className="bbs-input bbs-finance-amount" type="number" min="0" max={invoice.balance} step="0.01" value={values[invoice.id] || ""} onChange={(event) => onChange({ ...values, [invoice.id]: event.target.value })} /></td></tr>) : <tr><td className="bbs-empty" colSpan={6}>No hay facturas pendientes para este cliente.</td></tr>}</tbody></table></div>
    <dl className="bbs-finance-summary"><div><dt>Disponible</dt><dd>{money(available)}</dd></div><div><dt>Importe aplicado</dt><dd>{money(applied)}</dd></div><div><dt>Restante no aplicado</dt><dd aria-live="polite">{money(pennies(available - applied))}</dd></div></dl>
    {applied > available ? <p role="alert" className="bbs-message bbs-message-error">El importe aplicado supera el disponible.</p> : null}
  </>;
}

const pendingInvoices = (data: FinanceData, clientId: string) => data.invoices.filter((invoice) => invoice.client_id === clientId && !["draft", "void"].includes(invoice.status) && invoice.balance > 0);
const allocationInput = (values: Record<string, string>) => Object.entries(values).filter(([, value]) => Number(value) > 0).map(([invoice_id, value]) => ({ invoice_id, amount: Number(value) }));

export function PaymentForm({ data, today, clientId: initialClient = "", invoiceId, payment }: { data: FinanceData; today: string; clientId?: string; invoiceId?: string; payment?: FinancePayment }) {
  const invoice = data.invoices.find((entry) => entry.id === invoiceId);
  const [clientId, setClient] = useState(payment?.client_id || invoice?.client_id || initialClient);
  const [amount, setAmount] = useState(String(payment?.amount ?? invoice?.balance ?? ""));
  const [date, setDate] = useState(payment?.date || today);
  const [method, setMethod] = useState(payment?.payment_method_id || "");
  const [reference, setReference] = useState(payment?.reference || "");
  const [notes, setNotes] = useState(payment?.notes || "");
  const [allocations, setAllocations] = useState<Record<string, string>>(invoice && invoice.balance > 0 && !payment ? { [invoice.id]: String(invoice.balance) } : {});
  const [state, action, pending] = useFinanceAction(() => payment ? {
    operation: "payment.update", id: payment.id, version: payment.updated_at, date, payment_method_id: method || null, reference: reference || null, notes: notes || null,
  } : { operation: "payment.create", client_id: clientId, amount: Number(amount), date, payment_method_id: method || null, reference: reference || null, notes: notes || null, allocations: allocationInput(allocations) }, savePayment, payment?.id);
  const eligible = pendingInvoices(data, clientId);
  const totalApplied = sum(Object.values(allocations));
  return <form action={action} className="bbs-finance-form" aria-busy={pending}><Result {...state} /><fieldset disabled={pending}>
    <div className="bbs-finance-fields">
      <label>Fecha:<input className="bbs-input" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>Número:<input className="bbs-input" value={payment?.number || "Se genera al guardar"} readOnly /></label>
      <label>Cliente:<select className="bbs-select" required disabled={Boolean(payment)} value={clientId} onChange={(event) => { setClient(event.target.value); setAllocations({}); }}><option value="">[Seleccionar cliente]</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}{payment && !data.clients.some((client) => client.id === payment.client_id) ? <option value={payment.client_id}>{payment.client_name}</option> : null}</select></label>
      <label>Importe total:<input className="bbs-input" type="number" required readOnly={Boolean(payment)} min="0.01" step="0.01" max="9999999999.99" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      <label>Método de pago:<select className="bbs-select" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">[Sin especificar]</option>{data.methods.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <label>Referencia de pago:<input className="bbs-input" maxLength={200} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      <label className="bbs-wide">Nota pública:<textarea className="bbs-textarea" maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    </div>
    {!payment ? <InvoiceAllocations invoices={eligible} values={allocations} onChange={setAllocations} available={Number(amount) || 0} /> : <p className="bbs-field-hint">El importe y el cliente se conservan. Las aplicaciones se gestionan desde el detalle del pago.</p>}
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending || (!payment && totalApplied > Number(amount))}>{pending ? "Guardando…" : payment ? "Guardar cambios" : "Aplicar pago"}</button><Link className="bbs-button" href={payment ? `/bbs-control/pagos/${payment.id}` : "/bbs-control/pagos"}>Cancelar</Link></div>
  </fieldset></form>;
}

export function ApplyFinanceForm({ data, source }: { data: FinanceData; source: { kind: "payment" | "credit"; id: string; client_id: string; available_amount: number } }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, action, pending] = useFinanceAction(() => ({ operation: "application.apply", source_kind: source.kind, source_id: source.id, allocations: allocationInput(values) }), actions[source.kind], source.id);
  const applied = sum(Object.values(values));
  return <form action={action} className="bbs-finance-form" aria-busy={pending}><Result {...state} /><fieldset disabled={pending}>
    <InvoiceAllocations invoices={pendingInvoices(data, source.client_id)} values={values} onChange={setValues} available={source.available_amount} />
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending || applied <= 0 || applied > source.available_amount}>{pending ? "Guardando…" : "Aplicar importe"}</button></div>
  </fieldset></form>;
}

export function FinanceCommandForm({ kind, command, returnId, title, description }: { kind: "payment" | "credit" | "refund"; command: Exclude<FinanceCommand, { operation: "credit.create" | "refund.create" | "payment.create" | "payment.update" | "application.apply" }>; returnId: string; title: string; description?: string }) {
  const [reason, setReason] = useState("");
  const [state, action, pending] = useFinanceAction(() => ({ ...command, reason }), actions[kind], returnId);
  return <form action={action} className="bbs-finance-command"><Result {...state} />{description ? <p className="bbs-field-hint">{description}</p> : null}
    <label>Motivo:<input className="bbs-input" value={reason} required minLength={3} maxLength={1000} onChange={(event) => setReason(event.target.value)} disabled={pending} /></label>
    <button className="bbs-button" disabled={pending}>{pending ? "Guardando…" : title}</button>
  </form>;
}

export function RefundForm({ data, today, clientId: initialClient = "", paymentId, creditId }: { data: FinanceData; today: string; clientId?: string; paymentId?: string; creditId?: string }) {
  const source = data.payments.find((entry) => entry.id === paymentId);
  const credit = data.credits.find((entry) => entry.id === creditId);
  const [clientId, setClient] = useState(source?.client_id || credit?.client_id || initialClient);
  const [payment, setPayment] = useState(source?.id || "");
  const [creditNote, setCredit] = useState(credit?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const credits = data.credits.filter((entry) => entry.client_id === clientId && entry.available_amount > 0 && entry.status !== "void");
  const selectedCredit = credits.find((entry) => entry.id === creditNote);
  const cashAvailable = (entry: FinancePayment) => selectedCredit?.source_invoice_id
    ? pennies(data.applications.filter((application) => application.source_kind === "payment" && application.source_id === entry.id && application.invoice_id === selectedCredit.source_invoice_id && !application.reversed_at).reduce((total, application) => total + application.amount, 0))
    : entry.available_amount;
  const payments = data.payments.filter((entry) => entry.client_id === clientId && entry.status !== "void" && cashAvailable(entry) > 0);
  const selected = payments.find((entry) => entry.id === payment);
  const available = Math.min(selected ? cashAvailable(selected) : 0, selectedCredit?.available_amount ?? Infinity);
  const [state, action, pending] = useFinanceAction(() => ({ operation: "refund.create", client_id: clientId, payment_id: payment, credit_note_id: creditNote || null, amount: Number(amount), date, payment_method_id: method || null, reference: reference || null, reason }), saveRefund);
  return <form action={action} className="bbs-finance-form" aria-busy={pending}><Result {...state} /><fieldset disabled={pending}>
    <div className="bbs-finance-fields">
      <label>Cliente:<select className="bbs-select" value={clientId} required onChange={(event) => { setClient(event.target.value); setPayment(""); setCredit(""); setAmount(""); }}><option value="">[Seleccionar cliente]</option>{data.clients.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <label>Fecha:<input className="bbs-input" type="date" value={date} required onChange={(event) => setDate(event.target.value)} /></label>
      <label>Nota de crédito:<select className="bbs-select" value={creditNote} onChange={(event) => { setCredit(event.target.value); setPayment(""); setAmount(""); }}><option value="">[Sin nota de crédito]</option>{credits.map((entry) => <option key={entry.id} value={entry.id}>{entry.number} · {money(entry.available_amount)}</option>)}</select></label>
      <label>Pago de origen:<select className="bbs-select" required value={payment} onChange={(event) => { setPayment(event.target.value); setAmount(""); }}><option value="">[Seleccionar fondos disponibles]</option>{payments.map((entry) => <option key={entry.id} value={entry.id}>{entry.number} · {money(cashAvailable(entry))}</option>)}</select></label>
      <label>Importe:<input className="bbs-input" type="number" value={amount} min="0.01" max={available} step="0.01" required onChange={(event) => setAmount(event.target.value)} /></label>
      <label>Método:<select className="bbs-select" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">[Sin especificar]</option>{data.methods.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <label>Referencia:<input className="bbs-input" maxLength={200} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      <label>Motivo:<textarea className="bbs-textarea" required minLength={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    </div>
    <p className="bbs-field-hint">Disponible para devolver: <strong>{money(available)}</strong>. {selectedCredit?.source_invoice_id ? "El crédito sustituye la parte del pago aplicada a su factura de origen y permite devolver ese efectivo sin abrir una deuda." : "El reembolso descuenta fondos sin aplicar del pago seleccionado. Una nota de crédito por sí sola no genera fondos."}</p>
    {clientId && !payments.length ? <p className="bbs-message">El cliente no tiene fondos sin aplicar. Puede deshacer una aplicación del pago desde su detalle, o <Link className="underline" href={`/bbs-control/notas-credito/nueva?client_id=${clientId}`}>emitir una nota de crédito</Link>.</p> : null}
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending || !selected || available <= 0 || Number(amount) > available}>{pending ? "Guardando…" : "Registrar reembolso al cliente"}</button><Link className="bbs-button" href="/bbs-control/reembolsos">Cancelar</Link></div>
  </fieldset></form>;
}

export type CreditSource = FinanceCredit;
