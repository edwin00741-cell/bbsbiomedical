import assert from "node:assert/strict";
import test from "node:test";
import { calculateDocumentTotals, calculateDueDate } from "../lib/bbs-control/document-math.ts";
import { documentInputSchema } from "../lib/bbs-control/document-validation.ts";

const item = (overrides = {}) => ({ item_id: null, description: "Servicio", quantity: 1, unit_price: 100, tax_rate: 7, discount_percent: 0, ...overrides });
const input = (overrides = {}) => ({ items: [item()], discount_mode: "none", discount_value: 0, shipping_amount: 0, shipping_tax_rate: 0, tax_exempt: false, ...overrides });

test("fractional quantities round PostgreSQL half-up before totals", () => {
  const result = calculateDocumentTotals(input({ items: [item({ quantity: 0.5, unit_price: 0.33, tax_rate: 0 }), item({ quantity: 0.1, unit_price: 0.05, tax_rate: 0 })] }));
  assert.equal(result.subtotal, 0.18); assert.equal(result.total, 0.18);
});
test("percent discount reduces taxable base; taxable shipping is separate", () => {
  const result = calculateDocumentTotals(input({ discount_mode: "percent", discount_value: 10, shipping_amount: 20, shipping_tax_rate: 7 }));
  assert.equal(result.subtotal, 100); assert.equal(result.discount_total, 10); assert.equal(result.net_subtotal, 90);
  assert.equal(result.shipping_tax_total, 1.4); assert.equal(result.tax_total, 7.7); assert.equal(result.total, 117.7);
});
test("fixed discount allocates cents deterministically across mixed tax rates", () => {
  const result = calculateDocumentTotals(input({ items: [item({ unit_price: 0.01 }), item({ unit_price: 0.01, tax_rate: 10 }), item({ unit_price: 0.01, tax_rate: 0 })], discount_mode: "fixed", discount_value: 0.01 }));
  assert.deepEqual(result.items.map((row) => row.discount_total), [0.01, 0, 0]);
  assert.equal(result.total, 0.02);
});
test("line discounts ignore global value and exemption suppresses all taxes", () => {
  const result = calculateDocumentTotals(input({ items: [item({ discount_percent: 25 })], discount_mode: "line", discount_value: 99, shipping_amount: 10, shipping_tax_rate: 7, tax_exempt: true }));
  assert.equal(result.discount_total, 25); assert.equal(result.tax_total, 0); assert.equal(result.total, 85);
});
test("oversized fixed discount and subtotal are rejected", () => {
  assert.throws(() => calculateDocumentTotals(input({ discount_mode: "fixed", discount_value: 101 })));
  assert.throws(() => calculateDocumentTotals(input({ items: [item({ quantity: 1000000, unit_price: 1000000 })] })));
});
test("due date respects COD, leap year and month boundary", () => {
  assert.equal(calculateDueDate("2024-02-28", "days", 2), "2024-03-01");
  assert.equal(calculateDueDate("2026-10-26", "cod", 30), "2026-10-26");
});
test("payload validation rejects impossible dates, invalid rates and negative prices", () => {
  const payload = { ...input(), kind: "quote", document_kind: "quote", client_name: "Cliente", seller_name: "Vendedor", issue_date: "2026-10-26", valid_until: "2026-11-26", payment_terms: "days", payment_terms_days: 30 };
  assert.equal(documentInputSchema.safeParse(payload).success, true);
  assert.equal(documentInputSchema.safeParse({ ...payload, kind: "invoice" }).success, false);
  assert.equal(documentInputSchema.safeParse({ ...payload, kind: "invoice", client_id: "00000000-0000-4000-8000-000000000001" }).success, true);
  assert.equal(documentInputSchema.safeParse({ ...payload, issue_date: "2026-02-30" }).success, false);
  assert.equal(documentInputSchema.safeParse({ ...payload, items: [item({ tax_rate: 101 })] }).success, false);
  assert.equal(documentInputSchema.safeParse({ ...payload, items: [item({ unit_price: -1 })] }).success, false);
});
