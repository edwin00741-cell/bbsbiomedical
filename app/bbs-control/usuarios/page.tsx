import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../components";
import { RecordDialog } from "../record-dialog";
import { Pagination } from "../pagination";
import { RowActions } from "../row-actions";
import { CreateManagedUserForm, ManagedRecoveryControls, ResetManagedPasswordForm, UpdateManagedUserForm } from "./user-forms";
import { managedRoleLabels, managedRoles, mayManageTarget, mayManageUsers, type ManagedProfile } from "./manage-policy";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { roleHome } from "../../../lib/bbs-control/permissions";
import { param, searchOr, type SearchParams } from "../../../lib/bbs-control/list-filters";
import "./users.css";

export const dynamic = "force-dynamic";
const columns = "id,username,full_name,role,is_active,must_change_password,created_at,updated_at";
type RecoveryRequest = { id: string; user_id: string; requested_at: string; status: string };

export default async function UsersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const actor = await requireBackOfficeUser();
  if (!mayManageUsers(actor.role)) redirect(roleHome(actor.role));
  const params = searchParams ? await searchParams : {};
  const keyword = param(params, "keyword").trim().slice(0, 200);
  const role = param(params, "role");
  const status = param(params, "status");
  const rawPage = Number(param(params, "page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000000) : 1;
  const cleanParams: SearchParams = { ...(keyword ? { keyword } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}) };
  const query = new URLSearchParams({ ...cleanParams as Record<string, string>, page: String(page) });
  const path = "/bbs-control/usuarios";
  const closeHref = `${path}?${query}`;
  const dialogHref = (key: string, value: string) => { const next = new URLSearchParams(query); next.set(key, value); return `${path}?${next}`; };
  const supabase = await createSupabaseServerClient();
  let usersQuery = supabase.from("profiles").select(columns, { count: "exact" }).order("created_at", { ascending: false }).order("id");
  if (keyword) usersQuery = usersQuery.or(searchOr(["username", "full_name"], keyword));
  if (["super_admin", ...managedRoles].includes(role)) usersQuery = usersQuery.eq("role", role);
  if (["active", "inactive"].includes(status)) usersQuery = usersQuery.eq("is_active", status === "active");
  const [usersResult, queueResult] = await Promise.all([
    usersQuery.range((page - 1) * 20, page * 20 - 1),
    supabase.from("password_reset_requests").select("id,user_id,requested_at,status", { count: "exact" }).eq("status", "pending").order("requested_at").order("id").limit(50),
  ]);
  const users = (usersResult.data || []) as ManagedProfile[];
  const requests = (queueResult.data || []) as RecoveryRequest[];
  const profiles = new Map(users.map((user) => [user.id, user]));
  const moreIds = Array.from(new Set(requests.map((request) => request.user_id))).filter((id) => !profiles.has(id));
  const selectedId = param(params, "manage");
  if (z.uuid().safeParse(selectedId).success && !profiles.has(selectedId)) moreIds.push(selectedId);
  let selectedError = false;
  if (moreIds.length) {
    const extra = await supabase.from("profiles").select(columns).in("id", Array.from(new Set(moreIds)));
    selectedError = Boolean(extra.error);
    for (const profile of (extra.data || []) as ManagedProfile[]) profiles.set(profile.id, profile);
  }
  const selected = profiles.get(selectedId);
  const pages = Math.max(1, Math.ceil((usersResult.count || 0) / 20));
  if (!usersResult.error && page > pages) redirect(`${path}?${new URLSearchParams({ ...cleanParams as Record<string, string>, page: String(pages) })}`);
  return <BackOfficeShell user={actor}><div className="bbs-users">
    <PageHeader eyebrow="Usuarios" title="Usuarios" action={<><Link className="bbs-button" href="/bbs-control/cambiar-contrasena">Cambiar mi contraseña</Link><Link className="bbs-button bbs-button-primary" href={dialogHref("new", "1")}>+ Nuevo usuario</Link></>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <div className="bbs-user-roles"><section><h2>Cotizador</h2><p>Consulta hojas de trabajo y crea sus cotizaciones.</p></section><section><h2>Superadministrador</h2><p>Acceso completo a los módulos administrativos.</p></section><section><h2>Administrador</h2><p>Gestiona los módulos y las cuentas del equipo.</p></section></div>
    <form method="get" className="bbs-filters"><label>Palabra clave:<input className="bbs-input bbs-keyword" name="keyword" maxLength={200} defaultValue={keyword} placeholder="Usuario o nombre" /></label><label>Rol:<select className="bbs-select" name="role" defaultValue={role}><option value="">Todos</option>{Object.entries(managedRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Estado:<select className="bbs-select" name="status" defaultValue={status}><option value="">Todos</option><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label><button className="bbs-button">Buscar</button></form>
    {usersResult.error ? <DataError>No se pudieron cargar los usuarios. Intente nuevamente.</DataError> : <>
      <div className="bbs-table-scroll"><table className="bbs-table bbs-users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Contraseña</th><th>Creado</th><th>Acción</th></tr></thead><tbody>{users.length ? users.map((user) => <tr key={user.id}><td>{user.username}</td><td>{user.full_name}</td><td>{managedRoleLabels[user.role]}</td><td><span className={`bbs-badge bbs-badge-${user.is_active ? "paid" : "rejected"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td><td>{user.must_change_password ? "Cambio obligatorio" : "Personal"}</td><td className="bbs-nowrap">{user.created_at.slice(0, 10)}</td><td>{mayManageTarget(actor.role, user) ? <RowActions label={`Acciones de ${user.username}`}><Link href={dialogHref("manage", user.id)}>Gestionar usuario</Link></RowActions> : <span className="bbs-field-hint">Cuenta protegida</span>}</td></tr>) : <tr><td className="bbs-empty" colSpan={7}>No hay usuarios para los filtros seleccionados.</td></tr>}</tbody></table></div>
      <Pagination path={path} params={cleanParams} page={page} count={usersResult.count || 0} />
    </>}
    <section className="bbs-users-queue"><h2>Solicitudes de recuperación</h2>{queueResult.error || selectedError ? <DataError>No se pudieron cargar las solicitudes de recuperación.</DataError> : <><div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 650 }}><thead><tr><th>Fecha</th><th>Usuario</th><th>Nombre</th><th>Acción</th></tr></thead><tbody>{requests.length ? requests.map((request) => { const target = profiles.get(request.user_id); return <tr key={request.id}><td>{new Intl.DateTimeFormat("es-PA", { timeZone: "America/Panama", dateStyle: "short", timeStyle: "short" }).format(new Date(request.requested_at))}</td><td>{target?.username || "Usuario"}</td><td>{target?.full_name || "—"}</td><td>{target && mayManageTarget(actor.role, target) ? <Link className="bbs-button" href={dialogHref("manage", target.id)}>Atender solicitud</Link> : "Solo superadministrador"}</td></tr>; }) : <tr><td className="bbs-empty" colSpan={4}>No hay solicitudes pendientes.</td></tr>}</tbody></table></div>{(queueResult.count || 0) > 50 ? <p className="bbs-field-hint">Se muestran las 50 solicitudes más antiguas de {queueResult.count}. Al atenderlas aparecerán las siguientes.</p> : null}</>}
    </section>
    {param(params, "new") === "1" ? <RecordDialog title="Nuevo usuario" closeHref={closeHref}><div className="bbs-users"><CreateManagedUserForm /></div></RecordDialog> : null}
    {selectedId ? <RecordDialog title={selected ? `Gestionar ${selected.username}` : "Usuario no encontrado"} closeHref={closeHref}><div className="bbs-users">{selected && mayManageTarget(actor.role, selected) ? <>
      <UpdateManagedUserForm key={selected.id} target={selected} actorId={actor.id} /><details className="bbs-user-panel"><summary>Restablecer contraseña</summary><ResetManagedPasswordForm target={selected} /></details><details className="bbs-user-panel" open={requests.some((request) => request.user_id === selected.id)}><summary>Recuperar acceso</summary><ManagedRecoveryControls target={selected} pendingRequest={requests.some((request) => request.user_id === selected.id)} /></details>
    </> : <DataError>{selected ? "Esta cuenta solo puede ser gestionada por un superadministrador." : "No se encontró el usuario solicitado."}</DataError>}</div></RecordDialog> : null}
  </div></BackOfficeShell>;
}
