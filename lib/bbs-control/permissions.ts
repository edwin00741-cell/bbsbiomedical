/** Shared UI/server permissions. Database policies remain the authority for records. */
export type BbsRole = "super_admin" | "admin" | "cotizador";
export type Capability =
  | "dashboard.read" | "quotes.read" | "quotes.write" | "quotes.approve"
  | "clients.read" | "clients.write" | "catalog.read" | "catalog.write"
  | "finance.read" | "finance.write" | "users.manage" | "settings.manage"
  | "imports.manage" | "reports.read" | "recurrence.manage" | "delivery.manage"
  | "worksheets.read" | "worksheets.write" | "service.manage";

const quoteCapabilities: readonly Capability[] = ["quotes.read", "quotes.write", "catalog.read", "worksheets.read"];

export function can(role: string | null | undefined, capability: Capability): boolean {
  if (role === "super_admin" || role === "admin") return true;
  if (role === "cotizador") return quoteCapabilities.includes(capability);
  return false;
}

export function roleHome(role: string | null | undefined): string {
  return role === "cotizador" ? "/bbs-control/cotizaciones" : "/bbs-control";
}

/** Administrators can manage peer/lower roles; only super administrators manage SA. */
export function canManageRole(actor: string | null | undefined, target: string | null | undefined): boolean {
  return ["super_admin", "admin", "cotizador"].includes(target || "") && (actor === "super_admin" || actor === "admin" && target !== "super_admin");
}

export function canAccessPath(role: string | null | undefined, rawPath: string): boolean {
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return false;
  let path: string;
  try { path = new URL(decodeURIComponent(new URL(rawPath, "https://bbs.local").pathname), "https://bbs.local").pathname.replace(/\/+$/, "") || "/"; }
  catch { return false; }
  const ui = path === "/bbs-control" || path.startsWith("/bbs-control/");
  const api = path === "/api/bbs-control" || path.startsWith("/api/bbs-control/");
  if (!ui && !api) return false;
  if (!["super_admin", "admin", "cotizador"].includes(role || "")) return false;
  if (["/bbs-control/login", "/bbs-control/cambiar-contrasena", "/bbs-control/ayuda", "/bbs-control/acceso-denegado"].includes(path) || path.startsWith("/bbs-control/recuperar")) return true;
  if (role === "super_admin" || role === "admin") return true;
  if (path === "/bbs-control/hojas-trabajo/nueva") return false;
  if (path === "/bbs-control/hojas-trabajo" || path.startsWith("/bbs-control/hojas-trabajo/")) return can(role,"worksheets.read");
  if (path === "/bbs-control/cotizaciones" || path.startsWith("/bbs-control/cotizaciones/")) return can(role, "quotes.read");
  if (path === "/api/bbs-control/quotes" || path.startsWith("/api/bbs-control/quotes/")) return can(role, "quotes.read");
  if (path === "/api/bbs-control/documents/preview") return can(role, "quotes.write");
  if (path === "/bbs-control/clientes" || path.startsWith("/bbs-control/clientes/")) return can(role, "clients.read");
  // Client statements contain financial information and remain administrative.
  if (path.startsWith("/api/bbs-control/clients/")) return false;
  return false;
}
