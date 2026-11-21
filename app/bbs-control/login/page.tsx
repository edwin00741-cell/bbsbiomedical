import { redirect } from "next/navigation";
import { hasSupabasePublicEnv } from "../../../lib/bbs-control/env";
import { getBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { safeAuthNext } from "../../../lib/bbs-control/auth-input";
import { canAccessPath, roleHome } from "../../../lib/bbs-control/permissions";
import { AuthCard } from "./auth-card";
import { LoginForm } from "./login-form";
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}, nextPath = typeof params.next === "string" ? params.next : "";
  if (hasSupabasePublicEnv()) {
    const actor = await getBackOfficeUser();
    if (actor) {
      if (actor.must_change_password) redirect("/bbs-control/cambiar-contrasena");
      const destination = safeAuthNext(nextPath, roleHome(actor.role));
      redirect(canAccessPath(actor.role, destination) ? destination : roleHome(actor.role));
    }
  }
  return <AuthCard title="Acceso a BBS Control" description="Ingrese con su usuario o el correo asociado a su cuenta.">
    {typeof params.error === "string" ? <p className="bbs-auth-error" role="alert">{params.error === "config" ? "El acceso está temporalmente fuera de servicio." : params.error}</p> : null}
    {typeof params.success === "string" ? <p className="bbs-auth-success" role="status">{params.success}</p> : null}
    <LoginForm nextPath={safeAuthNext(nextPath, "")} />
  </AuthCard>;
}
