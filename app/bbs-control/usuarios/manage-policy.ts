import { can, canManageRole, type BbsRole } from "../../../lib/bbs-control/permissions";

export const managedRoles = ["cotizador", "admin"] as const;
export const managedRoleLabels: Record<BbsRole, string> = { cotizador: "Cotizador", admin: "Administrador", super_admin: "Superadministrador" };
const reservedNames = new Set(["bryanrodriguez", "edwin00741", "edwin00741_gmail"]);
export type ManagedProfile = { id: string; username: string; full_name: string; role: BbsRole; is_active: boolean; must_change_password: boolean; created_at: string; updated_at: string };
export type ManagedUserState = { error: string; success?: string; warning?: string; recoveryUrl?: string };

export function mayManageUsers(role: string) { return can(role, "users.manage"); }
export function mayManageTarget(actorRole: string, target: Pick<ManagedProfile, "role">) { return mayManageUsers(actorRole) && canManageRole(actorRole, target.role); }
export function reservedUsername(username: string) { return reservedNames.has(username.toLowerCase()); }
export function managedUpdateError(actor: { id: string; role: string }, target: ManagedProfile, next: { role: BbsRole; is_active: boolean }) {
  if (!mayManageTarget(actor.role, target)) return "No tiene permiso para modificar este usuario.";
  if (target.role === "super_admin" && (next.role !== "super_admin" || next.is_active !== target.is_active)) return "El rol y el acceso de las cuentas de superadministración se conservan.";
  if (next.role === "super_admin" && (target.role !== "super_admin" || !reservedUsername(target.username))) return "La superadministración está reservada a las cuentas autorizadas.";
  if (actor.id === target.id && (next.role !== target.role || !next.is_active)) return "No puede quitarse su propio acceso administrativo.";
  if (!canManageRole(actor.role, next.role)) return "No puede asignar ese rol.";
  return "";
}
