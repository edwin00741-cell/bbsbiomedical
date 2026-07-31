import Link from "next/link";
import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  SelectInput,
} from "../../components";
import {
  duplicateQuoteAction,
  deleteQuoteAction,
  markQuoteSentAction,
  sendQuoteAction,
  updateQuoteStatusAction,
} from "../../actions";
import { displayDate, money } from "../../../../lib/bbs-control/format";
import { getQuoteWithItems } from "../../../../lib/bbs-control/quotes";
import { requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const { id } = await params;
  const quote = await getQuoteWithItems(id);

  if (!quote) {
    return (
      <BackOfficeShell user={user}>
        <PageHeader eyebrow="Cotización" title="No encontrada" />
        <BackOfficeCard>
          <Link className="font-black text-cyan-700" href="/bbs-control/cotizaciones">
            Volver al listado
          </Link>
        </BackOfficeCard>
      </BackOfficeShell>
    );
  }

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-300"
              href={`/api/bbs-control/quotes/${quote.id}/pdf`}
            >
              Descargar PDF
            </a>
            <a
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-300"
              href={`/api/bbs-control/quotes/${quote.id}/pdf?inline=1`}
              target="_blank"
            >
              Ver PDF
            </a>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-300"
              href={`/bbs-control/cotizaciones/${quote.id}/editar`}
            >
              Editar
            </Link>
            <form action={sendQuoteAction}>
              <input name="quote_id" type="hidden" value={quote.id} />
              <PrimaryButton type="submit">Enviar por correo</PrimaryButton>
            </form>
          </div>
        }
        description={`${quote.client_name} · ${displayDate(quote.issue_date)}`}
        eyebrow="Cotización"
        title={quote.quote_number}
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <BackOfficeCard>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Cliente</p>
              <p className="mt-2 font-black text-slate-950">{quote.client_name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{quote.client_email || "Sin correo"}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Vendedor</p>
              <p className="mt-2 font-black text-slate-950">{quote.seller_name}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Validez</p>
              <p className="mt-2 font-black text-slate-950">{displayDate(quote.valid_until)}</p>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-black text-slate-950">Descripción del proyecto</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {quote.project_description || "Sin descripción."}
            </p>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase tracking-[0.14em] text-white">
                <tr>
                  <th className="px-4 py-3">Producto o servicio</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-semibold text-slate-800">{item.description}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-700">
                      {money(Number(item.unit_price))}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-950">
                      {money(Number(item.line_total))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-4 text-right font-black text-slate-950" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-4 text-right text-xl font-black text-cyan-700">
                    {money(Number(quote.total))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {quote.notes ? (
            <div className="mt-6 rounded-[8px] bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Notas</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{quote.notes}</p>
            </div>
          ) : null}
        </BackOfficeCard>
        <div className="grid content-start gap-6">
          <BackOfficeCard>
            <h2 className="text-xl font-black text-slate-950">Estado</h2>
            <form action={updateQuoteStatusAction} className="mt-4 grid gap-3">
              <input name="quote_id" type="hidden" value={quote.id} />
              <SelectInput defaultValue={quote.status} name="status">
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
                <option value="expired">Expirada</option>
              </SelectInput>
              <PrimaryButton type="submit">Actualizar estado</PrimaryButton>
            </form>
            <form action={markQuoteSentAction} className="mt-3">
              <input name="quote_id" type="hidden" value={quote.id} />
              <button className="h-12 w-full rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-300">
                Marcar como enviada
              </button>
            </form>
            <form action={duplicateQuoteAction} className="mt-3">
              <input name="quote_id" type="hidden" value={quote.id} />
              <button className="h-12 w-full rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-300">
                Duplicar cotización
              </button>
            </form>
            <form action={deleteQuoteAction} className="mt-3">
              <input name="quote_id" type="hidden" value={quote.id} />
              <button className="h-12 w-full rounded-full border border-red-200 bg-red-50 px-6 text-sm font-black text-red-700 transition hover:bg-red-100">
                Borrar
              </button>
            </form>
          </BackOfficeCard>
          <BackOfficeCard>
            <h2 className="text-xl font-black text-slate-950">Historial</h2>
            <div className="mt-4 grid gap-3">
              {(quote.events || []).map((event) => (
                <div className="rounded-[8px] bg-slate-50 p-3" key={event.id}>
                  <p className="text-sm font-black text-slate-950">{event.event_type}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {new Date(event.created_at).toLocaleString("es-PA")}
                  </p>
                  {event.note ? <p className="mt-2 text-sm text-slate-600">{event.note}</p> : null}
                </div>
              ))}
            </div>
          </BackOfficeCard>
        </div>
      </div>
    </BackOfficeShell>
  );
}


