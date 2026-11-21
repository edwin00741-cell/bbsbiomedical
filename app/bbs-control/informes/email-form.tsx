"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { emailReport } from "./email-actions";
export function ReportEmailForm({ reportId, title, filters, format, closeHref, mailConfigured = false }: { reportId: string; title: string; filters: Record<string, string>; format: "pdf" | "csv"; closeHref: string; mailConfigured?: boolean }) {
  const [recipients, setRecipients] = useState(""), [subject, setSubject] = useState(title), [message, setMessage] = useState(`Adjuntamos el informe ${title}.`);
  const request = useRef<string | null>(null);
  const [state, action, pending] = useActionState(async (previous: { error: string; success?: string }, form: FormData) => {
    request.current ||= crypto.randomUUID(); form.set("request_id", request.current); return emailReport(previous, form);
  }, { error: "" });
  return <form action={action} className="bbs-report-email" aria-busy={pending}>
    <input type="hidden" name="report_id" value={reportId} /><input type="hidden" name="filters" value={JSON.stringify(filters)} /><input type="hidden" name="format" value={format} />
    {!mailConfigured ? <p className="bbs-message" role="status">El envío de correo requiere conectar el proveedor de BBS. Puede descargar el archivo e imprimirlo mientras se configura.</p> : null}
    {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}{state.success ? <p className="bbs-message bbs-message-success" role="status">{state.success}</p> : null}
    <label>Destinatarios:<input className="bbs-input" name="recipients" required value={recipients} onChange={(event) => setRecipients(event.target.value)} placeholder="correo@empresa.com, otro@empresa.com" /></label>
    <label>Asunto:<input className="bbs-input" name="subject" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
    <label>Mensaje:<textarea className="bbs-textarea" name="message" maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
    <p className="bbs-field-hint">Se adjuntará el informe completo en formato {format.toUpperCase()} con los filtros seleccionados.</p>
    <div className="bbs-form-actions"><Link className="bbs-button" href={closeHref}>Cerrar</Link><button className="bbs-button bbs-button-primary" disabled={!mailConfigured || pending || Boolean(state.success)}>{pending ? "Enviando…" : "Enviar informe"}</button></div>
  </form>;
}
