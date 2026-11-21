import Link from "next/link";
import { ClipboardList, CreditCard, FileMinus, FileText, Package, Receipt, Repeat2, UserPlus, Users } from "lucide-react";
import { BackOfficeShell, DataError } from "./components";
import { ListFilters } from "./list-controls";
import { Pagination } from "./pagination";
import { money } from "../../lib/bbs-control/format";
import { incomeMonths, invoiceBalance, monthlyIncome, readAllPages } from "../../lib/bbs-control/dashboard";
import { pageHref, panamaToday, parseListFilters, searchOr, type SearchParams } from "../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import type { Invoice } from "../../lib/bbs-control/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
const shortcuts = [
  { label: "Factura", icon: FileText, href: "/bbs-control/facturas/nueva" },
  { label: "Recurrente", icon: Repeat2, href: "/bbs-control/recurrentes/nueva" },
  { label: "Cliente", icon: Users, href: "/bbs-control/clientes?new=1" },
  { label: "Cotización", icon: Receipt, href: "/bbs-control/cotizaciones/nueva" },
  { label: "Nota de crédito", icon: FileMinus, href: "/bbs-control/notas-credito/nueva" },
  { label: "Pago", icon: CreditCard, href: "/bbs-control/pagos/nuevo" },
  { label: "Artículo", icon: Package, href: "/bbs-control/articulos?new=1" },
  { label: "Invitar usuario", icon: UserPlus, href: "/bbs-control/usuarios" },
];

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  const today = panamaToday();
  let filters = parseListFilters({}, today);
  let filterError = "";
  try { filters = parseListFilters(params, today); }
  catch (error) { filterError = error instanceof Error ? error.message : "Filtros inválidos."; }
  const supabase = await createSupabaseServerClient();
  const months = incomeMonths(today);
  const invoicesPromise = filterError ? Promise.resolve({ data: null, error: { message: filterError } }) : readAllPages<Invoice>((from, to) => {
    let query = supabase.from("invoices")
      .select("id,invoice_number,client_name,client_email,seller_name,status,issue_date,due_date,subtotal,tax_total,total,amount_paid,amount_credited,created_at", { count: "exact" })
      .in("status", ["sent", "partial", "overdue"]).order("issue_date", { ascending: false }).order("id")
      .range(from, to);
    if (filters.start) query = query.gte("issue_date", filters.start);
    if (filters.end) query = query.lte("issue_date", filters.end);
    if (filters.keyword) query = query.or(searchOr(["client_name", "invoice_number", "seller_name"], filters.keyword));
    return query;
  });
  type Payment = { id: string; amount: number; status: string; paid_at: string };
  type Refund = { id: string; amount: number; status: string; refunded_at: string };
  const [invoicesResult, paymentsResult, refundsResult] = await Promise.all([
    invoicesPromise,
    readAllPages<Payment>((from, to) => supabase.from("payments").select("id,amount,status,paid_at", { count: "exact" })
      .gte("paid_at", `${months[0].key}-01`).lte("paid_at", `${today}T23:59:59.999Z`).order("id").range(from, to)),
    readAllPages<Refund>((from, to) => supabase.from("refunds").select("id,amount,status,refunded_at", { count: "exact" })
      .gte("refunded_at", `${months[0].key}-01`).lte("refunded_at", `${today}T23:59:59.999Z`).order("id").range(from, to)),
  ]);
  const pending = (invoicesResult.data || []).filter((invoice) => invoiceBalance(invoice) > 0);
  const pages = Math.max(1, Math.ceil(pending.length / 20));
  if (!invoicesResult.error && filters.page > pages) redirect(pageHref("/bbs-control", params, pages));
  const rows = pending.slice((filters.page - 1) * 20, filters.page * 20);
  const chartError = paymentsResult.error || refundsResult.error;
  const income = monthlyIncome(today,
    (paymentsResult.data || []).map((payment) => ({ ...payment, date: payment.paid_at })),
    (refundsResult.data || []).map((refund) => ({ ...refund, date: refund.refunded_at })));
  const scale = Math.max(1, ...income.map((month) => Math.abs(month.amount)));
  return <BackOfficeShell user={user}>
    <section className="bbs-create" aria-label="Crear documentos y registros">
      <h1>Crear</h1>
      <div className="bbs-create-links">{shortcuts.map(({ label, icon: Icon, ...shortcut }) =>
        "href" in shortcut ? <Link className="bbs-create-link" href={shortcut.href!} key={label}><Icon aria-hidden="true" /><span>{label}</span></Link>
          : <button className="bbs-create-link" type="button" disabled title="Próximamente" key={label}><Icon aria-hidden="true" /><span>{label}</span></button>)}</div>
    </section>
    <section aria-labelledby="pending-heading">
      <h2 id="pending-heading" className="bbs-dashboard-title" style={{ fontSize: 40 }}>Facturas pendientes</h2>
      <ListFilters key={JSON.stringify(params)} {...filters} placeholder="Cliente, número de factura" />
      {invoicesResult.error ? <DataError>{filterError || "No se pudieron cargar las facturas pendientes. Intente nuevamente."}</DataError> :
        <><div className="bbs-table-scroll"><table className="bbs-table">
          <thead><tr>{["Fecha", "Número", "Cliente", "Importe a pagar", "Total", "Estado", "Enviado", "Acción"].map((label) =>
            <th key={label} scope="col" className={label === "Total" || label === "Importe a pagar" ? "bbs-money" : ""}>{label}</th>)}</tr></thead>
          <tbody>{rows.map((invoice) => {
            const overdue = invoice.due_date < today;
            return <tr key={invoice.id}>
              <td>{invoice.issue_date}</td>
              <td><Link href={`/bbs-control/facturas?view=${invoice.id}`}>{invoice.invoice_number}</Link></td>
              <td>{invoice.client_name}</td><td className="bbs-money">{money(invoiceBalance(invoice))}</td>
              <td className="bbs-money">{money(Number(invoice.total))}</td>
              <td><span className={`bbs-badge bbs-badge-${overdue ? "overdue" : invoice.status}`}>{overdue ? "Atrasado" : invoice.status === "partial" ? "Parcial" : "Pendiente"}</span></td>
              <td>—</td><td><Link className="bbs-button" href={`/bbs-control/facturas?view=${invoice.id}`}>Ver factura</Link></td>
            </tr>;
          })}{!rows.length ? <tr><td colSpan={8} className="bbs-empty">No se encontraron facturas pendientes.</td></tr> : null}</tbody>
        </table></div><Pagination path="/bbs-control" params={params} page={filters.page} count={pending.length} /></>}
    </section>
    <div className="bbs-dashboard-bottom">
      <section className="bbs-common-tasks"><h2>Tareas comunes</h2>
        <ul><li><Link href="/bbs-control/cotizaciones/nueva">Crear una cotización</Link></li>
          <li><Link href="/bbs-control/clientes?new=1">Crear un cliente</Link></li>
          <li><Link href="/bbs-control/articulos#nuevo-articulo">Crear un artículo</Link></li>
          <li><Link href="/bbs-control/configuracion">Configurar mi empresa</Link></li>
          <li><Link href="/bbs-control/usuarios">Administrar usuarios</Link></li></ul>
        <ClipboardList aria-hidden="true" />
      </section>
      <section aria-labelledby="income-heading"><h2 id="income-heading">Ingresos por mes</h2>
        {chartError ? <DataError>No se pudieron cargar los ingresos. Intente nuevamente.</DataError> : <>
          <div className="bbs-months" role="list" aria-label="Ingresos netos de los últimos seis meses">
            {income.map((month) => <div className="bbs-month" role="listitem" key={month.key} aria-label={`${month.key}: ${money(month.amount)}`}>
              <div className="bbs-month-bar" aria-hidden="true"><span data-negative={month.amount < 0} style={{ height: `${Math.abs(month.amount) / scale * 100}%` }} /></div>
              <strong>{money(month.amount)}</strong><small>{month.label}</small>
            </div>)}
          </div><p className="bbs-chart-note">Pagos recibidos menos reembolsos procesados, según fecha de movimiento.</p></>}
      </section>
    </div>
  </BackOfficeShell>;
}
