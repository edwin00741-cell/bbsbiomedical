"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createRecurrence, runRecurrences, updateRecurrence } from "./actions";
import type { InvoiceRecurrence } from "../../../lib/bbs-control/recurrence";

export function RunRecurrencesForm() {
  const [state, action, pending] = useActionState(runRecurrences, { error: "" });
  return <form action={action} className="bbs-recurrence-run">
    <button className="bbs-button" disabled={pending}>{pending ? "Generando…" : "Generar pendientes ahora"}</button>
    {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}
    {state.success ? <p className="bbs-message bbs-message-success" role="status">{state.success}</p> : null}
  </form>;
}
export function RecurrenceForm({ sources, invoiceId, today, recurrence }: {
  sources?: { id: string; invoice_number: string; client_name: string; total: number }[]; invoiceId?: string; today: string; recurrence?: InvoiceRecurrence;
}) {
  const [name, setName] = useState(recurrence?.name || "");
  const [source, setSource] = useState(invoiceId || "");
  const [start, setStart] = useState(today), [end, setEnd] = useState(recurrence?.end_date || "");
  const [interval, setInterval] = useState("1"), [unit, setUnit] = useState("months");
  const [status, setStatus] = useState(recurrence?.status === "active" ? "active" : "paused");
  const request = useRef<string | null>(null);
  const [state, action, pending] = useActionState(async (previous: { error: string }, form: FormData) => {
    if (recurrence) return updateRecurrence(previous, form);
    request.current ||= crypto.randomUUID(); form.set("request_id", request.current);
    return createRecurrence(previous, form);
  }, { error: "" });
  return <form action={action} className="bbs-card bbs-recurrence-form" aria-busy={pending}>
    {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}
    {recurrence ? <><input type="hidden" name="id" value={recurrence.id} /><input type="hidden" name="version" value={recurrence.updated_at} /></> : null}
    <fieldset disabled={pending}>
      <label>Nombre:<input className="bbs-input" name="name" required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label>
      {!recurrence ? <>
        <label>Factura de origen:<select className="bbs-select" name="invoice_id" required value={source} onChange={(event) => setSource(event.target.value)}><option value="">Seleccione una factura</option>{sources?.map((row) => <option value={row.id} key={row.id}>{row.invoice_number} - {row.client_name}</option>)}</select></label>
        <label>Primera emisión:<input className="bbs-input" name="start_date" type="date" min={today} required value={start} onChange={(event) => setStart(event.target.value)} /></label>
        <label>Repetir:<div className="bbs-inline-actions"><input className="bbs-input" style={{ width: 85 }} name="interval_count" aria-label="Número de intervalos" type="number" min={1} max={365} step={1} required value={interval} onChange={(event) => setInterval(event.target.value)} /><select name="interval_unit" className="bbs-select" aria-label="Unidad del intervalo" value={unit} onChange={(event) => setUnit(event.target.value)}><option value="days">Días</option><option value="weeks">Semanas</option><option value="months">Meses</option><option value="years">Años</option></select></div></label>
      </> : <label>Estado:<select name="status" className="bbs-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Activa</option><option value="paused">Pausada</option></select></label>}
      <label>Última fecha de emisión:<input className="bbs-input" name="end_date" type="date" min={recurrence?.start_date || start} value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <p className="bbs-field-hint">Deje la fecha final vacía para continuar sin límite. La emisión conserva cliente, artículos, impuestos, descuentos, envío y empresa de la factura de origen. Puede modificar cada factura generada por separado.</p>
      <p className="bbs-field-hint">En intervalos mensuales y anuales se conserva el día original: si no existe en un mes, se usa su último día. La programación genera facturas emitidas; no envía correos ni registra pagos.</p>
      {recurrence ? <p className="bbs-field-hint">Para cambiar el intervalo o los artículos, pause esta programación y cree otra desde la factura que desea utilizar.</p> : null}
      <div className="bbs-form-actions"><Link className="bbs-button" href={recurrence ? `/bbs-control/recurrentes/${recurrence.id}` : "/bbs-control/recurrentes"}>Cancelar</Link><button className="bbs-button bbs-button-primary">{pending ? "Guardando…" : "Guardar programación"}</button></div>
    </fieldset>
  </form>;
}
