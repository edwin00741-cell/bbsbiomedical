"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { usernameToInternalEmail } from "../../../lib/bbs-control/env";
import { newPasswordSchema } from "../../../lib/bbs-control/auth-input";
import { managedRoles, managedUpdateError, mayManageTarget, mayManageUsers, reservedUsername, type ManagedProfile, type ManagedUserState } from "./manage-policy";

const profileColumns = "id,username,full_name,role,is_active,must_change_password,created_at,updated_at";
const name = z.string().trim().min(2, "Indique el nombre completo.").max(200);
const version = z.iso.datetime({ offset: true });
const reference = z.object({ user_id: z.uuid("Usuario inválido.") });
const createSchema = z.object({ username: z.string().trim().toLowerCase().min(4, "El usuario debe tener al menos 4 caracteres.").max(64).regex(/^[a-z0-9._-]+$/, "Use letras, números, punto, guion o guion bajo."), full_name: name,
  role: z.enum(managedRoles, "Seleccione un rol permitido."), password: newPasswordSchema,
  recovery_email: z.string().trim().toLowerCase().max(254).refine((value) => !value || z.email().safeParse(value).success, "Revise el correo de recuperación."),
  must_change_password: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
});
const updateSchema = reference.extend({ version, full_name: name, role: z.enum(["cotizador", "admin", "super_admin"]), is_active: z.enum(["true", "false"]).transform((value) => value === "true") });
const resetSchema = reference.extend({ version, password: newPasswordSchema });
const validationError = (issues: { message: string }[]) => ({ error: issues[0]?.message || "Revise los datos del formulario." });
const denied = { error: "No tiene permiso para administrar usuarios." };
type Admin = ReturnType<typeof createSupabaseAdminClient>;

async function readTarget(admin: Admin, id: string): Promise<ManagedProfile | null> {
  const result = await admin.from("profiles").select(profileColumns).eq("id", id).maybeSingle();
  if (result.error) throw new Error("No se pudo consultar el usuario. Intente nuevamente.");
  return result.data as ManagedProfile | null;
}

async function resolveRequests(admin: Admin, userId: string, actorId: string) {
  const result = await admin.from("password_reset_requests").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: actorId }).eq("user_id", userId).eq("status", "pending");
  return !result.error;
}

/** The profile is authoritative; copy its current state into Auth after a guarded write. */
async function syncIdentity(admin: Admin, id: string, ban?: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const profile = await readTarget(admin, id);
    if (!profile) return false;
    const auth = await admin.auth.admin.getUserById(id);
    if (auth.error || !auth.data.user) return false;
    const result = await admin.auth.admin.updateUserById(id, {
      app_metadata: { ...auth.data.user.app_metadata, bbs_role: profile.role, bbs_is_active: profile.is_active, must_change_password: profile.must_change_password },
      user_metadata: { ...auth.data.user.user_metadata, username: profile.username, full_name: profile.full_name },
      ...(ban ? { ban_duration: profile.is_active ? "none" : "876000h" } : {}),
    });
    if (result.error) return false;
    const latest = await readTarget(admin, id);
    if (latest?.updated_at === profile.updated_at) return true;
  }
  return false;
}

