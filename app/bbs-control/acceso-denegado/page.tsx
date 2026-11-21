import Link from"next/link";
import{BackOfficeShell,PageHeader}from"../components";
import{requireBackOfficeUser}from"../../../lib/bbs-control/supabase-server";
import{roleHome}from"../../../lib/bbs-control/permissions";
export default async function DeniedPage(){const user=await requireBackOfficeUser();return<BackOfficeShell user={user}><PageHeader title="Acceso no autorizado" eyebrow="Permisos"/><section className="bbs-card"><p>Tu rol no tiene acceso a este módulo. Si necesitas otro permiso, solicítalo a un administrador.</p><Link className="bbs-button mt-5" href={roleHome(user.role)}>Volver a mi panel</Link></section></BackOfficeShell>;}
