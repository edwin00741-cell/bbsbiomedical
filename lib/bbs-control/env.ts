export const internalEmailDomain = "bbsbiomedical.local";

export function usernameToInternalEmail(username: string) {
  const normalized = username.trim().toLowerCase();

  if (normalized.includes("@")) {
    return normalized;
  }

  if (
    normalized === (process.env.INITIAL_SUPERUSER_USERNAME || "edwin00741").toLowerCase() &&
    process.env.INITIAL_SUPERUSER_EMAIL
  ) {
    return process.env.INITIAL_SUPERUSER_EMAIL.trim().toLowerCase();
  }

  return `${normalized}@${internalEmailDomain}`;
}

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function hasSupabasePublicEnv() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function assertSupabasePublicEnv() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase no está configurado.");
  }

  return { url, anonKey };
}

export function assertSupabaseAdminEnv() {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role no está configurado.");
  }

  return { url, serviceRoleKey };
}


