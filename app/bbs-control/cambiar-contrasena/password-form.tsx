"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { PasswordInput } from "../login/password-input";
import { changeOwnPassword } from "./actions";
export function OwnPasswordForm({ forced, home }: { forced: boolean; home: string }) {
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState(""), [current, setCurrent] = useState("");
  const [state, action, pending] = useActionState(changeOwnPassword, { error: "" });
  return <><form action={action} className="bbs-auth-form" aria-busy={pending}>
    {state.error ? <p className="bbs-auth-error" role="alert">{state.error}</p> : null}
    {!forced ? <PasswordInput label="Contraseña actual" name="current_password" autoComplete="current-password" required value={current} onChange={(event) => setCurrent(event.target.value)} /> : null}
    <PasswordInput label="Nueva contraseña" name="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} hint="De 12 a 128 caracteres, con mayúscula, minúscula, número y símbolo." />
    <PasswordInput label="Repetir nueva contraseña" name="confirmation" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
    <button className="bbs-auth-submit" disabled={pending}>{pending ? "Actualizando…" : "Guardar contraseña"}</button>
  </form>{!forced ? <div className="bbs-auth-links"><Link href={home}>Cancelar</Link></div> : null}</>;
}
