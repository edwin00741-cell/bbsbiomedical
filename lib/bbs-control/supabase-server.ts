import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertSupabaseAdminEnv, assertSupabasePublicEnv } from "./env";
import type { BackOfficeUser } from "./types";

export async function createSupabaseServerClient() {
  const { url, anonKey } = assertSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = assertSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getBackOfficeUser(): Promise<BackOfficeUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, is_active")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BackOfficeUser;
}

export async function requireBackOfficeUser() {
  const user = await getBackOfficeUser();

  if (!user) {
    redirect("/bbs-control/login");
  }

  return user;
}


