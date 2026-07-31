import { z } from "zod";

const emptyToNull = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .refine((value) => value === null || z.email().safeParse(value).success, {
    message: "Email inválido.",
  });

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido."),
  contact_name: emptyToNull,
  email: optionalEmail,
  phone: emptyToNull,
  address: emptyToNull,
  notes: emptyToNull,
});

export const userSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, "Usuario requerido.")
    .regex(/^[a-z0-9._-]+$/, "Use solo letras, números, punto, guion o guion bajo."),
  full_name: z.string().trim().min(2, "Nombre requerido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["super_admin", "admin"]),
});

export const userUpdateSchema = z.object({
  user_id: z.string().uuid("Usuario inválido."),
  full_name: z.string().trim().min(2, "Nombre requerido."),
  role: z.enum(["super_admin", "admin"]),
  is_active: z.coerce.boolean().default(false),
});

export const userPasswordSchema = z.object({
  user_id: z.string().uuid("Usuario inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const itemSchema = z.object({
  sku: emptyToNull,
  name: z.string().trim().min(2, "Nombre requerido."),
  description: emptyToNull,
  unit_price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  unit: z.string().trim().min(1, "Unidad requerida.").default("unidad"),
  is_active: z.coerce.boolean().default(true),
});

export const quoteStatusSchema = z.enum([
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
]);

export const quoteItemInputSchema = z.object({
  item_id: z.string().uuid().optional().nullable(),
  description: z.string().trim().min(2),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0),
});

export const quoteSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  client_name: z.string().trim().min(2, "Cliente requerido."),
  client_email: optionalEmail,
  seller_name: z.string().trim().min(2, "Vendedor requerido."),
  issue_date: z.string().trim().min(1),
  valid_until: z.string().trim().min(1),
  project_description: emptyToNull,
  notes: emptyToNull,
  items: z.array(quoteItemInputSchema).min(1, "Agregue al menos un producto o servicio."),
});

export const businessSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  business_name: z.string().trim().min(2, "Nombre de empresa requerido."),
  legal_name: emptyToNull,
  email: optionalEmail,
  phone: emptyToNull,
  address: emptyToNull,
  currency: z.string().trim().min(1, "Moneda requerida.").default("USD"),
  quote_prefix: z.string().trim().min(1, "Prefijo requerido.").default("BBS"),
  default_validity_days: z.coerce.number().int().min(1).max(365).default(30),
});


