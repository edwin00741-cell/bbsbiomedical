import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  Dna,
  ExternalLink,
  HeartPulse,
  MapPin,
  Microscope,
  Phone,
  ShieldCheck,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { ContactForm } from "./contact-form";
import { GlobalReachMap } from "./global-reach-map";
import { HeaderNav } from "./header-nav";
import { MaintenanceReveal } from "./maintenance-reveal";
import {
  MotionCard,
  Reveal,
  RevealSection,
  Stagger,
  StaggerItem,
} from "./motion-primitives";

type Locale = "es" | "en";

const whatsappHref = "https://wa.me/50762023206";
const phoneHref = "tel:+50762023206";
const secondaryPhoneHref = "tel:+50766312007";
const contactEmail = "brodriguez@rysbioservices.com";
const mapsHref =
  "https://www.google.com/maps/search/?api=1&query=Panama+Oeste+La+Chorrera+Ave+Libertadores+Calle+los+Libertadores+Planta+de+hielo";
const mapsEmbedHref =
  "https://www.google.com/maps?q=Panam%C3%A1%20Oeste%20La%20Chorrera%20Ave.%20Libertadores%20Calle%20los%20Libertadores%20Planta%20de%20hielo&output=embed";
const businessAddress =
  "Panamá, Panamá Oeste, La Chorrera, Ave. Libertadores, Calle los Libertadores, al lado de la Planta de hielo, Edificio 1, Local 1.";
const businessHours =
  "Lunes a viernes, 8:00 a.m. a 5:00 p.m. Sábados, 9:00 a.m. a 12:00 md.";
const repairSteps = {
  es: [
    {
      title: "Diagnóstico técnico",
      body: "Revisamos el equipo, identificamos fallas críticas y documentamos hallazgos antes de intervenir.",
      icon: Microscope,
    },
    {
      title: "Reparación controlada",
      body: "Ejecutamos ajustes, reemplazos y pruebas funcionales con trazabilidad técnica de cada acción.",
      icon: Wrench,
    },
    {
      title: "Validación y entrega",
      body: "Confirmamos desempeño, seguridad y estabilidad operativa antes de liberar el equipo.",
      icon: ShieldCheck,
    },
  ],
  en: [
    {
      title: "Technical diagnosis",
      body: "We inspect the equipment, identify critical faults and document findings before intervention.",
      icon: Microscope,
    },
    {
      title: "Controlled repair",
      body: "We perform adjustments, replacements and functional tests with technical traceability.",
      icon: Wrench,
    },
    {
      title: "Validation and delivery",
      body: "We confirm performance, safety and operational stability before releasing the equipment.",
      icon: ShieldCheck,
    },
  ],
};

type HeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary?: string;
  secondary?: string;
  primaryHref?: string;
  secondaryHref?: string;
  compact?: boolean;
};

type VisualProps = {
  label: string;
  title: string;
  tone?: "light" | "dark" | "clinical";
};

const heroFeatures = {
  es: [
    { label: "Equipos biomédicos", icon: Microscope },
    { label: "Servicio técnico especializado", icon: Wrench },
    { label: "Calidad y confianza", icon: ShieldCheck },
    { label: "Soluciones a tu medida", icon: BarChart3 },
  ],
  en: [
    { label: "Biomedical equipment", icon: Microscope },
    { label: "Specialized technical service", icon: Wrench },
    { label: "Quality and trust", icon: ShieldCheck },
    { label: "Tailored solutions", icon: BarChart3 },
  ],
};

export function Header({ locale = "es" }: { locale?: Locale }) {
  return <HeaderNav brandLogo={<BrandLogo />} locale={locale} />;
}

export function Hero({
  eyebrow,
  title,
  description,
  primary = "Solicitar diagnóstico técnico",
  secondary = "Ver servicios",
  primaryHref = "#contacto",
  secondaryHref = "/#servicios",
  compact = false,
}: HeroProps) {
  return (
    <RevealSection
      className={`relative overflow-hidden px-6 ${
        compact ? "pb-20 pt-16" : "pb-14 pt-16 lg:pb-20"
      }`}
    >
      <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="mx-auto max-w-7xl text-center">
        <Reveal className="mx-auto inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700 ring-1 ring-slate-200" y={10}>
          {eyebrow}
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            {description}
          </p>
        </Reveal>
        <Reveal className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" delay={0.2}>
          <Link className="btn-primary" href={primaryHref}>
            {primary}
          </Link>
          <Link className="btn-secondary" href={secondaryHref}>
            {secondary}
          </Link>
        </Reveal>
      </div>
    </RevealSection>
  );
}

