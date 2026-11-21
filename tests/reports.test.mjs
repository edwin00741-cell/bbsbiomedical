import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, next) { return next(specifier.startsWith("./") && !/\.[a-z]+$/i.test(specifier) ? `${specifier}.ts` : specifier, context); } });
const { buildReport, reportCsv, reportDay, accountingDay } = await import("../lib/bbs-control/reports-math.ts");
const { reportCatalog } = await import("../lib/bbs-control/reports-types.ts");
const empty = () => Object.fromEntries(["invoices", "quotes", "clients", "invoice_items", "credit_notes", "credit_note_items", "payments", "refunds", "finance_applications", "document_events", "finance_events", "items", "inventory_movements"].map((key) => [key, []]));
const filter = (extra = {}) => ({ period: "all", start: "", end: "2026-10-26", cutoff: "2026-10-26", client: "", seller: "", status: "", keyword: "", ...extra });
const invoice = (extra = {}) => ({ id: "i1", client_id: "c1", client_name: "Cliente", seller_name: "Ana", invoice_number: "F1", status: "sent", commercial_version: 1, issue_date: "2026-10-01", due_date: "2026-10-16", subtotal: 100, net_subtotal: 100, tax_total: 7, shipping_amount: 0, total: 107, amount_paid_legacy: 0, ...extra });
test("all 13 reports have real empty states", () => {
  assert.equal(reportCatalog.length, 13);
  for (const report of reportCatalog) { const output = buildReport(report.id, empty(), filter()); assert.ok(output.columns.length); assert.deepEqual(output.rows, []); }
});
test("aging reconstructs applications/reversals at Panama cutoff and includes earlier debts", () => {
  const sources = empty(); sources.invoices = [invoice({ total: 100, amount_paid_legacy: 10, issue_date: "2026-08-01", due_date: "2026-09-01" })];
  sources.finance_applications = [
    { invoice_id: "i1", amount: 20, created_at: "2026-10-25T20:00:00Z", reversed_at: "2026-10-27T08:00:00Z" },
    { invoice_id: "i1", amount: 30, created_at: "2026-10-27T08:00:00Z", reversed_at: null },
  ];
  assert.equal(buildReport("aging", sources, filter({ start: "2026-10-01" })).rows[0].days60, 70);
  assert.equal(buildReport("aging", sources, filter({ cutoff: "2026-10-28" })).totals.balance, 60);
  assert.equal(reportDay("2026-10-27T02:00:00Z"), "2026-10-26");
});
test("invoice voids are effective from their event date", () => {
  const sources = empty(); sources.invoices = [invoice({ status: "void" })]; sources.document_events = [{ document_id: "i1", event_type: "void", created_at: "2026-10-27T08:00:00Z" }];
  assert.equal(buildReport("outstanding", sources, filter()).rows.length, 1);
  assert.equal(buildReport("outstanding", sources, filter({ cutoff: "2026-10-27" })).rows.length, 0);
});
test("sales count headers once and credits reduce sales and tax", () => {
  const sources = empty(); sources.invoices = [invoice()]; sources.credit_notes = [{ id: "n1", client_id: "c1", client_name: "Cliente", issue_date: "2026-10-10", status: "completed", subtotal: 20, tax_total: 1.4, total: 21.4, document_snapshot: { net_subtotal: 20, seller_name: "Ana" } }];
  sources.invoice_items = [{ invoice_id: "i1", commercial_net_total: 50 }, { invoice_id: "i1", commercial_net_total: 50 }];
  const report = buildReport("customer-sales", sources, filter());
  assert.deepEqual(report.totals, { count: 1, sales: 100, credits: 20, tax: 5.6, total: 85.6 });
});
test("legacy sales use their original subtotal instead of a newly added zero snapshot field", () => {
  const sources = empty(); sources.invoices = [invoice({ commercial_version: 0, net_subtotal: 0, subtotal: 100 })];
  assert.equal(buildReport("customer-sales", sources, filter()).totals.sales, 100);
});
test("tax report includes taxable shipping and subtracts credit lines", () => {
  const sources = empty(); sources.invoices = [invoice({ total: 117.7, shipping_amount: 10, shipping_tax_rate: 7, shipping_tax_total: 0.7, tax_total: 7.7 })];
  sources.invoice_items = [{ invoice_id: "i1", item_id: "a1", description: "Equipo", quantity: 1, commercial_net_total: 100, commercial_tax_total: 7, commercial_tax_rate: 7 }];
  sources.credit_notes = [{ id: "n1", client_id: "c1", client_name: "Cliente", issue_date: "2026-10-10", status: "completed", tax_total: 1.4, total: 21.4, document_snapshot: { seller_name: "Ana" } }];
  sources.credit_note_items = [{ credit_note_id: "n1", item_id: "a1", description: "Equipo", quantity: 0.2, net_total: 20, tax_total: 1.4, tax_rate: 7 }];
  assert.equal(buildReport("sales-tax", sources, filter()).totals.net, 90);
  assert.equal(buildReport("sales-tax", sources, filter()).totals.tax, 6.3);
  assert.equal(buildReport("item-sales", sources, filter()).totals.total, 85.6);
});
test("cash reports exclude pending money and avoid counting allocations as revenue", () => {
  const sources = empty(); sources.payments = [{ amount: 100.1, status: "completed", paid_at: "2026-10-01" }, { amount: 10.2, status: "completed", paid_at: "2026-10-01" }, { amount: 999, status: "pending", paid_at: "2026-10-01" }];
  sources.refunds = [{ amount: 10.2, status: "completed", refunded_at: "2026-10-26T00:00:00Z" }, { amount: 999, status: "draft", refunded_at: "2026-10-01" }]; sources.finance_applications = [{ amount: 9000, created_at: "2026-10-01", invoice_id: "none" }];
  assert.equal(buildReport("monthly-income", sources, filter()).totals.net, 100.1);
  assert.equal(buildReport("payments", sources, filter()).totals.amount, 100.1);
});
test("cash timestamps preserve the user-entered accounting day in filters, rows, monthly buckets and CSV", () => {
  const sources = empty(); sources.payments = [{ amount: 100, status: "completed", paid_at: "2026-10-01T00:00:00Z" }, { amount: 999, status: "completed", paid_at: "2026-10-27T00:00:00Z" }];
  sources.refunds = [{ amount: 10, status: "completed", refunded_at: "2026-10-26T00:00:00Z" }];
  const report = buildReport("payments", sources, filter({ start: "2026-10-01" }));
  assert.equal(accountingDay("2026-10-01T00:00:00Z"), "2026-10-01");
  assert.equal(reportDay("2026-10-01T00:00:00Z"), "2026-09-30");
  assert.deepEqual(report.rows.map((row) => row.date), ["2026-10-01", "2026-10-26"]);
  assert.equal(buildReport("monthly-income", sources, filter({ start: "2026-10-01" })).rows[0].month, "2026-10");
  assert.equal(buildReport("monthly-income", sources, filter({ start: "2026-10-01" })).totals.net, 90);
  assert.ok(reportCsv(report).includes('"2026-10-01"')); assert.ok(!reportCsv(report).includes('"2026-09-30"'));
});
test("historical inventory reverses movements after cutoff", () => {
  const sources = empty(); sources.items = [{ id: "a1", sku: "A", name: "Equipo", manage_stock: true, stock_quantity: 20, unit_price: 5 }]; sources.inventory_movements = [{ item_id: "a1", quantity: 30, created_at: "2026-10-01" }, { item_id: "a1", quantity: -10, created_at: "2026-10-27T08:00:00Z" }];
  const report = buildReport("inventory", sources, filter()); assert.equal(report.rows[0].stock, 30); assert.equal(report.rows[0].value, 150);
});
test("CSV escapes quotes/newlines and neutralizes spreadsheet formulas without altering numeric negatives", () => {
  const csv = reportCsv({ columns: [{ key: "name", label: "Cliente" }, { key: "amount", label: "Importe", format: "money" }], rows: [{ name: '=HYPERLINK("bad")', amount: -2.5 }, { name: "\t@SUM(1)", amount: 0 }], totals: { amount: -2.5 } });
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"')); assert.ok(csv.includes('"\'\t@SUM(1)"')); assert.ok(csv.includes('"-2.5"'));
});
