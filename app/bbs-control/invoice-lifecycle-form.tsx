"use client";
import { useActionState } from "react";
import { invoiceLifecycleAction } from "./invoice-lifecycle-actions";
export function InvoiceLifecycleForm({ invoiceId, version, status, amountPaid, amountCredited = 0 }: { invoiceId: string; version: string; status: string; amountPaid: number; amountCredited?: number }) {
  const [state, action, pending] = useActionState(invoiceLifecycleAction, { error: "" });
  const allocated = amountPaid > 0 || amountCredited > 0 || ["paid", "partial"].includes(status);
  return <form action={action} aria-busy={pending}>
    <input type="hidden" name="id" value={invoiceId} /><input type="hidden" name="version" value={version} />
    {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}
    <div className="bbs-inline-actions" style={{ flexWrap: "wrap" }}>
      {!["draft", "void"].includes(status) ? <button className="bbs-button" disabled={pending} name="action" value="mark_emailed" onClick={(event) => { if (!window.confirm("¿Registrar que esta factura ya se envió por otro medio? Esta acción no envía un correo.")) event.preventDefault(); }}>Marcar como enviada</button> : null}
      {status === "draft" ? <button className="bbs-button" disabled={pending || allocated} name="action" value="delete_draft" onClick={(event) => { if (!window.confirm("¿Borrar este borrador y sus artículos?")) event.preventDefault(); }}>Borrar borrador</button> : status !== "void" ? <button className="bbs-button" disabled={pending || allocated} name="action" value="void" onClick={(event) => { if (!window.confirm("¿Anular esta factura? Su historial se conservará.")) event.preventDefault(); }}>Anular factura</button> : null}
    </div>
    {allocated ? <p className="bbs-field-hint">Esta factura tiene pagos o créditos aplicados. Deben revertirse antes de anularla.</p> : null}
  </form>;
}
