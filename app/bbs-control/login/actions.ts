"use server";
import { redirect } from "next/navigation";
import { loginSchema, safeAuthNext } from "../../../lib/bbs-control/auth-input";
import { canAccessPath, roleHome } from "../../../lib/bbs-control/permissions";
import { createSupabaseAdminClient, createSupabaseServerClient, getBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
export type AuthFormState = { error: string; success?: string };
export async function signInAction(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Ingrese su usuario y contraseña." };
  const identifier = parsed.data.username.toLowerCase();
  let email = identifier;
  try {
    if (!identifier.includes("@")) {
      const admin = createSupabaseAdminClient();
      const { data: profile } = await admin.from("profiles").select("id").eq("username", identifier).maybeSingle();
      if (!profile) return { error: "Usuario, correo o contraseña incorrectos." };
      const result = await admin.auth.admin.getUserById(profile.id);
      if (result.error || !result.data.user?.email) return { error: "Usuario, correo o contraseña incorrectos." };
      email = result.data.user.email;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
    if (error) return { error: "Usuario, correo o contraseña incorrectos." };
    const actor = await getBackOfficeUser();
    if (!actor) { await supabase.auth.signOut({ scope: "local" }); return { error: "Usuario, correo o contraseña incorrectos." }; }
    if (actor.must_change_password) redirect("/bbs-control/cambiar-contrasena");
    const destination = safeAuthNext(String(form.get("next") || ""), roleHome(actor.role));
    redirect(canAccessPath(actor.role, destination) ? destination : roleHome(actor.role));
  } catch (error) {
    // Next redirects are control flow and must reach the framework.
    if (error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    return { error: "No se pudo iniciar sesión. Intente nuevamente en unos minutos." };
  }
}
