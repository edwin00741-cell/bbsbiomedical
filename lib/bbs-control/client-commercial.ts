import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).default("").transform((value) => value || null);
const optionalId = z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable());
const checkbox = z.preprocess((value) => value === true || value === "on" || value === "true", z.boolean());

export const commercialClientSchema = z.object({
  name: z.string().trim().min(2, "Nombre del cliente requerido.").max(200),
  email: z.string().trim().max(254).default("").refine((value) => !value || z.email().safeParse(value).success, "Correo electrónico inválido.").transform((value) => value || null),
  phone: optionalText(100), contact_name: optionalText(200),
  address: optionalText(2000), shipping_address: optionalText(2000),
  notes: optionalText(5000), statement_footer: optionalText(5000), public_notes: optionalText(2000),
  group_id: optionalId, salesperson_id: optionalId, payment_method_id: optionalId,
  is_active: checkbox, tax_exempt: checkbox,
  payment_terms: z.enum(["cod", "days"]),
  payment_terms_days: z.coerce.number().int("Ingrese días enteros.").min(0).max(3650),
}).transform((client) => ({ ...client, payment_terms_days: client.payment_terms === "cod" ? 0 : client.payment_terms_days }));

export const catalogSchema = z.object({
  kind: z.enum(["group", "salesperson", "payment_method"]),
  id: optionalId,
  name: z.string().trim().min(2, "Nombre requerido.").max(100),
}).refine((entry) => entry.kind !== "group" || entry.name.toLocaleLowerCase("es") !== "predeterminado", {
  path: ["name"], message: "Predeterminado está reservado para clientes sin grupo.",
});

export type ClientCatalog = { id: string; name: string };

export const statementEmailSchema = z.object({
  client_id: z.uuid(), request_id: z.uuid(),
  recipients: z.string().transform((value) => value.split(",").map((email) => email.trim()).filter(Boolean))
    .pipe(z.array(z.email("Revise los correos de destinatarios.")).min(1, "Ingrese un destinatario.").max(10)),
  subject: z.string().trim().min(1, "Asunto requerido.").max(200),
  message: z.string().trim().max(5000),
});
export type CommercialClient = {
  id: string; name: string; email: string | null; phone: string | null; contact_name: string | null;
  address: string | null; shipping_address: string | null; notes: string | null;
  statement_footer: string | null; public_notes: string | null;
  group_id: string | null; group_name: string; salesperson_id: string | null; salesperson_name: string | null;
  payment_method_id: string | null; payment_method_name: string | null;
  is_active: boolean; tax_exempt: boolean; payment_terms: "cod" | "days"; payment_terms_days: number;
  balance: number; next_due_date: string | null; last_invoice_number: string | null;
  last_invoice_id: string | null; updated_at: string;
};

export function paymentTermsLabel(client: Pick<CommercialClient, "payment_terms" | "payment_terms_days">) {
  return client.payment_terms === "cod" ? "Contra entrega (COD)" : `Pago en ${client.payment_terms_days} días`;
}

export function clientReturnPath(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") return "/bbs-control/clientes";
  let url: URL;
  try { url = new URL(raw, "http://bbs.local"); }
  catch { return "/bbs-control/clientes"; }
  if (url.origin !== "http://bbs.local" || url.pathname !== "/bbs-control/clientes") return "/bbs-control/clientes";
  for (const key of ["new", "edit", "email", "error", "success", "catalog"]) url.searchParams.delete(key);
  return `${url.pathname}${url.search}`;
}
