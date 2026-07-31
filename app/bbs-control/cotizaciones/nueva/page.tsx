import Image from "next/image";
import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from "../../components";
import { createQuoteAction } from "../../actions";
import { addDaysForInput, dateForInput } from "../../../../lib/bbs-control/format";
import { getBusinessSettings } from "../../../../lib/bbs-control/quotes";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const settings = await getBusinessSettings();
  const supabase = await createSupabaseServerClient();
  const { data: clients } = await supabase.from("clients")
    .select("id, name, email, address")
    .order("name", { ascending: true });
  const { data: items } = await supabase.from("items")
    .select("id, sku, name, unit_price")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Cree una cotización con el flujo de trabajo tipo Brisk: cliente, condiciones, direcciones, artículos y notas."
        eyebrow="Nueva cotización"
        title="Nueva Cotización"
      />
      <FlashMessage searchParams={searchParams} />
      <BackOfficeCard className="bg-slate-100 p-3 lg:p-6">
        <form action={createQuoteAction} className="mx-auto max-w-6xl rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
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
                <SelectInput name="client_id">
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
                <TextInput name="client_name" placeholder="Nombre o empresa" required />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Email del cliente
                <TextInput name="client_email" placeholder="correo@empresa.com" type="email" />
              </label>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Fecha
              <TextInput defaultValue={dateForInput()} name="issue_date" required type="date" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nº de cotización
              <TextInput defaultValue="Automático" disabled />
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
              <TextInput defaultValue={user.full_name} name="seller_name" required />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Dirección de facturación
              <TextArea name="billing_address" placeholder="Dirección fiscal del cliente." />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Dirección de envío
              <TextArea name="shipping_address" placeholder="Dejar en blanco si es igual a facturación." />
            </label>
          </div>

          <input
            name="valid_until"
            type="hidden"
            value={addDaysForInput(settings.default_validity_days || 30)}
          />
          <label className="mt-6 grid gap-2 text-sm font-black text-slate-900">
            Descripción del proyecto
            <TextArea name="project_description" placeholder="Descripción general del alcance técnico." />
          </label>

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
                {Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2"
                        defaultValue={index === 0 ? "1" : ""}
                        min="0"
                        name={`item_quantity_${index}`}
                        step="0.01"
                        type="number"
                      />
                    </td>
                    <td className="p-2 align-top">
                      <SelectInput className="h-10 px-2" name={`item_id_${index}`}>
                        <option value="">Manual</option>
                        {(items || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku || item.name}
                          </option>
                        ))}
                      </SelectInput>
                    </td>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2"
                        name={`item_description_${index}`}
                        placeholder={index === 0 ? "Descripción" : "Producto o servicio"}
                        required={index === 0}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <TextInput
                        className="h-10 px-2 text-right"
                        defaultValue={index === 0 ? "0" : ""}
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
                    <td className="p-2 text-right align-middle font-black text-slate-500">B/.0.00</td>
                    <td className="p-2 text-center align-middle text-slate-300">×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-[8px] border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800" type="button">
              + Agregar artículo
            </button>
            <button className="rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" type="button">
              + Añadir descuento
            </button>
            <button className="rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" type="button">
              + Añadir envío
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Nota pública
              <TextArea
                defaultValue={`Cotización válida por ${settings.default_validity_days || 30} días. Forma de pago según acuerdo comercial.`}
                name="notes"
              />
            </label>
            <div className="rounded-[8px] bg-slate-50 p-5">
              <div className="flex justify-between border-b border-slate-200 pb-3 text-sm font-bold text-slate-600">
                <span>Subtotal</span>
                <span>B/.0.00</span>
              </div>
              <div className="flex justify-between pt-4 text-xl font-black text-slate-950">
                <span>Total</span>
                <span>B/.0.00</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button className="rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-black text-red-700" type="reset">
              Borrar cotización
            </button>
            <PrimaryButton type="submit">Crear cotización</PrimaryButton>
          </div>
        </form>
      </BackOfficeCard>
    </BackOfficeShell>
  );
}
