import { panamaToday } from "./list-filters";
import { reportCatalog, type ReportColumn, type ReportFilter, type ReportId, type ReportResult, type ReportRow, type ReportSourceRow as Row, type ReportSources } from "./reports-types";
const num = (value: unknown) => Number(value || 0);
const text = (value: unknown) => String(value ?? "");
const cents = (value: unknown) => Math.round(num(value) * 100);
const money = (value: number) => Math.round(value) / 100;
export const reportDay = (value: unknown) => {
  const raw = text(value);
  return raw.includes("T") && Number.isFinite(Date.parse(raw)) ? panamaToday(new Date(raw)) : raw.slice(0, 10);
};
// The ledger persists user-entered accounting dates as UTC midnight; preserve that calendar day.
export const accountingDay = (value: unknown) => text(value).slice(0, 10);
const refundDay = (row: Row) => row.refunded_at ? accountingDay(row.refunded_at) : reportDay(row.created_at);
const between = (date: string, filter: ReportFilter) => (!filter.start || date >= filter.start) && date <= filter.cutoff;
const numeric = (key: string, label: string, format: "money" | "number" = "money"): ReportColumn => ({ key, label, format });
const label = (key: string, name: string): ReportColumn => ({ key, label: name });
const statusNames: Record<string, string> = { draft: "Borrador", sent: "Emitida", paid: "Pagada", partial: "Parcial", overdue: "Atrasada", void: "Anulada", completed: "Completado", approved: "Aprobada", rejected: "Rechazada", expired: "Expirada" };

