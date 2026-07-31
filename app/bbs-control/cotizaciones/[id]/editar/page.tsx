import Image from "next/image";
import Link from "next/link";
import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from "../../../components";
import { updateQuoteAction } from "../../../actions";
import { money } from "../../../../../lib/bbs-control/format";
import { getBusinessSettings, getQuoteWithItems } from "../../../../../lib/bbs-control/quotes";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const { id } = await params;
  const [quote, settings] = await Promise.all([
    getQuoteWithItems(id),
    getBusinessSettings(),
  ]);
  const supabase = await createSupabaseServerClient();
  const { data: clients } = await supabase.from("clients")
    .select("id, name, email")
    .order("name", { ascending: true });
  const { data: items } = await supabase.from("items")
    .select("id, sku, name, unit_price")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!quote) {
    return (
      <BackOfficeShell user={user}>
        <PageHeader eyebrow="Editar cotización" title="No encontrada" />
      </BackOfficeShell>
    );
  }

  const rows = Array.from({ length: Math.max(8, quote.items.length) }).map((_, index) => quote.items[index]);

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        action={
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-cyan-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-400"
            href={`/bbs-control/cotizaciones/${quote.id}`}
          >
            Ver detalle
          </Link>
        }
        description="Edite la cotización en el mismo formato operativo que usa el equipo."
        eyebrow="Editar cotización"
        title={quote.quote_number}
      />
      <FlashMessage searchParams={searchParams} />
      <BackOfficeCard className="bg-slate-100 p-3 lg:p-6">
        <form action={updateQuoteAction} className="mx-auto max-w-6xl rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
          <input name="quote_id" type="hidden" value={quote.id} />
          <div className="grid gap-8 border-b border-slate-200 pb-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Image
                alt="Biomedical Business and Service"
                className="h-auto w-60"
                height={98}
                priority
                src="/brand/bbs-primary-horizontal-color.png"
                width={382}
              />
              <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600">
                {settings.address}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">
                {settings.phone} · {settings.email}
              </p>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Cliente
                <SelectInput defaultValue={quote.client_id || ""} name="client_id">
                  <option value="">Cliente manual</option>
                  {(clients || []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </SelectInput>
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Nombre del cliente
                <TextInput defaultValue={quote.client_name} name="client_name" required />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Email del cliente
                <TextInput defaultValue={quote.client_email || ""} name="client_email" type="email" />
              </label>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Fecha
              <TextInput defaultValue={quote.issue_date} name="issue_date" required type="date" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nº de cotización
              <TextInput defaultValue={quote.quote_number} disabled />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Condiciones de pago
              <SelectInput name="payment_terms">
                <option>COD</option>
                <option>Pago en días</option>
              </SelectInput>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Vendedor
              <TextInput defaultValue={quote.seller_name} name="seller_name" required />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Válida hasta
              <TextInput defaultValue={quote.valid_until} name="valid_until" required type="date" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900 lg:col-span-2">
              Descripción del proyecto
              <TextInput defaultValue={quote.project_description || ""} name="project_description" />
            </label>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[980px] border border-slate-200 text-sm">
              <thead className="bg-[#075985] text-left text-xs uppercase tracking-[0.14em] text-white">
                <tr>
                  <th className="w-24 px-3 py-3">Cant.</th>
                  <th className="w-44 px-3 py-3">Cód. artículo</th>
                  <th className="px-3 py-3">Descripción</th>
                  <th className="w-40 px-3 py-3 text-right">Precio unitario</th>
                  <th className="w-32 px-3 py-3 text-center">Impuesto</th>
                  <th className="w-36 px-3 py-3 text-right">Total</th>
                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2"
                        defaultValue={item ? String(item.quantity) : ""}
                        min="0"
                        name={`item_quantity_${index}`}
                        step="0.01"
                        type="number"
                      />
                    </td>
                    <td className="p-2 align-top">
                      <SelectInput className="h-10 px-2" defaultValue={item?.item_id || ""} name={`item_id_${index}`}>
                        <option value="">Manual</option>
                        {(items || []).map((catalogItem) => (
                          <option key={catalogItem.id} value={catalogItem.id}>
                            {catalogItem.sku || catalogItem.name}
                          </option>
                        ))}
                      </SelectInput>
                    </td>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2"
                        defaultValue={item?.description || ""}
                        name={`item_description_${index}`}
                        placeholder={index === 0 ? "Descripción" : "Producto o servicio"}
                        required={index === 0}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2 text-right"
                        defaultValue={item ? String(item.unit_price) : ""}
                        min="0"
                        name={`item_unit_price_${index}`}
                        step="0.01"
                        type="number"
                      />
                    </td>
                    <td className="p-2 align-top">
                      <SelectInput className="h-10 px-2" name={`item_tax_${index}`}>
                        <option>[Ninguno]</option>
                      </SelectInput>
                    </td>
                    <td className="p-2 text-right align-middle font-black text-slate-500">
                      {item ? money(Number(item.line_total)) : "B/.0.00"}
                    </td>
                    <td className="p-2 text-center align-middle text-slate-300">×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nota pública
              <TextArea defaultValue={quote.notes || ""} name="notes" />
            </label>
            <div className="rounded-[8px] bg-slate-50 p-5">
              <div className="flex justify-between border-b border-slate-200 pb-3 text-sm font-bold text-slate-600">
                <span>Subtotal</span>
                <span>{money(Number(quote.subtotal))}</span>
              </div>
              <div className="flex justify-between pt-4 text-xl font-black text-slate-950">
                <span>Total</span>
                <span>{money(Number(quote.total))}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <PrimaryButton type="submit">Guardar cambios</PrimaryButton>
          </div>
        </form>
      </BackOfficeCard>
    </BackOfficeShell>
  );
}
