import { AuthCard } from "../login/auth-card";
import { RecoveryForm } from "./recovery-form";
export const dynamic = "force-dynamic";
export default async function RecoveryPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  return <AuthCard title="Recuperar acceso" description="Registre una solicitud para que un administrador verifique su identidad y le facilite un enlace de recuperación.">
    {typeof params.error === "string" ? <p className="bbs-auth-error" role="alert">No se pudo validar el enlace. Puede haber vencido o ya haberse utilizado. Solicite uno nuevo al administrador.</p> : null}
    <RecoveryForm />
  </AuthCard>;
}