export function buildReport(id: ReportId, sources: ReportSources, filter: ReportFilter, currency = "USD"): ReportResult {
  const notes: string[] = [], cutoff = filter.cutoff;
  const eventDates = [sources.document_events, sources.finance_events].map((events, index) => {
    const dates = new Map<string, string>();
    for (const row of events) { const key = `${text(row[index ? "entity_id" : "document_id"])}:${text(row.event_type)}`, date = reportDay(row.created_at); if (date > (dates.get(key) || "")) dates.set(key, date); }
    return dates;
  });
  const eventDate = (entity: string, type: string, finance = false) => eventDates[finance ? 1 : 0].get(`${entity}:${type}`) || "";
  const customerMatches = (row: Row) => (!filter.client || text(row.client_id || row.id) === filter.client) && (!filter.seller || text(row.seller_name || row.salesperson_name) === filter.seller);
  const invoiceActive = (row: Row) => {
    if (row.status === "draft" || reportDay(row.issue_date) > cutoff) return false;
    if (row.status !== "void") return true;
    const voided = eventDate(text(row.id), "void");
    return Boolean(voided && voided > cutoff);
  };
  const invoices = sources.invoices.filter((row) => invoiceActive(row) && customerMatches(row));
  const sales = invoices.filter((row) => between(reportDay(row.issue_date), filter));
  const credits = sources.credit_notes.filter((row) => {
    const snapshot = row.document_snapshot as Row | null;
    const active = row.status === "completed" || (row.status === "void" && eventDate(text(row.id), "credit.void", true) > cutoff);
    return active && customerMatches({ ...row, seller_name: snapshot?.seller_name }) && between(reportDay(row.issue_date), filter);
  });
  const applied = new Map<string, number>();
  for (const row of sources.finance_applications) {
    if (reportDay(row.created_at) <= cutoff && (!row.reversed_at || reportDay(row.reversed_at) > cutoff)) applied.set(text(row.invoice_id), (applied.get(text(row.invoice_id)) || 0) + cents(row.amount));
  }
  const balance = (row: Row) => Math.max(0, cents(row.total) - cents(row.amount_paid_legacy ?? row.amount_paid) - (applied.get(text(row.id)) || 0));
  const balanceByClient = new Map<string, number>();
  for (const row of invoices) balanceByClient.set(text(row.client_id), (balanceByClient.get(text(row.client_id)) || 0) + balance(row));
  const clientNames = new Map(sources.clients.map((row) => [text(row.id), text(row.name)]));
  const clientSellers = new Map(sources.clients.map((row) => [text(row.id), text(row.salesperson_name)]));
  const cashMatches = (row: Row) => (!filter.client || text(row.client_id) === filter.client) && (!filter.seller || clientSellers.get(text(row.client_id)) === filter.seller);
  const payments = sources.payments.filter((row) => ["completed", "recorded", "refunded"].includes(text(row.status)) && (!row.voided_at || reportDay(row.voided_at) > cutoff) && between(accountingDay(row.paid_at), filter) && cashMatches(row));
  const refunds = sources.refunds.filter((row) => (["completed", "processed"].includes(text(row.status)) || (row.status === "void" && eventDate(text(row.id), "refund.void", true) > cutoff)) && between(refundDay(row), filter) && cashMatches(row));
  let columns: ReportColumn[] = [], rows: ReportRow[] = [];
  const documents = (quote: boolean) => {
    columns = [label("date", "Fecha"), label("number", "Número"), label("client", "Cliente"), label("seller", "Vendedor"), label("status", "Estado"), numeric("subtotal", "Subtotal"), numeric("discount", "Descuento"), numeric("shipping", "Envío"), numeric("tax", "Impuestos"), numeric("total", "Total")];
    if (!quote) columns.push(numeric("balance", "Saldo al corte"));
    const selected = quote ? sources.quotes.filter((row) => between(reportDay(row.issue_date), filter) && customerMatches(row) && (!filter.status || row.status === filter.status)) : sales;
    rows = selected.map((row) => ({ date: reportDay(row.issue_date), number: text(row[quote ? "quote_number" : "invoice_number"]), client: text(row.client_name), seller: text(row.seller_name), status: quote ? row.status === "draft" ? "Abierta" : statusNames[text(row.status)] || text(row.status) : balance(row) === 0 ? "Pagada" : balance(row) < cents(row.total) ? "Parcial" : reportDay(row.due_date) < cutoff ? "Atrasada" : "Emitida", subtotal: num(row.subtotal), discount: num(row.discount_total), shipping: num(row.shipping_amount), tax: num(row.tax_total), total: num(row.total), ...(!quote ? { balance: money(balance(row)) } : {}) }));
  };
  if (id === "invoices" || id === "quotes") documents(id === "quotes");
  else if (id === "outstanding" || id === "aging") {
    notes.push("Saldo al cierre de la fecha de corte: total menos saldo pagado anterior al libro y aplicaciones vigentes en esa fecha. El período inicial no excluye deudas anteriores.");
    columns = [label("client", "Cliente"), label("number", "Factura"), label("date", "Emisión"), label("due", "Vencimiento")];
    if (id === "aging") columns.push(numeric("current", "No vencido"), numeric("days30", "1–30 días"), numeric("days60", "31–60 días"), numeric("days90", "61–90 días"), numeric("over90", "Más de 90 días"));
    columns.push(numeric("balance", "Saldo"));
    rows = invoices.filter((row) => balance(row) > 0).map((row) => {
      const days = Math.floor((Date.parse(`${cutoff}T12:00:00Z`) - Date.parse(`${reportDay(row.due_date)}T12:00:00Z`)) / 86400000), amount = money(balance(row));
      return { client: text(row.client_name), number: text(row.invoice_number), date: reportDay(row.issue_date), due: reportDay(row.due_date), balance: amount,
        ...(id === "aging" ? { current: days <= 0 ? amount : 0, days30: days > 0 && days <= 30 ? amount : 0, days60: days > 30 && days <= 60 ? amount : 0, days90: days > 60 && days <= 90 ? amount : 0, over90: days > 90 ? amount : 0 } : {}) };
    });
  } else if (id === "clients") {
    columns = [label("name", "Cliente"), label("email", "Correo"), label("phone", "Teléfono"), label("seller", "Vendedor"), label("group", "Grupo"), label("active", "Activo"), numeric("balance", "Saldo al corte")];
    rows = sources.clients.filter((row) => customerMatches(row) && (!row.created_at || reportDay(row.created_at) <= cutoff)).map((row) => ({ name: text(row.name), email: text(row.email), phone: text(row.phone), seller: text(row.salesperson_name), group: text(row.group_name), active: row.is_active ? "Sí" : "No", balance: money(balanceByClient.get(text(row.id)) || 0) }));
  } else if (id === "customer-sales" || id === "salespeople") {
    columns = [label("name", id === "salespeople" ? "Vendedor" : "Cliente"), numeric("count", "Facturas", "number"), numeric("sales", "Ventas netas"), numeric("credits", "Créditos netos"), numeric("tax", "Impuestos netos"), numeric("total", "Total neto")];
    const grouped = new Map<string, ReportRow>();
    for (const [documents, sign] of [[sales, 1], [credits, -1]] as const) for (const row of documents) {
      const snapshot = row.document_snapshot as Row | null;
      const name = id === "salespeople" ? text(row.seller_name || snapshot?.seller_name || "Sin vendedor") : text(row.client_name || clientNames.get(text(row.client_id)) || "Cliente manual");
      const key = id === "salespeople" ? name : text(row.client_id || row.client_name);
      const group = grouped.get(key) || { name, count: 0, sales: 0, credits: 0, tax: 0, total: 0 };
      const base = sign > 0 && !num(row.commercial_version) ? row.subtotal : row.net_subtotal ?? snapshot?.net_subtotal ?? row.subtotal;
      const net = cents(base) + cents(row.shipping_amount ?? snapshot?.shipping_amount);
      if (sign > 0) { group.count = num(group.count) + 1; group.sales = num(group.sales) + net; } else group.credits = num(group.credits) + net;
      group.tax = num(group.tax) + sign * cents(row.tax_total); group.total = num(group.total) + sign * cents(row.total); grouped.set(key, group);
    }
    rows = [...grouped.values()].map((row) => ({ ...row, sales: money(num(row.sales)), credits: money(num(row.credits)), tax: money(num(row.tax)), total: money(num(row.total)) }));
    notes.push("Ventas y créditos se reconocen por su fecha de emisión. Los créditos reducen ventas e impuestos; los pagos y reembolsos se muestran en informes de efectivo.");
  } else if (["item-sales", "customer-items", "sales-tax"].includes(id)) {
    const taxReport = id === "sales-tax", byClient = id === "customer-items", grouped = new Map<string, ReportRow>();
    columns = taxReport ? [label("name", "Impuesto"), numeric("net", "Base neta"), numeric("tax", "Impuesto")] : [...(byClient ? [label("client", "Cliente")] : []), label("sku", "Código"), label("name", "Artículo"), numeric("quantity", "Cantidad neta", "number"), numeric("net", "Ventas netas"), numeric("tax", "Impuestos netos"), numeric("total", "Total neto")];
    const append = (line: Row, document: Row, sign: number, credit: boolean, shipping = false) => {
      const exempt = Boolean(document.tax_exempt || (document.document_snapshot as Row | null)?.tax_exempt);
      const rate = exempt ? 0 : num(shipping ? document.shipping_tax_rate ?? (document.document_snapshot as Row | null)?.shipping_tax_rate : credit ? line.tax_rate : num(document.commercial_version) ? line.commercial_tax_rate : num(line.tax_rate) * 100);
      const name = taxReport ? `${rate}%${exempt ? " (exento)" : ""}` : text(line.description), sku = text(line.sku_snapshot || line.sku), client = text(document.client_name);
      const key = taxReport ? name : `${byClient ? text(document.client_id || client) : ""}:${text(line.item_id || sku || name)}`;
      const net = shipping ? cents(document.shipping_amount ?? (document.document_snapshot as Row | null)?.shipping_amount) : cents(credit ? line.net_total : num(document.commercial_version) ? line.commercial_net_total : line.line_subtotal ?? num(line.quantity) * num(line.unit_price));
      const tax = shipping ? cents(document.shipping_tax_total ?? (document.document_snapshot as Row | null)?.shipping_tax_total) : cents(credit ? line.tax_total : num(document.commercial_version) ? line.commercial_tax_total : num(line.line_total) - num(line.line_subtotal));
      const group = grouped.get(key) || { name, sku, client, quantity: 0, net: 0, tax: 0, total: 0 };
      group.quantity = num(group.quantity) + sign * num(line.quantity); group.net = num(group.net) + sign * net; group.tax = num(group.tax) + sign * tax; group.total = num(group.total) + sign * (net + tax); grouped.set(key, group);
    };
    const invoiceMap = new Map(sales.map((row) => [text(row.id), row])), creditMap = new Map(credits.map((row) => [text(row.id), row]));
    for (const line of sources.invoice_items) { const doc = invoiceMap.get(text(line.invoice_id)); if (doc) append(line, doc, 1, false); }
    for (const line of sources.credit_note_items) { const doc = creditMap.get(text(line.credit_note_id)); if (doc) append(line, doc, -1, true); }
    if (taxReport) for (const [documents, sign] of [[sales, 1], [credits, -1]] as const) for (const doc of documents) if (num(doc.shipping_amount ?? (doc.document_snapshot as Row | null)?.shipping_amount)) append({}, doc, sign, sign < 0, true);
    rows = [...grouped.values()].map((row) => ({ ...row, quantity: Math.round(num(row.quantity) * 100) / 100, net: money(num(row.net)), tax: money(num(row.tax)), total: money(num(row.total)) }));
    notes.push(taxReport ? "Impuesto devengado de facturas emitidas menos notas de crédito emitidas; incluye impuesto del envío. No equivale a una declaración fiscal." : "Cantidades e importes netos de facturas menos notas de crédito, usando los artículos históricos. El envío se excluye de las ventas por artículo.");
  } else if (id === "payments" || id === "monthly-income") {
    const entries = [...payments.map((row) => ({ date: accountingDay(row.paid_at), number: text(row.payment_number || row.reference || "Pago"), client: text(row.client_name || clientNames.get(text(row.client_id))), type: "Pago", method: text(row.payment_method_name), reference: text(row.reference), amount: num(row.amount) })), ...refunds.map((row) => ({ date: refundDay(row), number: text(row.refund_number || "Reembolso"), client: text(row.client_name || clientNames.get(text(row.client_id))), type: "Reembolso", method: text(row.payment_method_name), reference: text(row.reference), amount: -num(row.amount) }))];
    if (id === "payments") { columns = [label("date", "Fecha"), label("number", "Documento"), label("client", "Cliente"), label("type", "Tipo"), label("method", "Método"), label("reference", "Referencia"), numeric("amount", "Importe neto")]; rows = entries; }
    else {
      columns = [label("month", "Mes"), numeric("income", "Pagos recibidos"), numeric("refunds", "Reembolsos"), numeric("net", "Ingreso neto")];
      const grouped = new Map<string, ReportRow>();
      for (const entry of entries) { const key = entry.date.slice(0, 7), group = grouped.get(key) || { month: key, income: 0, refunds: 0, net: 0 }; if (entry.amount >= 0) group.income = num(group.income) + cents(entry.amount); else group.refunds = num(group.refunds) - cents(entry.amount); group.net = num(group.net) + cents(entry.amount); grouped.set(key, group); }
      rows = [...grouped.values()].sort((a, b) => text(a.month).localeCompare(text(b.month))).map((row) => ({ ...row, income: money(num(row.income)), refunds: money(num(row.refunds)), net: money(num(row.net)) }));
    }
    notes.push("Solo efectivo confirmado: pagos completados menos reembolsos completados, por fecha del movimiento. Las aplicaciones y notas de crédito no constituyen ingresos adicionales.");
    if (filter.seller) notes.push("El filtro de vendedor del efectivo utiliza el vendedor actual asignado al cliente.");
  } else if (id === "inventory") {
    columns = [label("sku", "Código"), label("name", "Artículo"), label("supplier", "Proveedor"), numeric("stock", "Existencias al corte", "number"), { ...numeric("ideal", "Cantidad ideal", "number"), total: false }, { ...numeric("warning", "Advertencia", "number"), total: false }, { ...numeric("price", "Precio actual"), total: false }, numeric("value", "Valor de referencia")];
    const afterByItem = new Map<string, number>();
    for (const movement of sources.inventory_movements) if (reportDay(movement.created_at) > cutoff) afterByItem.set(text(movement.item_id), (afterByItem.get(text(movement.item_id)) || 0) + num(movement.quantity));
    rows = sources.items.filter((row) => row.manage_stock && (!row.created_at || reportDay(row.created_at) <= cutoff)).map((row) => {
      const after = afterByItem.get(text(row.id)) || 0;
      const stock = Math.round((num(row.stock_quantity) - after) * 100) / 100;
      return { sku: text(row.sku), name: text(row.name), supplier: text(row.supplier), stock, ideal: num(row.ideal_quantity), warning: num(row.warning_quantity), price: num(row.unit_price), value: money(Math.round(stock * cents(row.unit_price))) };
    });
    notes.push("Existencias reconstruidas mediante movimientos hasta el cierre de la fecha de corte. Precio, proveedor y umbrales corresponden al catálogo actual; el valor es referencial, no un costo contable histórico.");
  }
  if (filter.keyword) { const needle = filter.keyword.toLocaleLowerCase("es"); rows = rows.filter((row) => Object.values(row).some((value) => typeof value === "string" && value.toLocaleLowerCase("es").includes(needle))); }
  const totals: ReportRow = {};
  for (const column of columns) if (column.format && column.total !== false) totals[column.key] = column.format === "money" ? money(rows.reduce((sum, row) => sum + cents(row[column.key]), 0)) : Math.round(rows.reduce((sum, row) => sum + num(row[column.key]), 0) * 100) / 100;
  return { id, title: reportCatalog.find((item) => item.id === id)!.name, generated_at: new Date().toISOString(), period: `${filter.start || "Inicio de registros"} a ${cutoff}`, cutoff, currency, columns, rows, totals, notes };
}

export function reportCsv(report: ReportResult) {
  const escape = (value: string | number) => {
    let result = String(value);
    if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/u.test(result)) result = `'${result}`;
    return `"${result.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + [report.columns.map((column) => escape(column.label)).join(","), ...report.rows.map((row) => report.columns.map((column) => escape(row[column.key] ?? "")).join(",")), report.columns.map((column, index) => escape(report.totals[column.key] ?? (index === 0 ? "TOTAL" : ""))).join(",")].join("\r\n");
}
