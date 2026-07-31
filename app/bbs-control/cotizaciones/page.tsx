import Link from "next/link";
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
  deleteQuoteAction,
  duplicateQuoteAction,
  sendQuoteAction,
} from "../actions";
import { displayDate, money } from "../../../lib/bbs-control/format";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../../lib/bbs-control/supabase-server";
import type { QuoteStatus } from "../../../lib/bbs-control/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<QuoteStatus, string> = {
  draft: "Abierto",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Expirado",
};

function statusClass(status: QuoteStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "sent") return "bg-cyan-100 text-cyan-800";
  if (status === "rejected" || status === "expired") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const start = typeof params.start === "string" ? params.start : "";
  const end = typeof params.end === "string" ? params.end : "";
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });

  if (keyword) {
    query = query.or(`client_name.ilike.%${keyword}%,quote_number.ilike.%${keyword}%,seller_name.ilike.%${keyword}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (start) {
    query = query.gte("issue_date", start);
  }

  if (end) {
    query = query.lte("issue_date", end);
  }

  const { data: quotes } = await query;

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        action={
          <div className="flex gap-2">
            <Link href="/bbs-control/cotizaciones/nueva">
              <PrimaryButton type="button">+ Nueva cotización</PrimaryButton>
            </Link>
            <button
              className="h-12 rounded-[8px] border border-cyan-200 bg-white px-4 text-sm font-black text-slate-950"
              type="button"
            >
              ▾
            </button>
          </div>
        }
        eyebrow="Cotizaciones"
        title="Cotizaciones o estimados"
      />
      <FlashMessage searchParams={Promise.resolve(params)} />
      <BackOfficeCard className="mb-6">
        <form className="grid gap-4 lg:grid-cols-[150px_150px_150px_1fr_170px_110px]" method="get">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Período
            <SelectInput name="period">
              <option>Todos</option>
              <option>Hoy</option>
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
              <option>Este mes</option>
              <option>Este año</option>
              <option>Personalizar</option>
            </SelectInput>
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Inicio
            <TextInput defaultValue={start} name="start" type="date" />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Fin
            <TextInput defaultValue={end} name="end" type="date" />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Palabra clave
            <TextInput
              defaultValue={keyword}
              name="keyword"
              placeholder="Cliente, cotización #, vendedor"
            />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Tipo
            <SelectInput defaultValue={status} name="status">
              <option value="">Todos</option>
              <option value="draft">Cotizaciones abiertas</option>
              <option value="sent">Enviadas</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="expired">Expiradas</option>
            </SelectInput>
          </label>
          <div className="flex items-end">
            <button className="h-12 w-full rounded-[8px] border border-slate-200 bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-700">
              Buscar
            </button>
          </div>
        </form>
      </BackOfficeCard>
      <BackOfficeCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="py-3">Fecha</th>
                <th className="text-center">Número</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th className="text-right">Total</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Enviado</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(quotes || []).map((quote) => (
                <tr className="transition hover:bg-cyan-50/50" key={quote.id}>
                  <td className="py-4 font-semibold text-slate-700">{displayDate(quote.issue_date)}</td>
                  <td className="text-center font-black text-cyan-800">
                    <Link href={`/bbs-control/cotizaciones/${quote.id}/editar`}>
                      {quote.quote_number}
                    </Link>
                  </td>
                  <td className="font-semibold text-slate-700">Cotización</td>
                  <td className="font-semibold text-slate-800">{quote.client_name}</td>
                  <td className="font-semibold text-slate-700">{quote.seller_name || "Sin vendedor"}</td>
                  <td className="text-right font-black text-slate-950">{money(Number(quote.total))}</td>
                  <td className="text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(quote.status)}`}>
                      {statusLabel[quote.status as QuoteStatus] || quote.status}
                    </span>
                  </td>
                  <td className="text-center text-lg">
                    <form action={sendQuoteAction}>
                      <input name="quote_id" type="hidden" value={quote.id} />
                      <button
                        className="text-slate-500 transition hover:text-cyan-700"
                        title="Enviar por correo"
                        type="submit"
                      >
                        ✉
                      </button>
                    </form>
                  </td>
                  <td className="text-center">
                    <details className="relative inline-block">
                      <summary className="cursor-pointer list-none rounded-[8px] px-3 py-2 font-black text-slate-700 hover:bg-slate-100">
                        ▼
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 w-56 rounded-[8px] border border-slate-200 bg-white p-2 text-left shadow-xl">
                        <Link className="block rounded-[6px] px-3 py-2 font-bold hover:bg-cyan-50" href="/bbs-control/facturas/nueva">
                          Factura
                        </Link>
                        <Link className="block rounded-[6px] px-3 py-2 font-bold hover:bg-cyan-50" href={`/bbs-control/cotizaciones/${quote.id}/editar`}>
                          Editar
                        </Link>
                        <a className="block rounded-[6px] px-3 py-2 font-bold hover:bg-cyan-50" href={`/api/bbs-control/quotes/${quote.id}/pdf`}>
                          Descargar PDF
                        </a>
                        <a className="block rounded-[6px] px-3 py-2 font-bold hover:bg-cyan-50" href={`/api/bbs-control/quotes/${quote.id}/pdf?inline=1`} target="_blank">
                          Ver PDF
                        </a>
                        <a className="block rounded-[6px] px-3 py-2 font-bold hover:bg-cyan-50" href={`/api/bbs-control/quotes/${quote.id}/pdf?inline=1`} target="_blank">
                          Imprimir cotización
                        </a>
                        <form action={duplicateQuoteAction}>
                          <input name="quote_id" type="hidden" value={quote.id} />
                          <button className="block w-full rounded-[6px] px-3 py-2 text-left font-bold hover:bg-cyan-50">
                            Crear duplicado
                          </button>
                        </form>
                        <form action={sendQuoteAction}>
                          <input name="quote_id" type="hidden" value={quote.id} />
                          <button className="block w-full rounded-[6px] px-3 py-2 text-left font-bold hover:bg-cyan-50">
                            Correo electrónico
                          </button>
                        </form>
                        <form action={deleteQuoteAction}>
                          <input name="quote_id" type="hidden" value={quote.id} />
                          <button className="block w-full rounded-[6px] px-3 py-2 text-left font-bold text-red-700 hover:bg-red-50">
                            Borrar
                          </button>
                        </form>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-bold text-slate-600">
          <span>Página 1 de 1</span>
          <div className="flex items-center gap-2">
            <button className="rounded-[8px] border border-slate-200 px-3 py-2 text-slate-400" disabled>
              Anterior
            </button>
            <button className="rounded-[8px] border border-slate-200 px-3 py-2 text-slate-400" disabled>
              Siguiente &gt;
            </button>
            <span className="ml-2">Saltar</span>
            <TextInput className="h-10 w-16 px-2 text-center" defaultValue="1" />
          </div>
        </div>
      </BackOfficeCard>
    </BackOfficeShell>
  );
}