export async function createManagedUser(_previous: ManagedUserState, form: FormData): Promise<ManagedUserState> {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) return denied;
  const parsed = createSchema.safeParse({ ...Object.fromEntries(form), recovery_email: form.get("recovery_email") || "", must_change_password: form.get("must_change_password") ?? "true" });
  if (!parsed.success) return validationError(parsed.error.issues);
  const values = parsed.data;
  if (reservedUsername(values.username)) return { error: "Ese usuario está reservado para una cuenta existente." };
  let createdId: string | null = null;
  let admin: Admin | null = null;
  try {
    admin = createSupabaseAdminClient();
    const existing = await admin.from("profiles").select("id").eq("username", values.username).maybeSingle();
    if (existing.error) return { error: "No se pudo comprobar el nombre de usuario." };
    if (existing.data) return { error: "Ese nombre de usuario ya existe." };
    const result = await admin.auth.admin.createUser({ email: values.recovery_email || usernameToInternalEmail(values.username), password: values.password, email_confirm: true,
      app_metadata: { bbs_role: values.role, bbs_is_active: true, must_change_password: values.must_change_password },
      user_metadata: { username: values.username, full_name: values.full_name },
    });
    if (result.error || !result.data.user) return { error: "No se pudo crear el acceso. Compruebe que el usuario y el correo no estén registrados." };
    createdId = result.data.user.id;
    const profile = await admin.from("profiles").insert({ id: createdId, username: values.username, full_name: values.full_name, role: values.role, is_active: true, must_change_password: values.must_change_password, created_by: actor.id });
    if (profile.error) {
      const compensation = await admin.auth.admin.deleteUser(createdId);
      createdId = null;
      return { error: compensation.error ? "No se pudo completar el alta. Consulte el directorio antes de reintentar." : "No se pudo guardar el usuario. No se creó un acceso activo." };
    }
    createdId = null;
    revalidatePath("/bbs-control/usuarios");
    return { error: "", success: `Usuario ${values.username} creado.${values.must_change_password ? " Deberá cambiar su contraseña al entrar." : ""}` };
  } catch {
    if (createdId && admin) { try { await admin.auth.admin.deleteUser(createdId); } catch { /* An orphan without a profile cannot enter BBS Control. */ } }
    return { error: "No se pudo crear el usuario. Consulte el directorio antes de reintentar." };
  }
}

export async function updateManagedUser(_previous: ManagedUserState, form: FormData): Promise<ManagedUserState> {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) return denied;
  const parsed = updateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationError(parsed.error.issues);
  try {
    const admin = createSupabaseAdminClient();
    const target = await readTarget(admin, parsed.data.user_id);
    if (!target) return { error: "Usuario no encontrado." };
    const permissionError = managedUpdateError(actor, target, parsed.data);
    if (permissionError) return { error: permissionError };
    if (target.updated_at !== parsed.data.version) return { error: "Otro administrador modificó este usuario. Recargue la página." };
    const values = { full_name: parsed.data.full_name, role: parsed.data.role, is_active: parsed.data.is_active };
    const result = await admin.from("profiles").update(values).eq("id", target.id).eq("updated_at", target.updated_at).select("updated_at").maybeSingle();
    if (result.error || !result.data) return { error: "El usuario cambió o no pudo guardarse. Recargue la página." };
    const updated = result.data.updated_at as string;
    const synced = await syncIdentity(admin, target.id, target.is_active !== values.is_active ? values.is_active ? "none" : "876000h" : undefined);
    if (!synced) {
      await admin.from("profiles").update({ full_name: target.full_name, role: target.role, is_active: target.is_active }).eq("id", target.id).eq("updated_at", updated);
      await syncIdentity(admin, target.id, target.is_active ? "none" : "876000h");
      revalidatePath("/bbs-control/usuarios");
      return { error: "No se pudo completar la actualización del acceso. Revise el estado actual antes de reintentar." };
    }
    revalidatePath("/bbs-control/usuarios");
    return { error: "", success: "Usuario actualizado." };
  } catch { return { error: "No se pudo actualizar el usuario. Intente nuevamente." }; }
}

