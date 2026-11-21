"use client";
import { useActionState, useState } from "react";
import { PasswordInput } from "../login/password-input";
import { createManagedRecoveryLink, createManagedUser, resetManagedPassword, resolveManagedRecovery, updateManagedUser } from "./actions";
import { managedRoleLabels, managedRoles, type ManagedProfile, type ManagedUserState } from "./manage-policy";
import type { BbsRole } from "../../../lib/bbs-control/permissions";

const initial: ManagedUserState = { error: "" };
const passwordHint = "Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.";
function Message({ state }: { state: ManagedUserState }) {
  return <>{state.error || state.success ? <p className={`bbs-message ${state.error ? "bbs-message-error" : "bbs-message-success"}`} role={state.error ? "alert" : "status"}>{state.error || state.success}</p> : null}{state.warning ? <p className="bbs-message" role="status">{state.warning}</p> : null}</>;
}

function temporaryPassword() {
  const categories = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*-_+"];
  const bytes = crypto.getRandomValues(new Uint32Array(48));
  const alphabet = categories.join("");
  const characters = categories.map((category, index) => category[bytes[index] % category.length]);
  for (let index = 4; index < 24; index++) characters.push(alphabet[bytes[index] % alphabet.length]);
  for (let index = characters.length - 1; index > 0; index--) { const target = bytes[index + 24] % (index + 1); [characters[index], characters[target]] = [characters[target], characters[index]]; }
  return characters.join("");
}

export function CreateManagedUserForm() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof managedRoles)[number]>("cotizador");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [state, action, pending] = useActionState(async (previous: ManagedUserState, form: FormData) => {
    form.set("must_change_password", String(forceChange));
    const result = await createManagedUser(previous, form);
    if (result.success) { setPassword(""); setUsername(""); setFullName(""); setEmail(""); setRole("cotizador"); setForceChange(true); }
    return result;
  }, initial);
  return <form action={action} className="bbs-user-form" aria-busy={pending} data-testid="create-managed-user"><Message state={state} /><fieldset disabled={pending}>
    <div className="bbs-user-fields"><label>Usuario:<input className="bbs-input" name="username" minLength={4} maxLength={64} pattern="[a-zA-Z0-9._\-]+" autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
      <label>Nombre completo:<input className="bbs-input" name="full_name" required minLength={2} maxLength={200} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
      <label>Rol:<select className="bbs-select" name="role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>{managedRoles.map((value) => <option key={value} value={value}>{managedRoleLabels[value]}</option>)}</select></label>
      <label>Correo de recuperación:<input className="bbs-input" name="recovery_email" type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" /><span className="bbs-field-hint">Opcional. Si no tiene correo, un administrador podrá ayudarle a recuperar el acceso.</span></label>
    </div><p className="bbs-field-hint">El nombre de usuario admite letras, números, punto, guion y guion bajo.</p>
    <div className="bbs-user-password"><PasswordInput className="bbs-input" label="Contraseña temporal" name="password" minLength={12} maxLength={128} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} hint={passwordHint} /><button type="button" className="bbs-button" onClick={() => setPassword(temporaryPassword())}>Generar contraseña</button></div>
    <label className="bbs-checkbox"><input type="checkbox" checked={forceChange} onChange={(event) => setForceChange(event.target.checked)} />Solicitar cambio de contraseña en el primer acceso</label>
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending}>{pending ? "Creando…" : "Crear usuario"}</button></div>
  </fieldset></form>;
}

