import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";

type HeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary?: string;
  secondary?: string;
  compact?: boolean;
};

type VisualProps = {
  label: string;
  title: string;
  tone?: "light" | "dark" | "clinical";
};

export function Header() {
  const links = [
    { label: "Inicio", href: "/" },
    { label: "Quiénes Somos", href: "/quienes-somos" },
    { label: "Servicios", href: "/#servicios" },
    { label: "Clientes", href: "/#clientes" },
    { label: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/92 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:px-6">
        <Link className="text-2xl font-black tracking-normal text-slate-950" href="/">
          BBS
        </Link>
        <nav className="hidden items-center gap-8 text-base font-semibold text-slate-500 lg:flex">
          {links.map((link) => (
            <Link
              className="transition hover:text-slate-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          className="inline-flex min-w-fit items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 md:px-7"
          href="#contacto"
        >
          Solicitar diagnóstico
        </Link>
      </div>
    </header>
  );
}

export function Hero({
  eyebrow,
  title,
  description,
  primary = "Solicitar diagnóstico técnico",
  secondary = "Ver servicios",
  compact = false,
}: HeroProps) {
  return (
    <section
      className={`relative overflow-hidden px-6 ${
        compact ? "pb-20 pt-16" : "pb-14 pt-16 lg:pb-20"
      }`}
    >
      <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="mx-auto max-w-7xl text-center">
        <p className="mx-auto inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700 ring-1 ring-slate-200">
          {eyebrow}
        </p>
        <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          {description}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link className="btn-primary" href="#contacto">
            {primary}
          </Link>
          <Link className="btn-secondary" href="#servicios">
            {secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function VisualPanel({ label, title, tone = "clinical" }: VisualProps) {
  return (
    <div className={`visual-panel visual-${tone}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,0.7),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.9),rgba(20,184,166,0.45))]" />
      <div className="relative flex h-full min-h-[360px] flex-col justify-between p-6 text-white">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-white/75">
          <span>{label}</span>
          <span>BBS</span>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3">
            {["ISO", "QA", "24/7"].map((item) => (
              <div
                className="rounded-[8px] border border-white/20 bg-white/12 p-4 backdrop-blur"
                key={item}
              >
                <p className="text-2xl font-black">{item}</p>
                <p className="mt-1 text-xs font-bold text-white/70">clinical ops</p>
              </div>
            ))}
          </div>
          <h2 className="mt-6 max-w-lg text-3xl font-black leading-tight">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-black uppercase tracking-[0.12em] text-cyan-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function IconCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
}) {
  const body = (
    <article className="h-full rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-cyan-50 text-cyan-700">
        <Icon size={24} strokeWidth={2.2} />
      </div>
      <h3 className="mt-7 text-2xl font-black text-slate-950">{title}</h3>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
      {href ? (
        <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
          Saber más <ArrowRight size={16} />
        </span>
      ) : null}
    </article>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div className="flex items-center gap-3 text-base font-bold text-slate-800" key={item}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-800">
            <Check size={15} strokeWidth={3} />
          </span>
          {item}
        </div>
      ))}
    </div>
  );
}

export function CTA({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="px-6 py-20" id="contacto">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[8px] bg-slate-950 p-8 text-white md:grid-cols-[1fr_auto] md:items-end lg:p-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            Contacto
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="btn-light" href="mailto:info@bbs-solutions.com">
            <Phone size={18} /> Solicitar cotización
          </Link>
          <Link className="btn-outline-dark" href="https://wa.me/507800246633">
            <MessageCircle size={18} /> WhatsApp
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div>
          <p className="text-4xl font-black text-slate-950">BBS</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Biomedical Business and Services. Rigor, precisión y vanguardia
            tecnológica al servicio de la salud.
          </p>
        </div>
        <FooterColumn title="Servicios" items={["Servicio Técnico", "Metrología", "Protección Radiológica", "Gestión Regulatoria"]} />
        <FooterColumn title="Empresa" items={["Sobre Nosotros", "Portal Médico", "Soporte Técnico", "Privacidad"]} />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-950">
            Contacto
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Av. Salud 123, Distrito Tecnológico. Ciudad de Panamá, Panamá.
          </p>
          <p className="mt-4 text-sm font-bold text-slate-950">
            +507 800-BIOMED
            <br />
            info@bbs-solutions.com
          </p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        © 2024 BBS Biomedical Solutions. Todos los derechos reservados.
      </p>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-950">
        {title}
      </p>
      <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
        {items.map((item) => (
          <Link className="hover:text-slate-950" href="#" key={item}>
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
