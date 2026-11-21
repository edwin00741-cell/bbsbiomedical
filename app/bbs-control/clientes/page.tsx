import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../components";
import { Pagination } from "../pagination";
import { RecordDialog } from "../record-dialog";
import { RowActions } from "../row-actions";
import { ClientForm } from "./client-form";
import { CatalogManager } from "./catalog-manager";
import { StatementEmailForm } from "./statement-email-form";
import { ClientDeleteButton, ClientStatusButton } from "./client-status-button";
import { readAllPages } from "../../../lib/bbs-control/dashboard";
import { clientReturnPath, paymentTermsLabel, type ClientCatalog, type CommercialClient } from "../../../lib/bbs-control/client-commercial";
import { money } from "../../../lib/bbs-control/format";
import { pageHref, param, parseListFilters, searchOr, type SearchParams } from "../../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import {can} from "../../../lib/bbs-control/permissions";

export const dynamic = "force-dynamic";
export default async function ClientsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const financial=can(user.role,"finance.read");
  const params = searchParams ? await searchParams : {};
  const keyword = param(params, "keyword").trim().slice(0, 200);
  const inactive = param(params, "inactive") === "1";
  const page = parseListFilters({ page: param(params, "page") }).page;
  const baseParams: SearchParams = { keyword, inactive: inactive ? "1" : "", page: String(page), selected: param(params, "selected") };
  function href(changes: Record<string, string>) {
    const url = new URL(pageHref("/bbs-control/clientes", baseParams, page), "http://bbs.local");
    for (const [key, value] of Object.entries(changes)) { if (value) url.searchParams.set(key, value); else url.searchParams.delete(key); }
    return url.pathname + url.search;
  }
  const returnTo = clientReturnPath(href({}));
  const editingId = param(params, "edit");
  const emailId = param(params, "email");
  const selectedId = editingId || emailId || param(params, "selected");
  const validSelection = z.uuid().safeParse(selectedId).success;
  const supabase = await createSupabaseServerClient();
  const makeQuery = (head = false) => {
    let query = supabase.from("bbs_client_directory").select("*", { count: "exact", head }).order("name").order("id");
    if (!inactive) query = query.eq("is_active", true);
    if (keyword) query = query.or(searchOr(["name", "email", "salesperson_name"], keyword));
    return head ? query : query.range((page - 1) * 20, page * 20 - 1);
  };
  const [initialResult, groupsResult, sellersResult, methodsResult, selectionResult] = await Promise.all([
    makeQuery(),
    readAllPages<ClientCatalog>((from, to) => supabase.from("client_groups").select("id,name", { count: "exact" }).order("name").order("id").range(from, to)),
    readAllPages<ClientCatalog>((from, to) => supabase.from("salespeople").select("id,name", { count: "exact" }).order("name").order("id").range(from, to)),
    readAllPages<ClientCatalog>((from, to) => supabase.from("payment_methods").select("id,name", { count: "exact" }).eq("is_active", true).order("name").order("id").range(from, to)),
    validSelection ? supabase.from("bbs_client_directory").select("*").eq("id", selectedId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const result = initialResult.error?.code === "PGRST103" ? await makeQuery(true) : initialResult;
  const pages = Math.max(1, Math.ceil((result.count || 0) / 20));
  if (!result.error && page > pages) redirect(pageHref("/bbs-control/clientes", baseParams, pages));
  const rows = (result.data || []) as CommercialClient[];
  const selected = selectionResult.data as CommercialClient | null;
  const catalogError = groupsResult.error || sellersResult.error || methodsResult.error;
  const groups = groupsResult.data || [], sellers = sellersResult.data || [], methods = methodsResult.data || [];
  // Keep an existing inactive payment method visible when editing this customer.
  if (selected?.payment_method_id && !methods.some((entry) => entry.id === selected.payment_method_id)) {
    methods.push({ id: selected.payment_method_id, name: selected.payment_method_name || "Método anterior" });
  }
  const catalog = param(params, "catalog");
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Clientes" title="Clientes" action={<>
      <Link className="bbs-button bbs-button-primary" href={href({ new: "1" })}>Nuevo cliente</Link>
      <Link className="bbs-button bbs-button-primary" href={href({ catalog: "groups" })}>Administrar grupos</Link>
    </>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <form className="bbs-filters" method="get">
      <label>Palabra clave:<input className="bbs-input bbs-keyword" name="keyword" maxLength={200} defaultValue={keyword} placeholder="Cliente, correo, vendedor" /></label>
      <button className="bbs-button">Buscar</button>
      <label className="bbs-checkbox"><input type="checkbox" name="inactive" value="1" defaultChecked={inactive} />Mostrar clientes inactivos</label>
    </form>
    {result.error ? <DataError>No se pudieron cargar los clientes. Intente nuevamente.</DataError> : <>
      <div className="bbs-table-scroll"><table className="bbs-table bbs-clients-table"><thead><tr>
        {(financial?["Nombre", "Saldo", "Fecha de vencimiento", "Última factura", "Vendedor", "Grupo", "Correo electrónico", "Acción"]:["Nombre","Vendedor","Grupo","Correo electrónico","Acción"]).map((label) => <th scope="col" key={label} className={label === "Saldo" ? "bbs-money" : ""}>{label}</th>)}
      </tr></thead><tbody>{rows.map((client) => <tr key={client.id} className={client.id === selected?.id ? "bbs-selected-row" : undefined}>
        <td><Link href={href({ selected: client.id })}>{client.name}</Link>{!client.is_active ? <span className="bbs-badge">Inactivo</span> : null}</td>
        {financial?<><td className="bbs-money">{money(Number(client.balance))}</td><td>{client.next_due_date || "—"}</td>
        <td>{client.last_invoice_id ? <Link href={`/bbs-control/facturas?view=${client.last_invoice_id}`}>{client.last_invoice_number}</Link> : "—"}</td></>:null}
        <td>{client.salesperson_name || "—"}</td><td>{client.group_name}</td><td>{client.email || "—"}</td>
        <td><RowActions label={`Acciones de cliente ${client.name}`}>
          <Link href={href({ edit: client.id, selected: client.id })}>Editar</Link>
          <Link href={href({ selected: client.id })}>Ver datos</Link>
          {financial?<><a href={`/api/bbs-control/clients/${client.id}/statement`}>Descargar estado de cuenta</a>
          <a href={`/api/bbs-control/clients/${client.id}/statement?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a>
          <Link href={href({ email: client.id, selected: client.id })}>Enviar estado de cuenta por correo</Link></>:null}
          <ClientStatusButton key={client.updated_at} client={client} />
          <ClientDeleteButton key={`delete-${client.updated_at}`} client={client} returnTo={returnTo} />
        </RowActions></td>
      </tr>)}{!rows.length ? <tr><td colSpan={8} className="bbs-empty">No se encontraron clientes.</td></tr> : null}</tbody></table></div>
      <Pagination path="/bbs-control/clientes" params={baseParams} page={page} count={result.count || 0} />
    </>}
    {selectionResult.error ? <DataError>No se pudieron cargar los datos del cliente.</DataError> : selected ? <section className="bbs-client-preview" aria-label="Vista previa del cliente">
      <dl>
        <div><dt>Nombre:</dt><dd>{selected.name}</dd></div><div><dt>Grupo:</dt><dd>{selected.group_name}</dd></div>
        <div><dt>Correo electrónico:</dt><dd>{selected.email || "—"}</dd></div><div><dt>Teléfono:</dt><dd>{selected.phone || "—"}</dd></div>
        <div><dt>Persona de contacto:</dt><dd>{selected.contact_name || "—"}</dd></div><div><dt>Vendedor:</dt><dd>{selected.salesperson_name || "—"}</dd></div>
        <div><dt>Dirección de facturación:</dt><dd>{selected.address || "—"}</dd></div><div><dt>Dirección de envío:</dt><dd>{selected.shipping_address || "—"}</dd></div>
        <div><dt>Notas privadas:</dt><dd>{selected.notes || "—"}</dd></div><div><dt>Comentario del cliente:</dt><dd>{selected.statement_footer || "—"}</dd></div>
        <div><dt>Información impresa adicional:</dt><dd>{selected.public_notes || "—"}</dd></div>
        <div><dt>Condiciones de pago:</dt><dd>{paymentTermsLabel(selected)}</dd></div><div><dt>Forma de pago:</dt><dd>{selected.payment_method_name || "—"}</dd></div>
        <div><dt>Exento de impuestos:</dt><dd>{selected.tax_exempt ? "Sí" : "No"}</dd></div>
        <div><dt>Estado:</dt><dd>{selected.is_active ? "Activo" : "Inactivo"}</dd></div>
      </dl>
    </section> : <p className="bbs-preview-empty">{selectedId ? "Cliente no encontrado." : "No hay vista previa disponible. Seleccione un cliente."}</p>}
    {param(params, "new") === "1" || editingId ? <RecordDialog key={editingId || "new"} title={editingId ? "Editar cliente" : "Nuevo cliente"} closeHref={returnTo}>
      {catalogError ? <DataError>No se pudieron cargar los grupos, vendedores o métodos. Cierre y vuelva a abrir el formulario.</DataError>
        : editingId && !selected ? <DataError>Cliente no encontrado.</DataError>
        : <ClientForm key={selected && editingId ? selected.id : "new"} client={editingId && selected ? selected : undefined} groups={groups} salespeople={sellers} methods={methods} returnTo={returnTo} />}
    </RecordDialog> : null}
    {["groups","salespeople","methods"].includes(catalog) ? <RecordDialog title={catalog === "groups" ? "Grupos" : catalog === "methods" ? "Métodos de pago" : "Vendedores"} closeHref={returnTo}>
      {catalogError ? <DataError>No se pudieron cargar los registros.</DataError> : <CatalogManager kind={catalog === "groups" ? "group" : catalog === "methods" ? "payment_method" : "salesperson"} records={catalog === "groups" ? groups : catalog === "methods" ? methods : sellers} />}
    </RecordDialog> : null}
    {emailId && financial ? <RecordDialog key={`email-${emailId}`} title="Enviar estado de cuenta" closeHref={returnTo}>
      {selectionResult.error || !selected ? <DataError>No se pudo cargar el cliente.</DataError> : <StatementEmailForm mailConfigured={Boolean(process.env.RESEND_API_KEY)} client={selected} returnTo={returnTo} />}
    </RecordDialog> : null}
  </BackOfficeShell>;
}
