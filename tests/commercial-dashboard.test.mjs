import assert from "node:assert/strict";
import test from "node:test";
import { dateRange, pageHref, panamaToday, parseListFilters, searchOr } from "../lib/bbs-control/list-filters.ts";
import { incomeMonths, invoiceBalance, monthlyIncome, readAllPages } from "../lib/bbs-control/dashboard.ts";

test("calendar ranges cross year, leap day and Monday boundaries correctly", () => {
  assert.deepEqual(dateRange("previousMonth", "2026-01-01"), { start: "2025-12-01", end: "2025-12-31" });
  assert.deepEqual(dateRange("month", "2024-02-28"), { start: "2024-02-01", end: "2024-02-29" });
  assert.deepEqual(dateRange("previousWeek", "2026-10-26"), { start: "2026-10-19", end: "2026-10-25" });
  assert.deepEqual(dateRange("week", "2026-10-25"), { start: "2026-10-19", end: "2026-10-25" });
  assert.deepEqual(dateRange("last7", "2026-01-03"), { start: "2025-12-28", end: "2026-01-03" });
  assert.deepEqual(dateRange("last30", "2026-10-26"), { start: "2026-09-27", end: "2026-10-26" });
});

test("date ranges use Panama calendar and reject impossible or reversed dates", () => {
  assert.equal(panamaToday(new Date("2026-10-27T02:00:00Z")), "2026-10-26");
  assert.throws(() => dateRange("custom", "2026-10-26", "2026-02-30", ""));
  assert.throws(() => dateRange("custom", "2026-10-26", "2026-10-27", "2026-10-26"));
  assert.deepEqual(dateRange("custom", "2026-10-26", "", "2026-10-26"), { start: "", end: "2026-10-26" });
});

test("legacy filters resolve ranges, pagination preserves search and omits transient messages", () => {
  const filters = parseListFilters({ period: "Hoy", page: "-3" }, "2026-10-26");
  assert.equal(filters.start, "2026-10-26"); assert.equal(filters.page, 1);
  assert.equal(parseListFilters({ start: "2026-10-01" }, "2026-10-26").period, "custom");
  const url = new URL(pageHref("/bbs-control/cotizaciones", { keyword: "A & B", status: "sent", success: "ok" }, 2), "http://localhost");
  assert.equal(url.searchParams.get("keyword"), "A & B");
  assert.equal(url.searchParams.get("status"), "sent"); assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.has("success"), false);
});

test("search quotes punctuation and literal SQL wildcard characters", () => {
  assert.equal(searchOr(["client_name"], "A,B"), 'client_name.ilike."%A,B%"');
  assert.equal(searchOr(["client_name"], 'A"B'), 'client_name.ilike."%A\\"B%"');
  assert.equal(searchOr(["client_name"], "100%"), 'client_name.ilike."%100\\\\%%"');
});

test("monthly income counts actual receipts once and subtracts only processed refunds", () => {
  const income = monthlyIncome("2026-01-10", [
    { amount: "100.10", date: "2026-01-01", status: "recorded" },
    { amount: "10.20", date: "2026-01-02", status: "refunded" },
    { amount: 999, date: "2026-01-02", status: "void" },
    { amount: 999, date: "2026-01-02", status: "pending" },
    { amount: 999, date: "2026-01-02", status: "failed" },
    { amount: 500, date: "2026-01-11", status: "recorded" },
  ], [
    { amount: "10.20", date: "2026-01-02", status: "processed" },
    { amount: 400, date: "2026-01-03", status: "draft" },
  ]);
  assert.equal(income[5].amount, 100.1);
  assert.equal(income[0].key, "2025-08");
  assert.equal(incomeMonths("2026-01-10").length, 6);
  assert.equal(invoiceBalance({ total: "0.30", amount_paid: "0.10" }), 0.2);
  assert.equal(invoiceBalance({ total: 10, amount_paid: 12 }), 0);
  assert.equal(monthlyIncome("2026-01-10", [{ amount: 10, date: "2026-01-02", status: "completed" }],
    [{ amount: 3, date: "2026-01-03", status: "completed" }])[5].amount, 7);
});

test("all-page aggregation survives API caps smaller than 500 and discards partial results on failure", async () => {
  const records = Array.from({ length: 1001 }, (_, id) => ({ id }));
  const success = await readAllPages(async (from, to) => ({ data: records.slice(from, Math.min(from + 100, to + 1)), count: records.length, error: null }));
  assert.equal(success.data.length, 1001);
  const failure = await readAllPages(async (from) => from ? { data: null, count: null, error: { message: "offline" } } : { data: records.slice(0, 100), count: 1001, error: null });
  assert.equal(failure.data, null); assert.equal(failure.error.message, "offline");
});
