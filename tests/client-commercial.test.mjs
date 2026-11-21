import assert from "node:assert/strict";
import test from "node:test";
import { catalogSchema, clientReturnPath, commercialClientSchema, paymentTermsLabel, statementEmailSchema } from "../lib/bbs-control/client-commercial.ts";

const client = { name: "Cliente de prueba", payment_terms: "days", payment_terms_days: "30", is_active: "on" };
test("commercial profile handles unchecked flags, optional relations and independent notes", () => {
  const value = commercialClientSchema.parse({ ...client, group_id: "", tax_exempt: "false", notes: "Interna", statement_footer: "Pública", shipping_address: "Envío" });
  assert.equal(value.group_id, null); assert.equal(value.is_active, true); assert.equal(value.tax_exempt, false);
  assert.equal(value.notes, "Interna"); assert.equal(value.statement_footer, "Pública"); assert.equal(value.shipping_address, "Envío");
  assert.equal(commercialClientSchema.parse({ ...client, is_active: undefined }).is_active, false);
});
test("COD normalizes days and day terms reject fractional, negative and excessive durations", () => {
  assert.equal(commercialClientSchema.parse({ ...client, payment_terms: "cod", payment_terms_days: 30 }).payment_terms_days, 0);
  for (const days of [-1, 1.5, 3651, "oops"]) assert.equal(commercialClientSchema.safeParse({ ...client, payment_terms_days: days }).success, false);
  assert.equal(paymentTermsLabel({ payment_terms: "cod", payment_terms_days: 0 }), "Contra entrega (COD)");
  assert.equal(paymentTermsLabel({ payment_terms: "days", payment_terms_days: 45 }), "Pago en 45 días");
});
test("invalid email and forged catalog identifiers are rejected", () => {
  assert.equal(commercialClientSchema.safeParse({ ...client, email: "not-an-email" }).success, false);
  assert.equal(commercialClientSchema.safeParse({ ...client, group_id: "not-a-uuid" }).success, false);
  assert.equal(catalogSchema.safeParse({ kind: "group", name: " PREDETERMINADO " }).success, false);
  assert.equal(catalogSchema.safeParse({ kind: "unknown", name: "Cliente" }).success, false);
});
test("return paths stay in customer directory and retain only directory state", () => {
  assert.equal(clientReturnPath("https://evil.example/bbs-control/clientes"), "/bbs-control/clientes");
  assert.equal(clientReturnPath("http://["), "/bbs-control/clientes");
  const url = new URL(clientReturnPath("/bbs-control/clientes?keyword=Hospital&inactive=1&edit=x&new=1&catalog=groups&error=old"), "http://bbs.local");
  assert.equal(url.searchParams.get("keyword"), "Hospital"); assert.equal(url.searchParams.get("inactive"), "1");
  for (const key of ["edit", "new", "catalog", "error"]) assert.equal(url.searchParams.has(key), false);
});

test("statement email validates all recipients and request identity before sending", () => {
  const input = { client_id: "00000000-0000-4000-8000-000000000001", request_id: "00000000-0000-4000-8000-000000000002", recipients: "one@example.invalid, two@example.invalid", subject: "Estado", message: "Mensaje" };
  assert.equal(statementEmailSchema.parse(input).recipients.length, 2);
  assert.equal(statementEmailSchema.safeParse({ ...input, recipients: "valid@example.invalid, invalid" }).success, false);
  assert.equal(statementEmailSchema.safeParse({ ...input, request_id: "bad" }).success, false);
});
