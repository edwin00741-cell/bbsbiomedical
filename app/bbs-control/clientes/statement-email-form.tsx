"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { sendClientStatement, type ClientActionResult } from "./actions";

export function StatementEmailForm({ client, returnTo, mailConfigured = false }: { client: { id: string; name: string; email: string | null }; returnTo: string; mailConfigured?: boolean }) {
  const token = useRef<string | null>(null);
  const [recipients, setRecipients] = useState(client.email || "");
  const [subject, setSubject] = useState("Estado de cuenta - Biomedical Business and Service");
  const [message, setMessage] = useState(`Estimado cliente,\n\nAdjuntamos su estado de cuenta.\n\nBiomedical Business and Service`);
  const [state, action, pending] = useActionState(async (_: ClientActionResult, data: FormData) => {
    token.current ||= crypto.randomUUID(); data.set("request_id", token.current);
    return sendClientStatement(data);
  }, { error: "" });
  return <form action={action} className="bbs-statement-email" aria-busy={pending}>
    <input type="hidden" name="client_id" value={client.id} />
    <p>Estado de cuenta de <strong>{client.name}</strong></p>
    {!mailConfigured ? <p className="bbs-message" role="status">El envío de correo requiere conectar el proveedor de BBS. Puede descargar el archivo e imprimirlo mientras se configura.</p> : null}
    {state.error || state.success ? <p role={state.error ? "alert" : "status"} className={`bbs-message ${state.error ? "bbs-message-error" : "bbs-message-success"}`}>{state.error || state.success}</p> : null}
    <label>Destinatarios:<input className="bbs-input" name="recipients" type="email" multiple required value={recipients} onChange={(event) => setRecipients(event.target.value)} /></label>
    <p className="bbs-field-hint">Separe varios correos con comas. Se adjuntará el PDF sin notas privadas.</p>
    <label>Asunto:<input className="bbs-input" name="subject" maxLength={200} required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
    <label>Mensaje:<textarea className="bbs-textarea" name="message" maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={!mailConfigured || pending || Boolean(state.success)}>{pending ? "Enviando…" : "Enviar estado de cuenta"}</button><Link className="bbs-button" href={returnTo}>Cerrar</Link></div>
  </form>;
}
