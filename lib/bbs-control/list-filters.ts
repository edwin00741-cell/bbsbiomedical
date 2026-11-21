export type SearchParams = Record<string, string | string[] | undefined>;
export const periods = [
  ["all", "Todos"], ["today", "Hoy"], ["last7", "Últimos 7 días"],
  ["last30", "Últimos 30 días"], ["week", "Esta semana"],
  ["previousWeek", "La semana pasada"], ["month", "Este mes"],
  ["previousMonth", "Último mes"], ["year", "Este año"],
  ["previousYear", "Año pasado"], ["custom", "Personalizar"],
] as const;
export function param(params: SearchParams, name: string) {
  return typeof params[name] === "string" ? params[name] : "";
}
export function panamaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function dateRange(period: string, today: string, start = "", end = "") {
  if (!validDate(today)) throw new Error("Fecha actual inválida.");
  const date = new Date(`${today}T12:00:00Z`);
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  const offset = (days: number) => new Date(date.getTime() + days * 86400000);
  const monthDay = (m: number, day: number) => iso(new Date(Date.UTC(year, m, day, 12)));
  const weekday = (date.getUTCDay() + 6) % 7;
  switch (period) {
    case "today": return { start: today, end: today };
    case "last7": return { start: iso(offset(-6)), end: today };
    case "last30": return { start: iso(offset(-29)), end: today };
    case "week": return { start: iso(offset(-weekday)), end: iso(offset(6 - weekday)) };
    case "previousWeek": return { start: iso(offset(-weekday - 7)), end: iso(offset(-weekday - 1)) };
    case "month": return { start: monthDay(month, 1), end: monthDay(month + 1, 0) };
    case "previousMonth": return { start: monthDay(month - 1, 1), end: monthDay(month, 0) };
    case "year": return { start: `${year}-01-01`, end: `${year}-12-31` };
    case "previousYear": return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
    case "custom":
      if ((start && !validDate(start)) || (end && !validDate(end))) throw new Error("Ingrese fechas válidas.");
      if (start && end && start > end) throw new Error("Inicio no puede ser posterior a fin.");
      return { start, end };
    default: return { start: "", end: "" };
  }
}
export function parseListFilters(params: SearchParams, today = panamaToday()) {
  const raw = param(params, "period");
  const match = periods.find(([value, label]) => value === raw || label === raw);
  const period = match?.[0] || (param(params, "start") || param(params, "end") ? "custom" : "all");
  const range = dateRange(period, today, param(params, "start"), param(params, "end"));
  const rawPage = Number(param(params, "page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000000) : 1;
  return { period, ...range, keyword: param(params, "keyword").trim().slice(0, 200), page, today };
}
/** Quote PostgREST values; punctuation cannot introduce another OR clause. */
export function searchOr(columns: string[], keyword: string) {
  const literal = keyword.replace(/[\\%_]/g, "\\$&");
  const value = `"%${literal.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}%"`;
  return columns.map((column) => `${column}.ilike.${value}`).join(",");
}
export function pageHref(path: string, params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && !["page", "success", "error"].includes(key)) query.set(key, value);
  }
  query.set("page", String(page));
  return `${path}?${query}`;
}
