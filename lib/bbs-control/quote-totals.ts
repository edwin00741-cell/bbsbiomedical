export function quoteLineTotal(quantity: number, unitPrice: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  const quantityHundredths = BigInt(Math.round(Math.max(0, quantity) * 100));
  const priceCents = BigInt(Math.round(Math.max(0, unitPrice) * 100));
  // Match PostgreSQL's per-line numeric rounding before summing the document.
  const cents = (quantityHundredths * priceCents + BigInt(50)) / BigInt(100);
  return Number(cents) / 100;
}
