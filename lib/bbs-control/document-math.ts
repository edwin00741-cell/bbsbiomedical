import type { DocumentInput, DocumentTotals } from "./document-types";

const B = BigInt;
const cents = (value: number) => B(value.toFixed(2).replace(".", ""));
const rateUnits = (value: number) => B(value.toFixed(4).replace(".", ""));
const roundRatio = (value: bigint, divisor: bigint) => (value + divisor / B(2)) / divisor;
const asMoney = (value: bigint) => Number(value) / 100;

export function calculateDueDate(issueDate: string, terms: "cod" | "days", days: number) {
  const date = new Date(`${issueDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (terms === "cod" ? 0 : days));
  return date.toISOString().slice(0, 10);
}

export function calculateDocumentTotals(input: Pick<DocumentInput, "items" | "discount_mode" | "discount_value" | "shipping_amount" | "shipping_tax_rate" | "tax_exempt">): DocumentTotals {
  const gross = input.items.map((item) => roundRatio(cents(item.quantity) * cents(item.unit_price), B(100)));
  const subtotal = gross.reduce((sum, value) => sum + value, B(0));
  if (subtotal > B("999999999999")) throw new Error("El subtotal supera el importe permitido.");
  let discounts = gross.map(() => B(0));
  if (input.discount_mode === "line") {
    discounts = gross.map((value, index) => roundRatio(value * rateUnits(input.items[index].discount_percent), B(1000000)));
  } else if (input.discount_mode === "fixed" || input.discount_mode === "percent") {
    const totalDiscount = input.discount_mode === "fixed" ? cents(input.discount_value) : roundRatio(subtotal * rateUnits(input.discount_value), B(1000000));
    if (totalDiscount > subtotal) throw new Error("El descuento no puede superar el subtotal.");
    if (subtotal > B(0)) {
      discounts = gross.map((value) => value * totalDiscount / subtotal);
      const order = gross.map((value, index) => ({ index, remainder: value * totalDiscount % subtotal }))
        .sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
      const residual = Number(totalDiscount - discounts.reduce((sum, value) => sum + value, B(0)));
      for (let index = 0; index < residual; index++) discounts[order[index].index] += B(1);
    }
  }
  const items = input.items.map((item, index) => {
    const net = gross[index] - discounts[index];
    const tax = input.tax_exempt ? B(0) : roundRatio(net * rateUnits(item.tax_rate), B(1000000));
    return { ...item, gross_total: asMoney(gross[index]), discount_total: asMoney(discounts[index]),
      net_total: asMoney(net), tax_total: asMoney(tax), line_total: asMoney(net + tax) };
  });
  const discountTotal = discounts.reduce((sum, value) => sum + value, B(0));
  const shipping = cents(input.shipping_amount);
  const shippingTax = input.tax_exempt ? B(0) : roundRatio(shipping * rateUnits(input.shipping_tax_rate), B(1000000));
  const taxTotal = items.reduce((sum, item) => sum + cents(item.tax_total), shippingTax);
  const total = subtotal - discountTotal + shipping + taxTotal;
  if (total > B("999999999999")) throw new Error("El total supera el importe permitido.");
  return { subtotal: asMoney(subtotal), discount_total: asMoney(discountTotal), net_subtotal: asMoney(subtotal - discountTotal),
    shipping_amount: asMoney(shipping), shipping_tax_total: asMoney(shippingTax), tax_total: asMoney(taxTotal), total: asMoney(total), items };
}