export function HomeHero({ locale = "es" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  return (
    <RevealSection className="bg-[#f6f8fb]">
      <div
        className="hero-bg relative isolate min-h-[680px] overflow-hidden"
        style={{ backgroundImage: 'url("/images/bbs-hero-microscope.png")' }}
      >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.74)_36%,rgba(255,255,255,0.18)_63%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(246,248,251,0.94)_100%)]" />
      <Stagger className="pointer-events-none absolute right-6 top-16 hidden gap-5 text-white/86 lg:grid" delay={0.36}>
        {[HeartPulse, Stethoscope, Dna].map((Icon, index) => (
          <StaggerItem
            className="flex h-20 w-20 items-center justify-center border border-white/50 bg-cyan-400/10 backdrop-blur-sm [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]"
            key={index}
          >
            <Icon size={34} strokeWidth={2.4} />
          </StaggerItem>
        ))}
      </Stagger>

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center px-6 py-16 sm:px-10 lg:px-14">
        <div className="max-w-3xl">
          <Reveal className="mb-14" delay={0.05}>
            <BrandLogo size="hero" />
          </Reveal>
          <Reveal delay={0.14}>
            <h1 className="max-w-3xl text-4xl font-black uppercase leading-tight text-[#061b5f] sm:text-5xl lg:text-[3.35rem]">
              {isEnglish ? "Technology that connects." : "Tecnología que conecta."}
              <span className="block text-cyan-600">
                {isEnglish ? "Service that supports." : "Servicio que respalda."}
              </span>
            </h1>
          </Reveal>
          <Stagger className="mt-12 grid max-w-4xl grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4" delay={0.22}>
            {heroFeatures[locale].map(({ label, icon: Icon }) => (
              <StaggerItem
                className="flex min-h-[128px] flex-col items-center justify-start border-cyan-600/35 text-center sm:border-r sm:last:border-r-0"
                key={label}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500 text-[#06246e]">
                  <Icon size={31} strokeWidth={1.8} />
                </div>
                <p className="mt-4 max-w-[9rem] text-sm font-black uppercase leading-snug text-[#061b5f]">
                  {label}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
      </div>
    </RevealSection>
  );
}

export function HeroSupportImage() {
  return (
    <RevealSection className="bg-[#f6f8fb] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[8px] bg-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.22)]">
          <Image
            alt="Monitor biomédico en quirófano"
            className="aspect-[21/9] h-auto w-full object-cover"
            height={945}
            priority
            src="/images/bbs-monitor-operating-room.png"
            width={1680}
          />
        </div>
      </div>
    </RevealSection>
  );
}

export function RepairProcessSection({ locale = "es" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  const steps = repairSteps[locale];

  return (
    <RevealSection className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
              {isEnglish ? "Compare" : "Comparar"}
            </p>
            <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white">
              {isEnglish
                ? "See the difference after a controlled maintenance process."
                : "Mira la diferencia después de un mantenimiento controlado."}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              {isEnglish
                ? "Drag the slider to compare the initial state with the equipment after technical service, cleaning and validation."
                : "Arrastra el control para comparar el estado inicial con el equipo después del servicio técnico, limpieza y validación."}
            </p>
          </Reveal>

          <Stagger className="mt-8 grid gap-3" delay={0.12}>
            {steps.map(({ title, body, icon: Icon }) => (
              <StaggerItem key={title}>
                <div className="rounded-[8px] border border-white/10 bg-white/8 p-5">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 text-cyan-300">
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal className="lg:col-span-7" y={18}>
          <MaintenanceReveal
            afterLabel={isEnglish ? "After service" : "Después"}
            ariaLabel={
              isEnglish
                ? "Before and after biomedical equipment maintenance"
                : "Comparación antes y después del mantenimiento biomédico"
            }
            beforeLabel={isEnglish ? "Before service" : "Antes"}
            imageSrc="/images/bbs-before-after-maintenance.png"
          />
        </Reveal>
      </div>
    </RevealSection>
  );
}

export function VisualPanel({ label, title, tone = "clinical" }: VisualProps) {
  return (
    <Reveal className={`visual-panel visual-${tone}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,0.7),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.9),rgba(20,184,166,0.45))]" />
      <div className="relative flex h-full min-h-[360px] flex-col justify-between p-6 text-white">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-white/75">
          <span>{label}</span>
          <BrandLogo variant="light" compact />
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
    </Reveal>
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
    <Reveal className="max-w-3xl">
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
    </Reveal>
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
    <MotionCard className="h-full rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-xl">
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
    </MotionCard>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function CheckList({
  items,
  tone = "light",
}: {
  items: string[];
  tone?: "light" | "dark";
}) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div
          className={`flex items-center gap-3 text-base font-bold ${
            tone === "dark" ? "text-white" : "text-slate-800"
          }`}
          key={item}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              tone === "dark" ? "bg-white/12 text-cyan-200" : "bg-cyan-100 text-cyan-800"
            }`}
          >
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
  locale = "es",
}: {
  title: string;
  description: string;
  locale?: Locale;
}) {
  const isEnglish = locale === "en";
  return (
    <RevealSection className="px-6 py-20" id={isEnglish ? "contact" : "contacto"}>
      <div className="mx-auto grid max-w-7xl items-start gap-10 overflow-hidden rounded-[8px] bg-[#020b18] p-6 text-white shadow-[0_32px_90px_rgba(2,6,23,0.28)] sm:p-8 lg:grid-cols-[0.78fr_1.08fr] lg:p-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            {isEnglish ? "Technical support" : "Soporte técnico"}
          </p>
          <div className="mt-3 h-px w-40 bg-cyan-400/50" />
          <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {title.includes("atención técnica") ? (
              <>
                ¿Su equipamiento necesita{" "}
                <span className="text-cyan-400">atención técnica especializada?</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="btn-outline-dark"
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt=""
                className="h-5 w-5 invert"
                height={20}
                src="/icons/whatsapp.svg"
                width={20}
              />
              WhatsApp
            </Link>
            <Link className="btn-outline-dark" href={phoneHref}>
              <Phone size={18} /> {isEnglish ? "Call" : "Llamar"}
            </Link>
          </div>
          <BusinessMap locale={locale} />
        </div>
        <div className="grid gap-5">
          <ContactForm locale={locale} />
          <ContactHighlights locale={locale} />
        </div>
      </div>
    </RevealSection>
  );
}

function BusinessMap({ locale = "es" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  return (
    <div className="mt-8 overflow-hidden rounded-[8px] border border-white/10 bg-white/5 text-white shadow-2xl">
      <div className="relative min-h-[280px] overflow-hidden bg-slate-950">
        <iframe
          className="absolute inset-0 h-full w-full border-0 opacity-45 saturate-[0.35] invert"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapsEmbedHref}
          title={
            isEnglish
              ? "Biomedical Business and Service location"
              : "Ubicación de Biomedical Business and Service"
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,24,0.1),rgba(2,11,24,0.74))]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl ring-4 ring-cyan-500/25">
              <Image
                alt="BBS"
                className="h-11 w-11 object-contain"
                height={44}
                src="/brand/bbs-symbol-color.png"
                width={44}
              />
          </div>
          <MapPin className="-mt-2 text-cyan-600 drop-shadow" fill="currentColor" size={32} />
        </div>
      </div>
      <div className="grid gap-5 p-6">
          <div className="flex gap-4">
            <MapPin className="mt-1 shrink-0 text-cyan-400" size={28} />
            <div>
              <p className="font-black text-white">
                {isEnglish ? "La Chorrera, Panama Oeste" : "La Chorrera, Panamá Oeste"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{businessAddress}</p>
            </div>
          </div>
          <div className="flex gap-4 border-t border-white/10 pt-5">
            <Clock3 className="mt-1 shrink-0 text-cyan-400" size={27} />
            <div>
              <p className="font-black text-white">
                {isEnglish ? "Business hours" : "Horario de atención"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{businessHours}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-cyan-400/60 px-5 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/10"
              href={mapsHref}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={16} />
              {isEnglish ? "Open route" : "Abrir ruta"}
            </Link>
          </div>
      </div>
    </div>
  );
}

function ContactHighlights({ locale = "es" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  const highlights = isEnglish
    ? [
        { title: "Fast response", body: "Normally within one business day.", icon: Clock3 },
        { title: "Certified technicians", body: "Specialized staff in active training.", icon: ShieldCheck },
        { title: "Serviced equipment", body: "Major brands in the market.", icon: Wrench },
        { title: "Local coverage", body: "Panama Oeste and nearby areas.", icon: MapPin },
      ]
    : [
        { title: "Respuesta rápida", body: "Respondemos normalmente en menos de 1 día hábil.", icon: Clock3 },
        { title: "Técnicos certificados", body: "Personal especializado y en constante capacitación.", icon: ShieldCheck },
        { title: "Equipos atendidos", body: "Trabajamos con las principales marcas del mercado.", icon: Wrench },
        { title: "Cobertura local", body: "Atención en Panamá Oeste y áreas aledañas.", icon: MapPin },
      ];

  return (
    <>
      <Stagger className="grid gap-3 rounded-[8px] border border-white/10 bg-white/5 p-5 md:grid-cols-4" delay={0.08}>
        {highlights.map(({ title, body, icon: Icon }) => (
          <StaggerItem className="border-white/10 text-center md:border-r md:last:border-r-0" key={title}>
            <Icon className="mx-auto text-cyan-400" size={31} strokeWidth={2} />
            <p className="mt-4 text-sm font-black text-white">{title}</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">{body}</p>
          </StaggerItem>
        ))}
      </Stagger>
      <div className="grid gap-4 rounded-[8px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300 md:grid-cols-[1fr_1.2fr_0.7fr]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-cyan-400" size={28} />
          <p className="font-black text-white">
            {isEnglish ? "Reliability that protects your operation" : "Confianza que garantiza el rendimiento de su operación"}
          </p>
        </div>
        <p className="border-white/10 md:border-l md:pl-5">
          {isEnglish
            ? "More than 10 years delivering technical solutions with quality and efficiency."
            : "Más de 10 años brindando soluciones técnicas con enfoque en calidad y eficiencia."}
        </p>
        <div className="flex items-center gap-3 border-white/10 md:border-l md:pl-5">
          <Users className="text-cyan-400" size={27} />
          <p>
            <span className="block font-black text-white">+200</span>
            {isEnglish ? "clients trust us" : "clientes confían en nosotros"}
          </p>
        </div>
      </div>
    </>
  );
}
export function Footer({ locale = "es" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  const serviceLinks = isEnglish ? [
    { label: "Technical Service", href: "/en/technical-service" },
    { label: "Metrology", href: "/en/metrology" },
    { label: "Radiological Protection", href: "/en/radiological-protection" },
    { label: "Regulatory Management", href: "/en/regulatory-management" },
  ] : [
    { label: "Servicio Técnico", href: "/servicio-tecnico" },
    { label: "Metrología", href: "/metrologia" },
    { label: "Protección Radiológica", href: "/proteccion-radiologica" },
    { label: "Gestión Regulatoria", href: "/gestion-regulatoria" },
  ];
  const companyLinks = isEnglish ? [
    { label: "About", href: "/en/about" },
    { label: "Clients", href: "/en/clients" },
    { label: "Medical Portal", href: "/en/medical-portal" },
    { label: "Technical Support", href: "/en/technical-support" },
  ] : [
    { label: "Sobre Nosotros", href: "/quienes-somos" },
    { label: "Clientes", href: "/clientes" },
    { label: "Portal Médico", href: "/portal-medico", external: true },
    { label: "Soporte Técnico", href: "/soporte-tecnico" },
  ];
  const legalLinks = isEnglish ? [
    { label: "Privacy", href: "/en/privacy" },
    { label: "Terms and conditions", href: "/en/terms" },
    { label: "Cookies", href: "/en/cookies" },
  ] : [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Términos y condiciones", href: "/terminos-condiciones" },
    { label: "Cookies", href: "/cookies" },
  ];

  return (
    <>
    <GlobalReachMap locale={locale} />
    <footer className="border-t border-slate-200 bg-white px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <BrandLogo size="lg" />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {isEnglish
              ? "Biomedical Business and Service. Precision, rigor and technology in service of healthcare."
              : "Biomedical Business and Service. Rigor, precisión y vanguardia tecnológica al servicio de la salud."}
          </p>
        </div>
        <FooterColumn title={isEnglish ? "Services" : "Servicios"} items={serviceLinks} />
        <FooterColumn title={isEnglish ? "Company" : "Empresa"} items={companyLinks} />
        <FooterColumn title="Legal" items={legalLinks} />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-950">
            {isEnglish ? "Contact" : "Contacto"}
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            {businessAddress}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {businessHours}
          </p>
          <p className="mt-4 text-sm font-bold text-slate-950">
            <Link href={phoneHref}>+507 6202-3206</Link> /{" "}
            <Link href={secondaryPhoneHref}>6631-2007</Link>
            <br />
            <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
          </p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        © 2026 Biomedical Business and Service. {isEnglish ? "All rights reserved. Website developed by" : "Todos los derechos reservados. Sitio desarrollado por"}{" "}
        <Link
          className="font-bold text-slate-800 hover:text-cyan-700"
          href="https://www.harmonyagency.lat/"
          rel="noreferrer"
          target="_blank"
        >
          Harmony Agency
        </Link>
        .
      </p>
    </footer>
    </>
  );
}

function BrandLogo({
  variant = "color",
  compact = false,
  size = "md",
}: {
  variant?: "color" | "black" | "light";
  compact?: boolean;
  size?: "md" | "lg" | "hero";
}) {
  const src =
    variant === "light"
      ? compact
        ? "/brand/bbs-symbol-white.png"
        : "/brand/bbs-primary-horizontal-white.png"
      : variant === "black"
        ? compact
          ? "/brand/bbs-icon-bbs-black.png"
          : "/brand/bbs-primary-horizontal-black.png"
        : compact
          ? "/brand/bbs-symbol-color.png"
          : "/brand/bbs-primary-horizontal-color.png";
  const className =
    size === "hero"
      ? "h-auto w-[min(58vw,560px)] max-w-full"
      : size === "lg"
        ? "h-auto w-[210px] max-w-full"
        : compact
          ? "h-9 w-auto"
          : "h-auto w-[160px] max-w-[42vw] sm:w-[190px]";
  const width = compact ? 1802 : 3270;
  const height = compact ? 1710 : 838;

  return (
    <Image
      alt="Biomedical Business and Service"
      className={className}
      height={height}
      priority={size === "hero"}
      src={src}
      width={width}
    />
  );
}

type FooterItem = string | { label: string; href: string; external?: boolean };

function footerItemFromPosition(title: string, item: FooterItem, index: number) {
  if (typeof item !== "string") {
    return item;
  }

  const serviceHrefs = [
    "/servicio-tecnico",
    "/metrologia",
    "/proteccion-radiologica",
    "/gestion-regulatoria",
  ];
  const companyHrefs = [
    "/quienes-somos",
    "/portal-medico",
    "/soporte-tecnico",
    "/privacidad",
  ];
  const hrefs = title === "Servicios" ? serviceHrefs : companyHrefs;

  return {
    label: item,
    href: hrefs[index] || "#",
    external: title === "Empresa" && index === 1,
  };
}

function FooterColumn({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-950">
        {title}
      </p>
      <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
        {items.map((item, index) => {
          const link = footerItemFromPosition(title, item, index);

          return (
          <Link
            className="hover:text-slate-950"
            href={link.href}
            key={`${title}-${link.href}`}
            rel={link.external ? "noreferrer" : undefined}
            target={link.external ? "_blank" : undefined}
          >
            {link.label}
          </Link>
          );
        })}
      </div>
    </div>
  );
}
