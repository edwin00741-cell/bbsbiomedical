"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { sendFinanceEmail } from "./finance-email-actions";
import type { FinancePdfKind } from "../../lib/bbs-control/finance-receipt-pdf";

export function FinanceEmailForm({ kind, documentId, number, email, closeHref, mailConfigured = false }: { kind: FinancePdfKind; documentId: string; number: string; email: string | null; closeHref: string; mailConfigured?: boolean }) {
  const token = useRef({ content: "", id: "" });
  const [recipient, setRecipient] = useState(email || "");
  const [subject, setSubject] = useState(`${kind === "payment" ? "Recibo de pago" : kind === "credit" ? "Nota de crédito" : "Reembolso"} ${number} - BBS`);
  const [message, setMessage] = useState(`Estimado cliente,\n\nAdjuntamos el comprobante ${number}.\n\nBiomedical Business and Service`);
  const [state, action, pending] = useActionState(async (_: { error: string; success?: string }, form: FormData) => {
    const content = JSON.stringify({ recipient, subject, message });
    if (token.current.content !== content) token.current = { content, id: crypto.randomUUID() };
    form.set("request_id", token.current.id); return sendFinanceEmail(form);
  }, { error: "" });
  return <form action={action} className="bbs-statement-email" aria-busy={pending}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="document_id" value={documentId} />
    {!mailConfigured ? <p className="bbs-message" role="status">El envío de correo requiere conectar el proveedor de BBS. Puede descargar el archivo e imprimirlo mientras se configura.</p> : null}
    {state.error || state.success ? <p className={`bbs-message ${state.error ? "bbs-message-error" : "bbs-message-success"}`} role={state.error ? "alert" : "status"}>{state.error || state.success}</p> : null}
    <label>Destinatarios:<input className="bbs-input" name="recipients" type="email" required multiple value={recipient} onChange={(event) => setRecipient(event.target.value)} /></label><label>Asunto:<input className="bbs-input" name="subject" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} /></label><label>Mensaje:<textarea className="bbs-textarea" name="message" maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} /></label><p className="bbs-field-hint">Se adjunta el comprobante PDF. Las notas privadas no se incluyen.</p><div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={!mailConfigured || pending || Boolean(state.success)}>{pending ? "Enviando…" : "Enviar documento"}</button><Link className="bbs-button" href={closeHref}>Cerrar</Link></div>
  </form>;
}