export async function resetManagedPassword(_previous: ManagedUserState, form: FormData): Promise<ManagedUserState> {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) return denied;
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationError(parsed.error.issues);
  try {
    const admin = createSupabaseAdminClient();
    const target = await readTarget(admin, parsed.data.user_id);
    if (!target) return { error: "Usuario no encontrado." };
    if (!mayManageTarget(actor.role, target)) return { error: "No tiene permiso para restablecer esta cuenta." };
    if (target.updated_at !== parsed.data.version) return { error: "El usuario cambió. Recargue la página antes de restablecer su contraseña." };
    const auth = await admin.auth.admin.getUserById(target.id);
    if (auth.error || !auth.data.user) return { error: "No se pudo consultar el acceso del usuario." };
    const flag = await admin.from("profiles").update({ must_change_password: true }).eq("id", target.id).eq("updated_at", target.updated_at).select("updated_at").maybeSingle();
    if (flag.error || !flag.data) return { error: "El usuario cambió. Recargue la página." };
    const reset = await admin.auth.admin.updateUserById(target.id, { password: parsed.data.password, app_metadata: { ...auth.data.user.app_metadata, bbs_role: target.role, bbs_is_active: target.is_active, must_change_password: true } });
    if (reset.error) {
      await syncIdentity(admin, target.id);
      revalidatePath("/bbs-control/usuarios");
      return { error: "No se pudo confirmar la nueva contraseña. El cambio obligatorio sigue activo; intente establecer otra contraseña temporal." };
    }
    const synced = await syncIdentity(admin, target.id);
    const resolved = await resolveRequests(admin, target.id, actor.id);
    revalidatePath("/bbs-control/usuarios");
    return { error: "", success: "Contraseña temporal establecida. El usuario deberá cambiarla al entrar.", ...(!synced ? { warning: "Revise el estado del usuario antes de compartir la contraseña; no se pudo confirmar la actualización completa." } : !resolved ? { warning: "La solicitud de recuperación sigue pendiente. Puede marcarla como atendida." } : {}) };
  } catch { return { error: "No se pudo confirmar el restablecimiento. Revise el estado del usuario antes de reintentar." }; }
}

export async function createManagedRecoveryLink(_previous: ManagedUserState, form: FormData): Promise<ManagedUserState> {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) return denied;
  const parsed = reference.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationError(parsed.error.issues);
  try {
    const base = new URL(process.env.BBS_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://bbsbiomedical.com");
    const local = process.env.NODE_ENV !== "production" && base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname);
    if (base.username || base.password || !local && base.origin !== "https://bbsbiomedical.com") return { error: "La dirección de recuperación no está configurada correctamente." };
    const admin = createSupabaseAdminClient();
    const target = await readTarget(admin, parsed.data.user_id);
    if (!target || !mayManageTarget(actor.role, target)) return { error: "No tiene permiso para recuperar esta cuenta." };
    if (!target.is_active) return { error: "Active el usuario antes de generar un enlace de recuperación." };
    const auth = await admin.auth.admin.getUserById(target.id);
    if (auth.error || !auth.data.user?.email) return { error: "No se pudo consultar el acceso del usuario." };
    const result = await admin.auth.admin.generateLink({ type: "recovery", email: auth.data.user.email });
    const hash = result.data.properties?.hashed_token;
    if (result.error || !hash) return { error: "No se pudo generar el enlace. Intente nuevamente." };
    const url = new URL("/bbs-control/recuperar/confirmar", base); url.searchParams.set("token_hash", hash); url.searchParams.set("type", "recovery");
    return { error: "", success: "Enlace de un solo uso generado. Compártalo directamente con el titular de la cuenta.", recoveryUrl: url.toString() };
  } catch { return { error: "No se pudo generar el enlace de recuperación." }; }
}

export async function resolveManagedRecovery(_previous: ManagedUserState, form: FormData): Promise<ManagedUserState> {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) return denied;
  const parsed = reference.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationError(parsed.error.issues);
  try {
    const admin = createSupabaseAdminClient();
    const target = await readTarget(admin, parsed.data.user_id);
    if (!target || !mayManageTarget(actor.role, target)) return { error: "No tiene permiso para atender esta solicitud." };
    if (!await resolveRequests(admin, target.id, actor.id)) return { error: "No se pudo actualizar la solicitud." };
    revalidatePath("/bbs-control/usuarios");
    return { error: "", success: "Solicitud marcada como atendida." };
  } catch { return { error: "No se pudo actualizar la solicitud." }; }
}
