import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
  TextInput,
} from "../components";
import {
  createUserAction,
  resetUserPasswordAction,
  updateUserAction,
} from "../actions";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";
import type { BbsRole } from "../../../lib/bbs-control/types";

export const dynamic = "force-dynamic";

const roleLabel: Record<BbsRole, string> = {
  admin: "Admin",
  super_admin: "Super admin",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });
  const canManageUsers = user.role === "super_admin";

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Cree usuarios internos y deje listo su acceso al panel privado con usuario corto y contraseña temporal."
        eyebrow="Usuarios"
        title="Acceso del equipo"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <BackOfficeCard className="h-fit">
          <h2 className="text-xl font-black text-slate-950">Nuevo usuario</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            El usuario podrá entrar en <span className="font-black text-slate-700">/bbs-control/login</span> con este nombre y contraseña.
          </p>
          <form action={createUserAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Usuario
              <TextInput name="username" placeholder="bryanrodriguez" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nombre completo
              <TextInput name="full_name" placeholder="Nombre del colaborador" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Rol
              <SelectInput defaultValue="admin" name="role">
                <option value="admin">Admin</option>
                {canManageUsers ? <option value="super_admin">Super admin</option> : null}
              </SelectInput>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Contraseña temporal
              <TextInput name="password" required type="password" />
            </label>
            <PrimaryButton className="w-full sm:w-fit" type="submit">
              Crear usuario
            </PrimaryButton>
          </form>
        </BackOfficeCard>

        <BackOfficeCard>
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                Directorio
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                Usuarios registrados
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-500">{users?.length || 0} usuarios</p>
          </div>

          <div className="mt-5 grid gap-4">
            {(users || []).map((item) => {
              const role = item.role as BbsRole;

              return (
                <details
                  className="rounded-[8px] border border-slate-200 bg-white p-4 open:border-cyan-200 open:bg-cyan-50/20"
                  key={item.id}
                >
                  <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[1fr_1fr_130px_110px] md:items-center">
                    <div>
                      <p className="font-black text-slate-950">{item.username}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{item.full_name}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{roleLabel[role]}</p>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                        item.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.is_active ? "Activo" : "Inactivo"}
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-center text-xs font-black text-cyan-800">
                      Gestionar
                    </span>
                  </summary>

                  {canManageUsers ? (
                    <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5">
                      <form action={updateUserAction} className="grid gap-4 lg:grid-cols-2">
                        <input name="user_id" type="hidden" value={item.id} />
                        <label className="grid gap-2 text-sm font-black text-slate-900">
                          Nombre completo
                          <TextInput defaultValue={item.full_name} name="full_name" required />
                        </label>
                        <label className="grid gap-2 text-sm font-black text-slate-900">
                          Rol
                          <SelectInput defaultValue={role} name="role">
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super admin</option>
                          </SelectInput>
                        </label>
                        <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 lg:col-span-2">
                          <input
                            className="size-4 accent-cyan-600"
                            defaultChecked={item.is_active}
                            name="is_active"
                            type="checkbox"
                          />
                          Usuario activo
                        </label>
                        <div className="lg:col-span-2">
                          <PrimaryButton className="w-full sm:w-fit" type="submit">
                            Guardar usuario
                          </PrimaryButton>
                        </div>
                      </form>

                      <form action={resetUserPasswordAction} className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-end">
                        <input name="user_id" type="hidden" value={item.id} />
                        <label className="grid gap-2 text-sm font-black text-slate-900">
                          Nueva contraseña temporal
                          <TextInput name="password" required type="password" />
                        </label>
                        <button className="h-12 rounded-full border border-cyan-200 px-5 text-sm font-black text-cyan-800 transition hover:bg-cyan-50">
                          Resetear contraseña
                        </button>
                      </form>
                    </div>
                  ) : (
                    <p className="mt-5 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-500">
                      Solo un super admin puede editar roles, estado o contraseñas.
                    </p>
                  )}
                </details>
              );
            })}

            {!users?.length ? (
              <div className="rounded-[8px] border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500">
                Aún no hay usuarios registrados.
              </div>
            ) : null}
          </div>
        </BackOfficeCard>
      </div>
    </BackOfficeShell>
  );
}
