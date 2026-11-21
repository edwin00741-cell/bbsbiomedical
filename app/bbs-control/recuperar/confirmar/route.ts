import { NextResponse } from "next/server";
import { bbsAuthBaseUrl } from "../../../../lib/bbs-control/auth-input";
import { createSupabaseAdminClient, createSupabaseServerClient } from "../../../../lib/bbs-control/supabase-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const token = parameters.get("token_hash"), type = parameters.get("type");
  const finish = (path: string) => {
    const response = NextResponse.redirect(`${bbsAuthBaseUrl()}${path}`);
    response.headers.set("Cache-Control", "no-store"); response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (type !== "recovery" || !token || !/^[a-zA-Z0-9_-]{20,512}$/u.test(token)) return finish("/bbs-control/recuperar?error=enlace");
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | undefined;
  let verified = false;
  try {
    supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: token });
    if (error || !data.user) return finish("/bbs-control/recuperar?error=enlace");
    verified = true;
    const admin = createSupabaseAdminClient();
    const profile = await admin.from("profiles").select("id,is_active").eq("id", data.user.id).eq("is_active", true).maybeSingle();
    if (!profile.data || profile.error) { await supabase.auth.signOut({ scope: "local" }); return finish("/bbs-control/recuperar?error=enlace"); }
    const update = await admin.from("profiles").update({ must_change_password: true }).eq("id", data.user.id).eq("is_active", true).select("id").maybeSingle();
    if (update.error || !update.data) { await supabase.auth.signOut({ scope: "local" }); return finish("/bbs-control/recuperar?error=enlace"); }
    return finish("/bbs-control/cambiar-contrasena");
  } catch {
    if (verified) await supabase?.auth.signOut({ scope: "local" }).catch(() => undefined);
    return finish("/bbs-control/recuperar?error=enlace");
  }
}
