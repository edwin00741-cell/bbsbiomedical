import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  TextArea,
  TextInput,
} from "../components";
import { createClientAction } from "../actions";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const { data: clients } = await supabase.from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Guarde instituciones, contactos y correos para enviar cotizaciones."
        eyebrow="Clientes"
        title="Gestión de clientes"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Nuevo cliente</h2>
          <form action={createClientAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Institución
              <TextInput name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Contacto
              <TextInput name="contact_name" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Email
              <TextInput name="email" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Teléfono
              <TextInput name="phone" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Dirección
              <TextArea name="address" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Notas
              <TextArea name="notes" />
            </label>
            <PrimaryButton type="submit">Guardar cliente</PrimaryButton>
          </form>
        </BackOfficeCard>
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Clientes registrados</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3">Institución</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(clients || []).map((client) => (
                  <tr key={client.id}>
                    <td className="py-4 font-black text-slate-950">{client.name}</td>
                    <td className="font-semibold text-slate-700">{client.contact_name || "-"}</td>
                    <td className="font-semibold text-slate-700">{client.email || "-"}</td>
                    <td className="font-semibold text-slate-700">{client.phone || "-"}</td>
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




