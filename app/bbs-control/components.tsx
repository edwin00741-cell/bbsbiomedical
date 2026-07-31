import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  FileMinus,
  FilePlus2,
  FileText,
  Gauge,
  HelpCircle,
  Package,
  Receipt,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "./actions";
import type { BackOfficeUser } from "../../lib/bbs-control/types";

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavLink[];
};

const navLinks: NavLink[] = [
  { label: "Panel", href: "/bbs-control", icon: Gauge },
  { label: "Clientes", href: "/bbs-control/clientes", icon: Users },
  {
    label: "Facturas",
    href: "/bbs-control/facturas",
    icon: FileText,
    children: [
      { label: "Todas las facturas", href: "/bbs-control/facturas", icon: FileText },
      { label: "Nueva factura", href: "/bbs-control/facturas/nueva", icon: FilePlus2 },
    ],
  },
  {
    label: "Cotizaciones",
    href: "/bbs-control/cotizaciones",
    icon: Receipt,
    children: [
      { label: "Todas las cotizaciones", href: "/bbs-control/cotizaciones", icon: Receipt },
      { label: "Nueva cotización", href: "/bbs-control/cotizaciones/nueva", icon: FilePlus2 },
    ],
  },
  { label: "Notas de crédito", href: "/bbs-control/notas-credito", icon: FileMinus },
  { label: "Pagos", href: "/bbs-control/pagos", icon: CreditCard },
  { label: "Reembolsos", href: "/bbs-control/reembolsos", icon: RefreshCcw },
  { label: "Artículos", href: "/bbs-control/articulos", icon: Package },
  { label: "Informes", href: "/bbs-control/informes", icon: BarChart3 },
  { label: "Herramientas", href: "/bbs-control/herramientas", icon: Wrench },
  { label: "Configuración", href: "/bbs-control/configuracion", icon: Settings },
  { label: "Ayuda", href: "/bbs-control/ayuda", icon: HelpCircle },
  { label: "Usuarios", href: "/bbs-control/usuarios", icon: ShieldCheck },
];

export function BackOfficeShell({
  user,
  children,
}: {
  user: BackOfficeUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef6fb_100%)] font-[Montserrat]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-cyan-300/10 bg-[linear-gradient(180deg,#020617_0%,#042235_52%,#020617_100%)] px-5 py-6 text-white shadow-[18px_0_50px_rgba(2,6,23,0.18)] lg:block">
        <Link className="block" href="/bbs-control">
          <Image
            alt="Biomedical Business and Service"
            className="h-auto w-48"
            height={98}
            priority
            src="/brand/bbs-primary-horizontal-white.png"
            width={382}
          />
        </Link>
        <nav className="mt-10 grid max-h-[calc(100vh-260px)] gap-1 overflow-y-auto pr-1">
          {navLinks.map((link) =>
            link.children ? (
              <details className="group rounded-[8px]" key={link.href} open>
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[8px] px-4 py-2.5 text-sm font-black text-slate-300 transition hover:bg-cyan-300/10 hover:text-white">
                  <link.icon className="text-cyan-300" size={17} />
                  <span className="flex-1">{link.label}</span>
                  <ChevronDown className="transition group-open:rotate-180" size={15} />
                </summary>
                <div className="ml-6 mt-1 grid gap-1 border-l border-cyan-300/20 pl-3">
                  {link.children.map((child) => (
                    <Link
                      className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-black text-slate-400 transition hover:bg-cyan-300/10 hover:text-white"
                      href={child.href}
                      key={child.href}
                    >
                      <child.icon className="text-cyan-300" size={14} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link
                className="flex items-center gap-3 rounded-[8px] px-4 py-2.5 text-sm font-black text-slate-300 transition hover:bg-cyan-300/10 hover:text-white"
                href={link.href}
                key={link.href}
              >
                <link.icon className="text-cyan-300" size={17} />
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-[8px] border border-cyan-300/20 bg-white/5 p-4">
          <p className="text-sm font-black">{user.full_name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-300">{user.role}</p>
          <form action={signOutAction} className="mt-4">
            <button className="w-full rounded-full border border-white/20 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-slate-950">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-cyan-100 bg-white/90 px-5 py-4 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Image
              alt="BBS"
              className="h-auto w-28"
              height={74}
              src="/brand/bbs-primary-horizontal-color.png"
              width={288}
            />
            <form action={signOutAction}>
              <button className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
                Salir
              </button>
            </form>
          </div>
          <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {navLinks.map((link) =>
              link.children ? (
                <details className="group min-w-fit" key={link.href}>
                  <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full border border-cyan-100 bg-white px-4 text-xs font-black text-slate-700">
                    {link.label}
                    <ChevronDown className="transition group-open:rotate-180" size={13} />
                  </summary>
                  <div className="absolute z-30 mt-2 grid min-w-52 gap-1 rounded-[8px] border border-cyan-100 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                    {link.children.map((child) => (
                      <Link
                        className="rounded-[8px] px-3 py-2 text-xs font-black text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                        href={child.href}
                        key={child.href}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  className="min-w-fit rounded-full border border-cyan-100 bg-white px-4 py-2 text-xs font-black text-slate-700"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </header>
        <main className="w-full min-w-0 px-5 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export async function FlashMessage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const errorMessages: Record<string, string> = {
    config: "Falta configurar Supabase para habilitar el acceso interno.",
  };

  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`mb-5 rounded-[8px] border px-4 py-3 text-sm font-bold ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-cyan-200 bg-cyan-50 text-cyan-800"
      }`}
    >
      {(error && (errorMessages[error] || error)) || success}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function BackOfficeCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[8px] border border-cyan-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const widthClass = props.className?.includes("w-") ? "" : "w-full";

  return (
    <input
      {...props}
      className={`h-12 ${widthClass} rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 ${
        props.className || ""
      }`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 ${
        props.className || ""
      }`}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const widthClass = props.className?.includes("w-") ? "" : "w-full";

  return (
    <select
      {...props}
      className={`h-12 ${widthClass} rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 ${
        props.className || ""
      }`}
    />
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center rounded-full bg-cyan-500 px-6 text-sm font-black text-slate-950 shadow-[0_16px_34px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className="inline-flex h-12 items-center justify-center rounded-full border border-cyan-200 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-cyan-400 hover:text-cyan-700"
      href={href}
    >
      {children}
    </Link>
  );
}


