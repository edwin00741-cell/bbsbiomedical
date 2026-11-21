"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { sendDocumentEmail } from "./document-output-actions";
import type { DocumentKind } from "../../lib/bbs-control/document-types";

export function DocumentEmailForm({ kind, documentId, number, email, closeHref, mailConfigured = false }: {
  kind: DocumentKind; documentId: string; number: string; email: string | null; closeHref: string; mailConfigured?: boolean;
}) {
  const token = useRef<string | null>(null);
  const [to, setTo] = useState(email || "");
  const [subject, setSubject] = useState(`${kind === "quote" ? "Cotización" : "Factura"} ${number} - BBS`);
  const [message, setMessage] = useState(`Estimado cliente,\n\nAdjuntamos el documento ${number}.\n\nBiomedical Business and Service`);
  const [state, action, pending] = useActionState(async (_: { error: string; success?: string }, data: FormData) => {
    token.current ||= crypto.randomUUID(); data.set("request_id", token.current);
    return sendDocumentEmail(data);
  }, { error: "" });
  return <form action={action} className="bbs-statement-email" aria-busy={pending}>
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="document_id" value={documentId} />
    {!mailConfigured ? <p className="bbs-message" role="status">El envío de correo requiere conectar el proveedor de BBS. Puede descargar el archivo e imprimirlo mientras se configura.</p> : null}
    {state.error || state.success ? <p role={state.error ? "alert" : "status"} className={`bbs-message ${state.error ? "bbs-message-error" : "bbs-message-success"}`}>{state.error || state.success}</p> : null}
    <label>Destinatarios:<input name="recipients" className="bbs-input" type="email" multiple required value={to} onChange={(event) => setTo(event.target.value)} /></label>
    <label>Asunto:<input name="subject" className="bbs-input" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
    <label>Mensaje:<textarea name="message" className="bbs-textarea" maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
    <p className="bbs-field-hint">PDF adjunto. Las notas privadas no se incluyen.</p>
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={!mailConfigured || pending || Boolean(state.success)}>{pending ? "Enviando…" : "Enviar documento"}</button><Link href={closeHref} className="bbs-button">Cerrar</Link></div>
  </form>;
}
