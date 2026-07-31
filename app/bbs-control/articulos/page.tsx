import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from "../components";
import { createItemAction } from "../actions";
import { money } from "../../../lib/bbs-control/format";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase.from("items")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Catálogo de servicios, repuestos y artículos reutilizables en cotizaciones y facturas."
        eyebrow="Artículos"
        title="Catálogo comercial"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Nuevo artículo</h2>
          <form action={createItemAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Código / SKU
              <TextInput name="sku" placeholder="BBS-SRV-001" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nombre
              <TextInput name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Descripción
              <TextArea name="description" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Precio
                <TextInput defaultValue="0" min="0" name="unit_price" step="0.01" type="number" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Unidad
                <SelectInput defaultValue="servicio" name="unit">
                  <option value="servicio">servicio</option>
                  <option value="unidad">unidad</option>
                  <option value="hora">hora</option>
                  <option value="visita">visita</option>
                  <option value="repuesto">repuesto</option>
                </SelectInput>
              </label>
            </div>
            <input name="is_active" type="hidden" value="true" />
            <PrimaryButton type="submit">Crear artículo</PrimaryButton>
          </form>
        </BackOfficeCard>
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Artículos registrados</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3">SKU</th>
                  <th>Artículo</th>
                  <th>Unidad</th>
                  <th className="text-right">Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-black text-slate-950">{item.sku || "-"}</td>
                    <td>
                      <p className="font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                        {item.description || "Sin descripción"}
                      </p>
                    </td>
                    <td className="font-semibold text-slate-700">{item.unit}</td>
                    <td className="text-right font-black text-slate-950">{money(Number(item.unit_price))}</td>
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




