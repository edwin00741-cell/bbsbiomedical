import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  TextArea,
  TextInput,
} from "../components";
import { createClientAction, updateClientAction } from "../actions";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

function ClientFields({
  prefix = "",
  client,
}: {
  prefix?: string;
  client?: {
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  return (
    <>
      <label className="grid gap-2 text-sm font-black text-slate-900">
        Institución
        <TextInput defaultValue={client?.name || ""} name={`${prefix}name`} required />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-900">
        Contacto
        <TextInput defaultValue={client?.contact_name || ""} name={`${prefix}contact_name`} />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-900">
        Email
        <TextInput defaultValue={client?.email || ""} name={`${prefix}email`} type="email" />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-900">
        Teléfono
        <TextInput defaultValue={client?.phone || ""} name={`${prefix}phone`} />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-900 lg:col-span-2">
        Dirección
        <TextArea defaultValue={client?.address || ""} name={`${prefix}address`} />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-900 lg:col-span-2">
        Notas
        <TextArea defaultValue={client?.notes || ""} name={`${prefix}notes`} />
      </label>
    </>
  );
}

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
        description="Agregue y edite instituciones, contactos, correos y direcciones para cotizaciones."
        eyebrow="Clientes"
        title="Gestión de clientes"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <BackOfficeCard className="h-fit">
          <h2 className="text-xl font-black text-slate-950">Nuevo cliente</h2>
          <form action={createClientAction} className="mt-5 grid gap-4">
            <ClientFields />
            <PrimaryButton className="w-full sm:w-fit" type="submit">
              Guardar cliente
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
                Clientes registrados
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-500">{clients?.length || 0} registros</p>
          </div>
          <div className="mt-5 grid gap-4">
            {(clients || []).map((client) => (
              <details
                className="rounded-[8px] border border-slate-200 bg-white p-4 open:border-cyan-200 open:bg-cyan-50/20"
                key={client.id}
              >
                <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="font-black text-slate-950">{client.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {client.contact_name || "Sin contacto"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{client.email || "Sin email"}</p>
                  <p className="text-sm font-semibold text-slate-700">{client.phone || "Sin teléfono"}</p>
                  <span className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-center text-xs font-black text-cyan-800">
                    Editar
                  </span>
                </summary>
                <form action={updateClientAction} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 lg:grid-cols-2">
                  <input name="client_id" type="hidden" value={client.id} />
                  <ClientFields client={client} />
                  <div className="lg:col-span-2">
                    <PrimaryButton className="w-full sm:w-fit" type="submit">
                      Guardar cambios
                    </PrimaryButton>
                  </div>
                </form>
              </details>
            ))}
            {!clients?.length ? (
              <div className="rounded-[8px] border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500">
                Aún no hay clientes registrados.
              </div>
            ) : null}
          </div>
        </BackOfficeCard>
      </div>
    </BackOfficeShell>
  );
}
