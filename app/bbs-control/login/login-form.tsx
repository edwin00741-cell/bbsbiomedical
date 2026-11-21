"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "./actions";
import { PasswordInput } from "./password-input";
export function LoginForm({ nextPath }: { nextPath: string }) {
  const [username, setUsername] = useState(""), [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(signInAction, { error: "" });
  return <>
    <form action={action} className="bbs-auth-form" aria-busy={pending}>
      <input name="next" type="hidden" value={nextPath} />
      {state.error ? <p className="bbs-auth-error" role="alert">{state.error}</p> : null}
      <div><label htmlFor="bbs-login-username">Usuario o correo electrónico</label><input id="bbs-login-username" className="bbs-auth-input" autoComplete="username" name="username" maxLength={254} required value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" spellCheck={false} /></div>
      <PasswordInput id="bbs-login-password" label="Contraseña" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      <button className="bbs-auth-submit" type="submit" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
    </form>
    <div className="bbs-auth-links"><Link href="/bbs-control/recuperar">¿Olvidó su contraseña?</Link><Link href="/">Volver al sitio</Link></div>
  </>;
}
