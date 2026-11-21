"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordRecovery } from "./actions";
export function RecoveryForm() {
  const [identifier, setIdentifier] = useState("");
  const [state, action, pending] = useActionState(requestPasswordRecovery, { error: "" });
  return <><form action={action} className="bbs-auth-form" aria-busy={pending}>
    {state.error ? <p className="bbs-auth-error" role="alert">{state.error}</p> : null}{state.success ? <p className="bbs-auth-success" role="status">{state.success}</p> : null}
    <div><label htmlFor="bbs-recovery-identifier">Usuario o correo electrónico</label><input id="bbs-recovery-identifier" name="identifier" className="bbs-auth-input" required maxLength={254} autoComplete="username" autoCapitalize="none" spellCheck={false} value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></div>
    <button className="bbs-auth-submit" disabled={pending}>{pending ? "Registrando…" : "Solicitar recuperación"}</button>
  </form><div className="bbs-auth-links"><Link href="/bbs-control/login">Volver a iniciar sesión</Link></div></>;
}
