import assert from "node:assert/strict";
import test from "node:test";
import { quoteLineTotal } from "../lib/bbs-control/quote-totals.ts";
import { quoteSchema } from "../lib/bbs-control/validation.ts";

test("line rounding agrees with PostgreSQL before adding totals", () => {
  assert.equal(quoteLineTotal(0.5, 0.33), 0.17);
  assert.equal(quoteLineTotal(0.1, 0.05), 0.01);
  assert.equal(quoteLineTotal(2, 10.25), 20.5);
  const cents = Array.from({ length: 10 }, () => Math.round(quoteLineTotal(0.5, 0.33) * 100));
  assert.equal(cents.reduce((sum, value) => sum + value, 0) / 100, 1.7);
});

const quote = {
  client_id: null,
  client_name: "Cliente de prueba",
  client_email: "",
  seller_name: "Vendedor de prueba",
  issue_date: "2026-10-24",
  valid_until: "2026-11-23",
  project_description: "",
  notes: "",
  items: [{ item_id: null, description: "Calibración", quantity: "0.5", unit_price: "0.33" }],
};

test("quotes accept fractional quantities and more than eight lines", () => {
  assert.equal(quoteSchema.safeParse({ ...quote, items: Array(12).fill(quote.items[0]) }).success, true);
});

test("invalid calendar dates and reversed validity are rejected", () => {
  assert.equal(quoteSchema.safeParse({ ...quote, issue_date: "2026-02-30" }).success, false);
  assert.equal(quoteSchema.safeParse({ ...quote, valid_until: "2026-10-01" }).success, false);
});

test("blank lines, negative prices and unsupported precision are rejected", () => {
  for (const patch of [{ description: "" }, { unit_price: -1 }, { quantity: 0 }, { unit_price: "0.333" }]) {
    assert.equal(quoteSchema.safeParse({ ...quote, items: [{ ...quote.items[0], ...patch }] }).success, false);
  }
});
