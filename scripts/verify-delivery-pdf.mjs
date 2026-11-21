// Synthetic PDF fixtures only. No database access or email delivery.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { Module } from "node:module";
const filename = path.resolve("lib/bbs-control/__delivery-pdf-verification.cjs");
const source = fs.readFileSync("lib/bbs-control/delivery-pdf.tsx", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
const renderer = new Module(filename); renderer.filename = filename; renderer.paths = Module._nodeModulePaths(path.dirname(filename)); renderer._compile(compiled, filename);
const business = { business_name: "BBS Snapshot de prueba", address: "Dirección del remitente guardada, Panamá", phone: "+507 0000-0000", email: "empresa@example.invalid", currency: "USD" };
const document = {
  number: "QA-ENTREGA-001", issue_date: "2026-10-26", client_name: "Destinatario de prueba", client_email: "cliente@example.invalid", seller_name: "Vendedor de prueba",
  shipping_address: "Dirección de entrega independiente, La Chorrera, Panamá", billing_address: "Dirección de facturación", purchase_order: "QA-ORDEN-123",
  business_snapshot: business, public_notes: "PUBLIC_NOTE_NOT_FOR_DELIVERY", private_notes: "PRIVATE_NOTE_NEVER_EXPORT", footer_notes: "FINANCIAL_NOTE_NOT_FOR_DELIVERY",
  total: 123456.78, amount_paid: 123456.78,
  items: Array.from({ length: 75 }, (_, index) => ({ quantity: 1.5, sku: `SKU-${index + 1}`, description: `Artículo biomédico ${index + 1}. Entrega de equipos y accesorios según orden de compra.`, unit_price: 123456.78, line_total: 123456.78 })),
};
const output = path.resolve("tmp/pdfs/delivery-verification"); fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "delivery-note.pdf"), await renderer.exports.renderDeliveryPdf(document, { ...business, business_name: "SHOULD_NOT_REPLACE_SNAPSHOT" }, "delivery-note"));
fs.writeFileSync(path.join(output, "shipping-label.pdf"), await renderer.exports.renderDeliveryPdf(document, business, "shipping-label"));
console.log(`Rendered 2 synthetic PDF fixtures in ${output}.`);
