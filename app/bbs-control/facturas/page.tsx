import Link from "next/link";
import { redirect } from "next/navigation";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../components";
import { ListFilters } from "../list-controls";
import { Pagination } from "../pagination";
import { ActionSubmit, RowActions } from "../row-actions";
import { duplicateDocument } from "../document-output-actions";
import { invoiceBalance } from "../../../lib/bbs-control/dashboard";
import { money } from "../../../lib/bbs-control/format";
import { pageHref, param, parseListFilters, searchOr, type SearchParams } from "../../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import type { Invoice } from "../../../lib/bbs-control/types";
export const dynamic = "force-dynamic";
const statusLabels: Record<string, string> = { draft: "Borrador", sent: "Pendiente", paid: "Pagado", partial: "Parcial", overdue: "Atrasado", void: "Anulado" };
export default async function InvoicesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  if (param(params,"type") === "recurring") redirect("/bbs-control/recurrentes");
  const view = param(params, "view");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(view)) redirect(`/bbs-control/facturas/${view}`);
  let filters = parseListFilters({});
  let filterError = "";
  try { filters = parseListFilters(params); } catch (error) { filterError = error instanceof Error ? error.message : "Filtros inválidos."; }
  const type = param(params, "type") === "draft" ? "draft" : "issued";
  const supabase = await createSupabaseServerClient();
  let result: { data: (Invoice & { emailed_at?: string | null })[] | null; count: number | null; error: unknown } = { data: [], count: 0, error: null };
  if (!filterError) {
    const makeQuery = (head = false) => {
      let query = supabase.from("invoices").select("*", { count: "exact", head })
        .order("issue_date", { ascending: false }).order("id");
      query = type === "draft" ? query.eq("status", "draft") : query.neq("status", "draft");
      if (filters.start) query = query.gte("issue_date", filters.start);
      if (filters.end) query = query.lte("issue_date", filters.end);
      if (filters.keyword) query = query.or(searchOr(["client_name", "invoice_number", "seller_name"], filters.keyword));
      return head ? query : query.range((filters.page - 1) * 20, filters.page * 20 - 1);
    };
    result = await makeQuery();
    if ((result.error as { code?: string } | null)?.code === "PGRST103") result = await makeQuery(true);
  }
  const pages = Math.max(1, Math.ceil((result.count || 0) / 20));
  if (!filterError && !result.error && filters.page > pages) redirect(pageHref("/bbs-control/facturas", params, pages));
  const cleanParams = { ...params }; delete cleanParams.view;
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Facturas" title="Prefacturas" action={<Link className="bbs-button bbs-button-primary" href="/bbs-control/facturas/nueva">+ Nueva prefactura</Link>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <ListFilters key={JSON.stringify(params)} {...filters} placeholder="Cliente, número de factura">
      <label>Ver:<select className="bbs-select" name="type" defaultValue={type}><option value="issued">Facturas</option><option value="draft">Borrador</option><option value="recurring">Recurrentes</option></select></label>
    </ListFilters>
    {filterError || result.error ? <DataError>{filterError || "No se pudieron cargar las facturas."}</DataError> : <>
      <div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 950 }}>
        <thead><tr>{["Fecha", "Número", "Cliente", "Importe a pagar", "Total", "Estado", "Enviado", "Acción"].map((label) =>
          <th scope="col" key={label} className={["Importe a pagar", "Total"].includes(label) ? "bbs-money" : ""}>{label}</th>)}</tr></thead>
        <tbody>{(result.data || []).map((invoice) => {
          const status = !["draft", "void", "paid"].includes(invoice.status) && invoice.due_date < filters.today && invoiceBalance(invoice) > 0 ? "overdue" : invoice.status;
          const href = `/bbs-control/facturas/${invoice.id}`;
          const pdf = `/api/bbs-control/invoices/${invoice.id}/pdf`;
          return <tr key={invoice.id}><td className="bbs-nowrap">{invoice.issue_date}</td><td><Link href={href}>{invoice.invoice_number}</Link></td>
            <td>{invoice.client_name}</td><td className="bbs-money">{money(invoiceBalance(invoice))}</td><td className="bbs-money">{money(Number(invoice.total))}</td>
            <td><span className={`bbs-badge bbs-badge-${status}`}>{statusLabels[status]}</span></td>
            <td>{invoice.emailed_at ? <span className="bbs-badge bbs-badge-sent">Enviado</span> : "—"}</td>
            <td><RowActions label={`Acciones de factura ${invoice.invoice_number}`}>
              <Link href={href}>Ver detalle</Link><Link href={`${href}/editar`}>Editar</Link>
              <a href={pdf}>Descargar PDF</a><a href={`${pdf}?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a>
              {!["draft", "void"].includes(invoice.status) ? <Link href={`${href}?email=1`}>Correo electrónico</Link> : null}
              {!["draft","void"].includes(invoice.status) ? <><Link href={`/bbs-control/pagos/nuevo?invoice_id=${invoice.id}`}>Aplicar pago</Link><Link href={`/bbs-control/notas-credito/nueva?invoice_id=${invoice.id}`}>Crear nota de crédito</Link><a href={`/api/bbs-control/invoices/${invoice.id}/delivery-note`}>Nota de entrega</a><a href={`/api/bbs-control/invoices/${invoice.id}/shipping-label`}>Etiqueta de envío</a></> : null}
              <Link href={`/bbs-control/recurrentes/nueva?invoice_id=${invoice.id}`}>Crear recurrente</Link>
              <form action={duplicateDocument}><input type="hidden" name="kind" value="invoice" /><input type="hidden" name="document_id" value={invoice.id} /><ActionSubmit>Crear duplicado</ActionSubmit></form>
            </RowActions></td></tr>;
        })}{!result.data?.length ? <tr><td colSpan={8} className="bbs-empty">No se encontraron facturas.</td></tr> : null}</tbody>
      </table></div><Pagination path="/bbs-control/facturas" params={cleanParams} page={filters.page} count={result.count || 0} />
    </>}
  </BackOfficeShell>;
}

