import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
  TextInput,
} from "../components";
import { createUserAction } from "../actions";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const { data: users } = await supabase.from("profiles")
    .select("id, username, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Usuarios internos para el panel privado. Las contraseñas no se guardan en el código."
        eyebrow="Usuarios"
        title="Acceso del equipo"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Nuevo usuario</h2>
          <form action={createUserAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Usuario
              <TextInput name="username" placeholder="usuariointerno" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nombre completo
              <TextInput name="full_name" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Rol
              <SelectInput defaultValue="admin" name="role">
                <option value="admin">Admin</option>
                {user.role === "super_admin" ? <option value="super_admin">Super admin</option> : null}
              </SelectInput>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Contraseña temporal
              <TextInput name="password" required type="password" />
            </label>
            <PrimaryButton type="submit">Crear usuario</PrimaryButton>
          </form>
        </BackOfficeCard>
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Usuarios registrados</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3">Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-black text-slate-950">{item.username}</td>
                    <td className="font-semibold text-slate-700">{item.full_name}</td>
                    <td className="font-semibold text-cyan-700">{item.role}</td>
                    <td>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {item.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BackOfficeCard>
      </div>
    </BackOfficeShell>
  );
}




