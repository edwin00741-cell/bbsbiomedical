"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Globe2, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Locale = "es" | "en";

const navByLocale = {
  es: [
    { label: "Inicio", href: "/" },
    { label: "Quiénes Somos", href: "/quienes-somos" },
    { label: "Clientes", href: "/#clientes" },
    { label: "Contacto", href: "#contacto" },
  ],
  en: [
    { label: "Home", href: "/en" },
    { label: "About", href: "/en/about" },
    { label: "Clients", href: "/en#clients" },
    { label: "Contact", href: "#contact" },
  ],
};

const servicesByLocale = {
  es: [
    { label: "Servicio Técnico", href: "/servicio-tecnico" },
    { label: "Metrología", href: "/metrologia" },
    { label: "Protección Radiológica", href: "/proteccion-radiologica" },
    { label: "Gestión Regulatoria", href: "/gestion-regulatoria" },
  ],
  en: [
    { label: "Technical Service", href: "/en/technical-service" },
    { label: "Metrology", href: "/en/metrology" },
    { label: "Radiological Protection", href: "/en/radiological-protection" },
    { label: "Regulatory Management", href: "/en/regulatory-management" },
  ],
};

const spanishToEnglishPath: Record<string, string> = {
  "/": "/en",
  "/quienes-somos": "/en/about",
  "/servicio-tecnico": "/en/technical-service",
  "/metrologia": "/en/metrology",
  "/proteccion-radiologica": "/en/radiological-protection",
  "/gestion-regulatoria": "/en/regulatory-management",
  "/clientes": "/en/clients",
  "/portal-medico": "/en/medical-portal",
  "/soporte-tecnico": "/en/technical-support",
  "/privacidad": "/en/privacy",
  "/terminos-condiciones": "/en/terms",
  "/cookies": "/en/cookies",
};

const englishToSpanishPath = Object.fromEntries(
  Object.entries(spanishToEnglishPath).map(([es, en]) => [en, es]),
) as Record<string, string>;

const spanishToEnglishHash: Record<string, string> = {
  "#contacto": "#contact",
  "#servicios": "#services",
  "#clientes": "#clients",
  "#inicio": "#inicio",
};

const englishToSpanishHash = Object.fromEntries(
  Object.entries(spanishToEnglishHash).map(([es, en]) => [en, es]),
) as Record<string, string>;

export function HeaderNav({
  brandLogo,
  locale = "es",
}: {
  brandLogo: ReactNode;
  locale?: Locale;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const isEnglish = locale === "en";
  const navLinks = navByLocale[locale];
  const serviceLinks = servicesByLocale[locale];
  const contactHref = isEnglish ? "#contact" : "#contacto";
  const pathMap = isEnglish ? englishToSpanishPath : spanishToEnglishPath;
  const hashMap = isEnglish ? englishToSpanishHash : spanishToEnglishHash;
  const languageHref = `${pathMap[pathname] || (isEnglish ? "/" : "/en")}${
    hashMap[currentHash] || currentHash
  }`;

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setServicesOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setServicesOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  function closeMenus() {
    setMenuOpen(false);
    setServicesOpen(false);
  }

  function getVisibleHash() {
    const sectionIds = isEnglish
      ? ["services", "clients", "contact"]
      : ["servicios", "clientes", "contacto"];
    const anchorY = window.innerHeight * 0.35;
    let bestHash = window.location.hash;
    let bestScore = Number.POSITIVE_INFINITY;

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const score = Math.abs(rect.top - anchorY);

        if (score < bestScore) {
          bestHash = `#${id}`;
          bestScore = score;
        }
      }
    });

    return bestHash;
  }

  function handleLanguageClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const visibleHash = getVisibleHash();
    const targetPath = pathMap[pathname] || (isEnglish ? "/" : "/en");
    const targetHash = hashMap[visibleHash] || visibleHash;

    closeMenus();
    window.location.assign(`${targetPath}${targetHash}`);
  }

  return (
    <header className="sticky top-0 z-50 px-4 py-3" id="inicio" ref={navRef}>
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/92 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:px-6">
        <Link
          aria-label="Biomedical Business and Service"
          className="brand-header block"
          href="#inicio"
          onClick={closeMenus}
        >
          {brandLogo}
        </Link>

        <nav className="hidden items-center gap-8 text-base font-semibold text-slate-500 lg:flex">
          {navLinks.slice(0, 2).map((link) => (
            <Link
              className="transition hover:text-slate-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              aria-expanded={servicesOpen}
              className="inline-flex items-center gap-1.5 transition hover:text-slate-950"
              onClick={() => setServicesOpen((open) => !open)}
              type="button"
            >
              {isEnglish ? "Services" : "Servicios"} <ChevronDown size={16} />
            </button>
            <AnimatePresence>
              {servicesOpen ? (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute left-1/2 top-9 w-72 -translate-x-1/2 rounded-[8px] border border-slate-200 bg-white p-2 text-left shadow-2xl"
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {serviceLinks.map((link) => (
                    <Link
                      className="block rounded-[8px] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                      href={link.href}
                      key={link.href}
                      onClick={closeMenus}
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          {navLinks.slice(2).map((link) => (
            <Link
              className="transition hover:text-slate-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            href={languageHref}
            onClick={handleLanguageClick}
          >
            <Globe2 size={15} />
            {isEnglish ? "ES" : "EN"}
          </Link>
        </nav>

        <Link
          aria-label={isEnglish ? "Request technical service" : "Solicitar diagnóstico"}
          className="hidden min-w-fit items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 sm:inline-flex sm:px-6 md:px-7"
          href={contactHref}
        >
          {isEnglish ? "Request service" : "Solicitar diagnóstico"}
        </Link>

        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={21} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute left-4 right-4 top-[76px] rounded-[8px] border border-slate-200 bg-white p-3 shadow-2xl lg:hidden"
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
        <nav className="grid gap-1 text-base font-bold text-slate-700">
          {navLinks.slice(0, 2).map((link) => (
            <Link
              className="rounded-[8px] px-4 py-3 transition hover:bg-slate-100 hover:text-slate-950"
              href={link.href}
              key={link.href}
              onClick={closeMenus}
            >
              {link.label}
            </Link>
          ))}
          <button
            aria-expanded={servicesOpen}
            className="flex items-center justify-between rounded-[8px] px-4 py-3 text-left transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => setServicesOpen((open) => !open)}
            type="button"
          >
            {isEnglish ? "Services" : "Servicios"}
            <ChevronDown
              className={`transition ${servicesOpen ? "rotate-180" : ""}`}
              size={17}
            />
          </button>
          <div
            className={`grid overflow-hidden pl-3 transition-all ${
              servicesOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {serviceLinks.map((link) => (
              <Link
                className="rounded-[8px] px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                href={link.href}
                key={link.href}
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {navLinks.slice(2).map((link) => (
            <Link
              className="rounded-[8px] px-4 py-3 transition hover:bg-slate-100 hover:text-slate-950"
              href={link.href}
              key={link.href}
              onClick={closeMenus}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="mt-2 inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-black text-white"
            href={contactHref}
            onClick={closeMenus}
          >
            {isEnglish ? "Request service" : "Solicitar diagnóstico"}
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
            href={languageHref}
            onClick={handleLanguageClick}
          >
            <Globe2 size={16} />
            {isEnglish ? "Español" : "English"}
          </Link>
        </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
