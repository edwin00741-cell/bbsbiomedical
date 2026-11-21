import {z} from "zod";
export const documentPreferencesSchema=z.object({
 page_size:z.enum(["LETTER","A4","LEGAL"]).default("LETTER"),accent_color:z.string().regex(/^#[0-9a-f]{6}$/i,"Color inválido.").default("#415779"),template:z.enum(["classic","minimal"]).default("classic"),
 quote_title:z.string().trim().min(1).max(50).default("COTIZACIÓN"),estimate_title:z.string().trim().min(1).max(50).default("ESTIMADO"),invoice_title:z.string().trim().min(1).max(50).default("FACTURA"),
 default_public_notes:z.string().max(10000).default(""),default_footer_notes:z.string().max(10000).default(""),payment_footer:z.string().max(5000).default(""),
 default_terms_days:z.coerce.number().int().min(0).max(3650).default(30),date_format:z.enum(["iso","day-first"]).default("iso"),
 show_sku:z.boolean().default(true),show_tax:z.boolean().default(true),show_seller:z.boolean().default(true),stripe_rows:z.boolean().default(true),
});
export const effectiveSettingsSchema=z.object({
 id:z.uuid(),version:z.iso.datetime({offset:true}),company_name:z.string().trim().min(2).max(200),legal_name:z.string().trim().max(200),
 email:z.string().trim().max(254).refine(v=>!v||z.email().safeParse(v).success,"Correo inválido."),phone:z.string().trim().max(100),address:z.string().trim().max(2000),
 tax_id:z.string().trim().max(100),website:z.string().trim().max(500).refine(v=>!v||/^https?:\/\//.test(v),"La web debe empezar con https:// o http://."),currency:z.enum(["USD","PAB","EUR","COP","MXN","CRC","GBP"]),
 quote_prefix:z.string().trim().regex(/^[A-Za-z0-9-]{1,12}$/),invoice_prefix:z.string().trim().regex(/^[A-Za-z0-9-]{1,12}$/),default_validity_days:z.coerce.number().int().min(1).max(3650),document_preferences:documentPreferencesSchema,
});