export function UpdateManagedUserForm({ target, actorId }: { target: ManagedProfile; actorId: string }) {
  const [fullName, setFullName] = useState(target.full_name);
  const [role, setRole] = useState<BbsRole>(target.role);
  const [active, setActive] = useState(target.is_active);
  const protectedAccess = target.role === "super_admin" || target.id === actorId;
  const [state, action, pending] = useActionState(async (previous: ManagedUserState, form: FormData) => {
    form.set("role", role); form.set("is_active", String(active));
    return updateManagedUser(previous, form);
  }, initial);
  return <form action={action} className="bbs-user-form" aria-busy={pending} data-testid={`update-user-${target.username}`}><Message state={state} /><fieldset disabled={pending}>
    <input type="hidden" name="user_id" value={target.id} /><input type="hidden" name="version" value={target.updated_at} />
    <div className="bbs-user-fields"><label>Usuario:<input className="bbs-input" readOnly value={target.username} /></label><label>Nombre completo:<input className="bbs-input" name="full_name" required minLength={2} maxLength={200} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
      <label>Rol:<select className="bbs-select" disabled={protectedAccess} value={role} onChange={(event) => setRole(event.target.value as BbsRole)}>{target.role === "super_admin" ? <option value="super_admin">{managedRoleLabels.super_admin}</option> : managedRoles.map((value) => <option key={value} value={value}>{managedRoleLabels[value]}</option>)}</select></label>
      <label className="bbs-checkbox"><input type="checkbox" disabled={protectedAccess} checked={active} onChange={(event) => setActive(event.target.checked)} />Usuario activo</label>
    </div>{protectedAccess ? <p className="bbs-field-hint">El rol y el acceso de esta cuenta están protegidos.</p> : null}
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar usuario"}</button></div>
  </fieldset></form>;
}

export function ResetManagedPasswordForm({ target }: { target: ManagedProfile }) {
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(async (previous: ManagedUserState, form: FormData) => {
    const result = await resetManagedPassword(previous, form); if (result.success) setPassword(""); return result;
  }, initial);
  return <form action={action} className="bbs-user-form" aria-busy={pending} data-testid={`reset-password-${target.username}`}><Message state={state} /><fieldset disabled={pending}>
    <input name="user_id" type="hidden" value={target.id} /><input name="version" type="hidden" value={target.updated_at} />
    <div className="bbs-user-password"><PasswordInput className="bbs-input" label="Nueva contraseña temporal" name="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} hint={passwordHint} /><button type="button" className="bbs-button" onClick={() => setPassword(temporaryPassword())}>Generar contraseña</button></div>
    <p className="bbs-field-hint">Al entrar, el usuario deberá sustituir esta contraseña por una propia.</p>
    <div className="bbs-form-actions"><button className="bbs-button" disabled={pending}>{pending ? "Restableciendo…" : "Establecer contraseña temporal"}</button></div>
  </fieldset></form>;
}

export function ManagedRecoveryControls({ target, pendingRequest = false }: { target: ManagedProfile; pendingRequest?: boolean }) {
  const [copied, setCopied] = useState("");
  const [state, action, pending] = useActionState(async (previous: ManagedUserState, form: FormData) => { setCopied(""); return createManagedRecoveryLink(previous, form); }, initial);
  const [resolution, resolve, resolving] = useActionState(resolveManagedRecovery, initial);
  async function copy() { try { await navigator.clipboard.writeText(state.recoveryUrl || ""); setCopied("Enlace copiado."); } catch { setCopied("Seleccione el enlace y cópielo."); } }
  return <div className="bbs-user-recovery"><form action={action} className="bbs-user-form" aria-busy={pending} data-testid={`recovery-link-${target.username}`}><Message state={state} /><input type="hidden" name="user_id" value={target.id} />
    <p className="bbs-field-hint">Genere un enlace de un solo uso para que el titular establezca una contraseña. El enlace no se envía automáticamente.</p>
    <button className="bbs-button" disabled={pending || !target.is_active}>{pending ? "Generando…" : "Generar enlace de recuperación"}</button>
    {state.recoveryUrl ? <div className="bbs-user-recovery-link"><label>Enlace de recuperación:<textarea className="bbs-textarea" value={state.recoveryUrl} readOnly spellCheck={false} /></label><button className="bbs-button" type="button" onClick={copy}>Copiar enlace</button>{copied ? <p role="status" className="bbs-field-hint">{copied}</p> : null}</div> : null}
  </form>{pendingRequest ? <form action={resolve} className="bbs-user-form"><Message state={resolution} /><input type="hidden" name="user_id" value={target.id} /><button className="bbs-button" disabled={resolving}>{resolving ? "Guardando…" : "Marcar solicitud como atendida"}</button></form> : null}</div>;
}
