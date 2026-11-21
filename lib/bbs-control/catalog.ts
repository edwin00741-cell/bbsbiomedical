import { z } from "zod";
export const catalogItemSchema = z.object({
 sku:z.string().trim().max(100).nullable(),name:z.string().trim().min(2,"Nombre requerido.").max(200),description:z.string().trim().max(5000).nullable(),
 unit_price:z.coerce.number().finite().min(0).max(9999999999.99).multipleOf(.01),unit:z.string().trim().min(1).max(40),
 tax_rate_id:z.uuid().nullable(),is_active:z.boolean(),manage_stock:z.boolean(),stock_quantity:z.coerce.number().finite().min(-9999999999.99).max(9999999999.99).multipleOf(.01),
 ideal_quantity:z.coerce.number().finite().min(0).max(9999999999.99).multipleOf(.01),warning_quantity:z.coerce.number().finite().min(0).max(9999999999.99).multipleOf(.01),
 supplier:z.string().trim().max(300).nullable(),private_notes:z.string().trim().max(5000).nullable(),
});
export type CatalogItemInput=z.infer<typeof catalogItemSchema>;
export type CatalogItem=CatalogItemInput&{id:string;updated_at:string};
