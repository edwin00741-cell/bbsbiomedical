import Link from "next/link";
import { redirect } from "next/navigation";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../components";
import { ListFilters } from "../list-controls";
import { Pagination } from "../pagination";
import { ActionSubmit, RowActions } from "../row-actions";
import { deleteQuoteAction, duplicateQuoteAction, sendQuoteAction } from "../actions";
import { money } from "../../../lib/bbs-control/format";
import { pageHref, param, parseListFilters, searchOr, type SearchParams } from "../../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { quoteStatusSchema } from "../../../lib/bbs-control/validation";
import type { Quote, QuoteStatus } from "../../../lib/bbs-control/types";
import {can} from "../../../lib/bbs-control/permissions";

export const dynamic = "force-dynamic";
const statusLabel: Record<QuoteStatus, string> = {
  draft: "Abierto", sent: "Enviado", approved: "Aprobado", rejected: "Rechazado", expired: "Expirado",
};
export default async function QuotesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  let filters = parseListFilters({});
  let filterError = "";
  try { filters = parseListFilters(params); }
  catch (error) { filterError = error instanceof Error ? error.message : "Filtros inválidos."; }
  const rawStatus = param(params, "status");
  const parsedStatus = quoteStatusSchema.safeParse(rawStatus);
  if (rawStatus && !parsedStatus.success) filterError = "Estado inválido.";
  const status = parsedStatus.success ? parsedStatus.data : "";
  const supabase = await createSupabaseServerClient();
  const kind = ["quote", "estimate"].includes(param(params, "kind")) ? param(params, "kind") : "";
  let result: { data: (Quote & { document_kind?: string; emailed_at?: string | null })[] | null; count: number | null; error: unknown } = { data: null, count: 0, error: null };
  if (!filterError) {
    const makeQuery = (head = false) => {
      let query = supabase.from("quotes").select("*", { count: "exact", head })
        .order("issue_date", { ascending: false }).order("created_at", { ascending: false }).order("id");
      if (filters.keyword) query = query.or(searchOr(["client_name", "quote_number", "seller_name"], filters.keyword));
      if (status) query = query.eq("status", status);
      if (kind) query = query.eq("document_kind", kind);
      if (filters.start) query = query.gte("issue_date", filters.start);
      if (filters.end) query = query.lte("issue_date", filters.end);
      return head ? query : query.range((filters.page - 1) * 20, filters.page * 20 - 1);
    };
    result = await makeQuery();
    if ((result.error as { code?: string } | null)?.code === "PGRST103") result = await makeQuery(true);
  }
  const pages = Math.max(1, Math.ceil((result.count || 0) / 20));
  if (!filterError && !result.error && filters.page > pages) redirect(pageHref("/bbs-control/cotizaciones", params, pages));
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Cotizaciones" title="Cotizaciones o estimados" action={
      <Link className="bbs-button bbs-button-primary" href="/bbs-control/cotizaciones/nueva">+ Nueva cotización</Link>
    } />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <ListFilters key={JSON.stringify(params)} {...filters} placeholder="Cliente, cotización, vendedor">
      <label>Tipo:<select className="bbs-select" name="kind" defaultValue={kind}><option value="">Todos</option><option value="quote">Cotizaciones</option><option value="estimate">Estimados</option></select></label>
      <label>Estado:<select className="bbs-select" name="status" defaultValue={status}>
        <option value="">Todos</option>{Object.entries(statusLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select></label>
    </ListFilters>
    {filterError || result.error ? <DataError>{filterError || "No se pudieron cargar las cotizaciones. Intente nuevamente."}</DataError> : <>
      <div className="bbs-table-scroll"><table className="bbs-table bbs-quotes-table">
        <thead><tr>{["Fecha", "Número", "Tipo", "Cliente", "Vendedor", "Total", "Estado", "Enviado", "Acción"].map((label) =>
          <th key={label} scope="col" className={label === "Total" ? "bbs-money" : ""}>{label}</th>)}</tr></thead>
        <tbody>{(result.data || []).map((quote) => <tr key={quote.id}>
          <td className="bbs-nowrap">{quote.issue_date}</td>
          <td><Link href={`/bbs-control/cotizaciones/${quote.id}/editar`}>{quote.quote_number}</Link></td>
          <td>{quote.document_kind === "estimate" ? "Estimado" : "Cotización"}</td><td>{quote.client_name}</td><td>{quote.seller_name || "—"}</td>
          <td className="bbs-money">{money(Number(quote.total))}</td>
          <td><span className={`bbs-badge bbs-badge-${quote.status}`}>{statusLabel[quote.status]}</span></td>
          <td>{quote.emailed_at ? <span className="bbs-badge bbs-badge-sent">Enviado</span> : "—"}</td>
          <td><RowActions label={`Acciones de cotización ${quote.quote_number}`}>
            {can(user.role,"finance.write")?<Link href={`/bbs-control/facturas/nueva?quote_id=${quote.id}`}>Factura</Link>:null}
            <Link href={`/bbs-control/cotizaciones/${quote.id}`}>Ver detalle</Link>
            <Link href={`/bbs-control/cotizaciones/${quote.id}/editar`}>Editar</Link>
            <a href={`/api/bbs-control/quotes/${quote.id}/pdf`}>Descargar PDF</a>
            <a href={`/api/bbs-control/quotes/${quote.id}/pdf?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a>
            <form action={duplicateQuoteAction}><input type="hidden" name="quote_id" value={quote.id} /><ActionSubmit>Crear duplicado</ActionSubmit></form>
            <form action={sendQuoteAction}><input type="hidden" name="quote_id" value={quote.id} /><ActionSubmit>Correo electrónico</ActionSubmit></form>
            {user.role!=="cotizador"||["draft","sent"].includes(quote.status)?<form action={deleteQuoteAction}><input type="hidden" name="quote_id" value={quote.id} />
              <ActionSubmit danger confirmMessage={`¿Borrar cotización ${quote.quote_number}? Esta acción no se puede deshacer.`}>Borrar</ActionSubmit></form>:null}
          </RowActions></td>
        </tr>)}{!result.data?.length ? <tr><td colSpan={9} className="bbs-empty">No se encontraron cotizaciones.</td></tr> : null}</tbody>
      </table></div>
      <Pagination path="/bbs-control/cotizaciones" params={params} page={filters.page} count={result.count || 0} />
    </>}
  </BackOfficeShell>;
}
