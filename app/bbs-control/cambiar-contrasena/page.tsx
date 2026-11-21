import { redirect } from "next/navigation";
import { getBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { roleHome } from "../../../lib/bbs-control/permissions";
import { signOutAction } from "../actions";
import { AuthCard } from "../login/auth-card";
import { OwnPasswordForm } from "./password-form";
export const dynamic = "force-dynamic";
export default async function ChangePasswordPage() {
  const actor = await getBackOfficeUser();
  if (!actor) redirect("/bbs-control/login");
  return <AuthCard title="Cambiar contraseña" description={actor.must_change_password ? "Antes de continuar, establezca una contraseña personal para proteger su cuenta." : "Actualice la contraseña de su propia cuenta."}>
    <OwnPasswordForm forced={Boolean(actor.must_change_password)} home={roleHome(actor.role)} />
    <form action={signOutAction} className="bbs-auth-links"><button className="bbs-auth-signout">Cerrar sesión</button></form>
  </AuthCard>;
}
