import { z } from "zod";
export const newPasswordSchema = z.string().min(12, "Use al menos 12 caracteres.").max(128, "Use como máximo 128 caracteres.")
  .regex(/\p{Lu}/u, "Incluya una letra mayúscula.").regex(/\p{Ll}/u, "Incluya una letra minúscula.")
  .regex(/[0-9]/, "Incluya un número.").regex(/[^\p{L}\p{N}\s]/u, "Incluya un símbolo.");
export const passwordChangeSchema = z.object({ password: newPasswordSchema, confirmation: z.string().max(128), current_password: z.string().max(512).optional() })
  .refine((value) => value.password === value.confirmation, { message: "Las contraseñas no coinciden.", path: ["confirmation"] });
export const loginSchema = z.object({ username: z.string().trim().min(1, "Ingrese su usuario o correo.").max(254), password: z.string().min(1, "Ingrese su contraseña.").max(512) });
export function safeAuthNext(value: string | undefined, fallback = "/bbs-control") {
  if (!value || !value.startsWith("/bbs-control") || /[\\\u0000-\u001f]/u.test(value)) return fallback;
  try {
    const url = new URL(value, "https://bbsbiomedical.com");
    if (url.origin !== "https://bbsbiomedical.com" || !(url.pathname === "/bbs-control" || url.pathname.startsWith("/bbs-control/"))) return fallback;
    if (/^\/bbs-control\/(?:login|recuperar|cambiar-contrasena)(?:\/|$)/u.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch { return fallback; }
}
export function bbsAuthBaseUrl() {
  const configured = process.env.BBS_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://bbsbiomedical.com";
  try {
    const url = new URL(configured);
    if (url.protocol === "https:" && !url.username && !url.password) return url.origin;
    if (process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)) return url.origin;
  } catch { /* A malformed deployment setting never becomes a redirect destination. */ }
  return "https://bbsbiomedical.com";
}
