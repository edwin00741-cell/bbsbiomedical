import { z } from "zod";

const amount = z.coerce.number().finite().min(0).max(99999999.99).multipleOf(0.01);
const rate = z.coerce.number().finite().min(0).max(100).multipleOf(0.0001);
export const worksheetLineSchema = z.object({
  description: z.string().trim().min(2).max(4000), catalog: z.string().trim().max(100), provider: z.string().trim().max(200),
  quantity: z.coerce.number().finite().positive().max(999999.99).multipleOf(0.01),
  list_price: amount, net_price: amount, expenses_percent: rate, shipping: z.string().trim().max(200),
  import_tax_percent: rate, margin_percent: rate.refine(v => v < 100, "El margen debe ser menor que 100%."),
});
export const worksheetSchema = z.object({
  client_id: z.uuid("Seleccione un cliente."), title: z.string().trim().min(2).max(200),
  seller_name: z.string().trim().min(2).max(200), issue_date: z.iso.date(), notes: z.string().max(10000),
  sales_tax_percent: rate, items: z.array(worksheetLineSchema).min(1).max(300),
});
export type WorksheetInput = z.infer<typeof worksheetSchema>;
export type WorksheetLine = z.infer<typeof worksheetLineSchema>;
export type Worksheet = { id: string; number: string; client_id: string; client_name: string; payload: WorksheetInput; created_at: string; updated_at: string };
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export function calculateWorksheet(input: WorksheetInput) {
  const parsed = worksheetSchema.parse(input);
  const items = parsed.items.map(item => {
    const cents = (v:number) => BigInt(v.toFixed(2).replace(".",""));
    const rate = (v:number) => BigInt(v.toFixed(4).replace(".",""));
    const ratio = (n:bigint,d:bigint) => (n+d/BigInt(2))/d;
    const scale=BigInt(1000000), net=cents(item.net_price), qty=cents(item.quantity);
    const costNumerator=net*(scale+rate(item.expenses_percent)+rate(item.import_tax_percent));
    const freight = item.net_price * item.expenses_percent / 100;
    const importTax = item.net_price * item.import_tax_percent / 100;
    const localCost = item.net_price + freight + importTax;
    const saleCents=ratio(costNumerator,scale-rate(item.margin_percent));
    const totalCents=ratio(qty*saleCents,BigInt(100));
    const unitPrice = Number(saleCents)/100;
    const netTotal = Number(ratio(qty*net,BigInt(100)))/100;
    const cost = Number(ratio(qty*costNumerator,scale*BigInt(100)))/100;
    const total = Number(totalCents)/100;
    const tax = Number(ratio(totalCents*rate(parsed.sales_tax_percent),scale))/100;
    if (![cost,total,tax].every(Number.isFinite) || total > 9999999999.99) throw new Error("El importe supera el máximo permitido.");
    return { ...item, freight, importTax, localCost, unitPrice, netTotal, cost, total, tax, profit:round(total-cost), freightTotal:Number(ratio(qty*net*rate(item.expenses_percent),scale*BigInt(100)))/100 };
  });
  const sum = (key: "cost"|"total"|"tax"|"freightTotal") => round(items.reduce((n,item) => n + item[key],0));
  const subtotal = sum("total"), cost = sum("cost"), tax = sum("tax");
  if(subtotal+tax>9999999999.99)throw new Error("El total supera el máximo permitido.");
  return { items, subtotal, cost, tax, freight:sum("freightTotal"), total:round(subtotal+tax), profit:round(subtotal-cost), margin:subtotal ? (subtotal-cost)/subtotal*100 : 0 };
}
export function worksheetQuoteLines(input: WorksheetInput) {
  return calculateWorksheet(input).items.map(item => ({ item_id:null, sku:item.catalog || null,
    description:item.description + (item.provider ? `\nProveedor: ${item.provider}` : ""), quantity:item.quantity,
    unit_price:item.unitPrice, tax_rate:input.sales_tax_percent, discount_percent:0 }));
}
