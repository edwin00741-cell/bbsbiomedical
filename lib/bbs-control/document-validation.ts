import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).nullable().optional().transform((value) => value || null);
const id = z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable());
const money = z.coerce.number().finite().min(0).max(9999999999.99).multipleOf(0.01);
const percent = z.coerce.number().finite().min(0).max(100).multipleOf(0.0001);

export const documentLineSchema = z.object({
  item_id: id, description: z.string().trim().min(2, "Describa cada artículo.").max(5000),
  quantity: z.coerce.number().finite().positive().max(99999999.99).multipleOf(0.01), unit_price: money,
  tax_rate: percent.default(0), discount_percent: percent.default(0), sku: text(100),
});
export const documentInputSchema = z.object({
  kind: z.enum(["quote", "invoice"]), document_kind: z.enum(["quote", "estimate"]).default("quote"),
  client_id: id, client_name: z.string().trim().min(2, "Cliente requerido.").max(200),
  client_email: text(254).refine((value) => !value || z.email().safeParse(value).success, "Correo electrónico inválido."),
  seller_name: z.string().trim().min(2, "Vendedor requerido.").max(200),
  billing_address: text(2000), shipping_address: text(2000),
  payment_terms: z.enum(["cod", "days"]).default("days"), payment_terms_days: z.coerce.number().int().min(0).max(3650).default(30),
  payment_method_id: id, payment_method_name: text(100), tax_exempt: z.boolean().default(false),
  issue_date: z.iso.date("Fecha de emisión inválida."), valid_until: z.iso.date("Fecha de validez inválida."),
  purchase_order: text(200), project_description: text(5000), public_notes: text(10000), private_notes: text(10000), footer_notes: text(10000),
  discount_mode: z.enum(["none", "fixed", "percent", "line"]).default("none"), discount_value: money.default(0),
  shipping_amount: money.default(0), shipping_tax_rate: percent.default(0),
  items: z.array(documentLineSchema).min(1, "Agregue al menos un artículo.").max(300),
}).superRefine((input, context) => {
  if (input.kind === "invoice" && !input.client_id) context.addIssue({code:"custom",path:["client_id"],message:"Seleccione un cliente registrado para la factura."});
  if (input.kind === "quote" && input.valid_until < input.issue_date) context.addIssue({ code: "custom", path: ["valid_until"], message: "La validez no puede ser anterior a emisión." });
  if (input.discount_mode === "percent" && input.discount_value > 100) context.addIssue({ code: "custom", path: ["discount_value"], message: "El descuento porcentual no puede superar 100%." });
  const subtotalCents = input.items.reduce((sum, item) => sum + Math.round(item.quantity * item.unit_price * 100), 0);
  if (subtotalCents > 999999999999) context.addIssue({ code: "custom", message: "El subtotal supera el importe permitido." });
  if (input.discount_mode === "fixed" && Math.round(input.discount_value * 100) > subtotalCents) context.addIssue({ code: "custom", path: ["discount_value"], message: "El descuento no puede superar el subtotal." });
}).transform((input) => ({ ...input, payment_terms_days: input.payment_terms === "cod" ? 0 : input.payment_terms_days }));
