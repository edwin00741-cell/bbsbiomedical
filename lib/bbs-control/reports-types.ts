export const reportCatalog = [
  { id: "invoices", name: "Facturas", group: "Cuentas por cobrar" },
  { id: "quotes", name: "Cotizaciones", group: "Cuentas por cobrar" },
  { id: "outstanding", name: "Cuentas pendientes de pago", group: "Cuentas por cobrar" },
  { id: "aging", name: "Informe de antigüedad", group: "Cuentas por cobrar" },
  { id: "clients", name: "Clientes", group: "Clientes" },
  { id: "customer-sales", name: "Ventas al cliente", group: "Clientes" },
  { id: "customer-items", name: "Artículos por cliente", group: "Clientes" },
  { id: "salespeople", name: "Vendedor", group: "Ventas" },
  { id: "item-sales", name: "Ventas de artículos", group: "Ventas" },
  { id: "payments", name: "Pagos", group: "Pagos recibidos" },
  { id: "monthly-income", name: "Ingresos mensuales", group: "Pagos recibidos" },
  { id: "sales-tax", name: "Informe de impuestos sobre las ventas", group: "Impuestos" },
  { id: "inventory", name: "Informe de inventario de artículos", group: "Inventario" },
] as const;
export type ReportId = (typeof reportCatalog)[number]["id"];
export type ReportColumn = { key: string; label: string; format?: "money" | "number"; total?: boolean };
export type ReportRow = Record<string, string | number>;
export type ReportResult = {
  id: ReportId; title: string; generated_at: string; period: string; cutoff: string; currency: string;
  columns: ReportColumn[]; rows: ReportRow[]; totals: ReportRow; notes: string[];
};
export type ReportFilter = { period: string; start: string; end: string; cutoff: string; client: string; seller: string; status: string; keyword: string };
export type ReportSourceRow = Record<string, unknown>;
export type ReportSources = { invoices: ReportSourceRow[]; quotes: ReportSourceRow[]; clients: ReportSourceRow[]; invoice_items: ReportSourceRow[];
  credit_notes: ReportSourceRow[]; credit_note_items: ReportSourceRow[]; payments: ReportSourceRow[]; refunds: ReportSourceRow[];
  finance_applications: ReportSourceRow[]; document_events: ReportSourceRow[]; finance_events: ReportSourceRow[]; items: ReportSourceRow[]; inventory_movements: ReportSourceRow[] };
