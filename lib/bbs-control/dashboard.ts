export type MoneyMovement = { amount: number | string; date: string; status: string };
export type MonthIncome = { key: string; label: string; amount: number };

export function invoiceBalance(invoice: { total: number | string; amount_paid: number | string; amount_credited?: number | string }) {
  return Math.max(0, Math.round(Number(invoice.total) * 100) - Math.round(Number(invoice.amount_paid) * 100) - Math.round(Number(invoice.amount_credited || 0) * 100)) / 100;
}

export function incomeMonths(today: string): MonthIncome[] {
  const date = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 5 + index, 1, 12));
    return { key: month.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("es-PA", { month: "short", timeZone: "UTC" }).format(month), amount: 0 };
  });
}

export function monthlyIncome(today: string, payments: MoneyMovement[], refunds: MoneyMovement[]) {
  const months = incomeMonths(today);
  const cents = new Map(months.map((month) => [month.key, 0]));
  for (const payment of payments) {
    const key = payment.date.slice(0, 7);
    // The linked project uses completed; the original migration uses recorded.
    if (["completed", "recorded", "refunded"].includes(payment.status) && payment.date.slice(0,10) <= today && cents.has(key)) {
      cents.set(key, cents.get(key)! + Math.round(Number(payment.amount) * 100));
    }
  }
  for (const refund of refunds) {
    const key = refund.date.slice(0, 7);
    if (["completed", "processed"].includes(refund.status) && refund.date.slice(0,10) <= today && cents.has(key)) {
      cents.set(key, cents.get(key)! - Math.round(Number(refund.amount) * 100));
    }
  }
  return months.map((month) => ({ ...month, amount: cents.get(month.key)! / 100 }));
}

/** Fetch every page so totals never silently stop at the Data API row limit. */
export async function readAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null; count: number | null; error: { message: string } | null;
}>) {
  const rows: T[] = [];
  while (true) {
    const result = await fetchPage(rows.length, rows.length + 499);
    if (result.error) return { data: null, error: result.error };
    if (!result.data?.length) {
      if (result.count !== null && rows.length < result.count) return { data: null, error: { message: "Resultados incompletos." } };
      break;
    }
    rows.push(...result.data);
    if (result.count !== null && rows.length >= result.count) break;
    if (result.count === null && result.data.length < 500) break;
  }
  return { data: rows, error: null };
}
