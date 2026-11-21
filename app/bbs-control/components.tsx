import Image from "next/image";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOutAction } from "./actions";
import { CommercialNavigation } from "./navigation";
import type { BackOfficeUser } from "../../lib/bbs-control/types";
import {can,roleHome} from "../../lib/bbs-control/permissions";
import { canUseTemplates } from "../../lib/bbs-control/service";

export function BackOfficeShell({ user, children }: { user: BackOfficeUser; children: React.ReactNode }) {
  return <div className="bbs-control">
    <a className="bbs-skip-link" href="#bbs-content">Ir al contenido</a>
    <aside className="bbs-sidebar">
      <Link href={roleHome(user.role)} className="bbs-brand" aria-label="BBS Control — Panel">
        <Image src="/brand/bbs-primary-horizontal-white.png" alt="BBS Control" width={191} height={49} priority />
      </Link>
      <CommercialNavigation role={user.role} />
      {canUseTemplates(user)?<Link className="bbs-nav-link" href="/bbs-control/plantillas">Mis plantillas</Link>:null}
      <div className="bbs-sidebar-footer">
        <Link href="/bbs-control/ayuda">Ayuda</Link>
        {can(user.role,"users.manage")?<Link href="/bbs-control/usuarios">Usuarios</Link>:null}
        {can(user.role,"settings.manage")?<Link href="/bbs-control/configuracion" className="bbs-account-company">Biomedical Business and Service</Link>:<span className="bbs-account-company">Biomedical Business and Service</span>}
        <div className="bbs-account-user">
          <span title={user.full_name}>{user.full_name}</span>
          <Link href="/bbs-control/cambiar-contrasena" aria-label="Cambiar mi contraseña"><Settings size={15} /></Link>
          <form action={signOutAction}><button aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button></form>
        </div>
      </div>
    </aside>
    <div className="bbs-workspace">
      <header className="bbs-mobile-header">
        <div className="bbs-mobile-brand">
          <Image src="/brand/bbs-primary-horizontal-color.png" alt="BBS Control" width={144} height={37} />
          <form action={signOutAction}><button className="bbs-button">Salir</button></form>
        </div>
        <details className="bbs-mobile-menu"><summary>Módulos</summary><CommercialNavigation mobile role={user.role} />{canUseTemplates(user)?<Link className="bbs-button" href="/bbs-control/plantillas">Mis plantillas</Link>:null}</details>
      </header>
      <main id="bbs-content" className="bbs-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
export async function FlashMessage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  if (!error && !success) return null;
  return <div role={error ? "alert" : "status"} className={`bbs-message ${error ? "bbs-message-error" : "bbs-message-success"}`}>
    {error === "config" ? "Falta configurar Supabase para habilitar el acceso interno." : error || success}
  </div>;
}
export function DataError({ children = "No se pudieron cargar los registros. Intente nuevamente." }: { children?: React.ReactNode }) {
  return <div className="bbs-message bbs-message-error" role="alert">{children}</div>;
}
export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="bbs-page-header"><div><p className="bbs-eyebrow">{eyebrow}</p><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
    {action ? <div className="bbs-header-actions">{action}</div> : null}</header>;
}
export function BackOfficeCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`bbs-card ${className}`}>{children}</section>;
}
export function TextInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`bbs-input ${className}`} />;
}
export function TextArea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`bbs-textarea ${className}`} />;
}
export function SelectInput({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`bbs-select ${className}`} />;
}
export function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`bbs-button bbs-button-primary ${className}`}>{children}</button>;
}
export function SecondaryLink({ children, href }: { children: React.ReactNode; href: string }) {
  return <Link className="bbs-button" href={href}>{children}</Link>;
}
