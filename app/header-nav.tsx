"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Quienes Somos", href: "/quienes-somos" },
  { label: "Clientes", href: "/#clientes" },
  { label: "Contacto", href: "#contacto" },
];

const serviceLinks = [
  { label: "Servicio Tecnico", href: "/servicio-tecnico" },
  { label: "Metrologia", href: "/metrologia" },
  { label: "Proteccion Radiologica", href: "/proteccion-radiologica" },
  { label: "Gestion Regulatoria", href: "/gestion-regulatoria" },
];

export function HeaderNav({ brandLogo }: { brandLogo: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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

  function closeMenus() {
    setMenuOpen(false);
    setServicesOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 px-4 py-3" id="inicio" ref={navRef}>
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/92 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:px-6">
        <Link
          aria-label="BBS Biomedical Solutions"
          className="brand-header block"
          href="/"
          onClick={closeMenus}
        >
          {brandLogo}
        </Link>

        <nav className="hidden items-center gap-8 text-base font-semibold text-slate-500 lg:flex">
          <Link className="transition hover:text-slate-950" href="/">
            Inicio
          </Link>
          <Link className="transition hover:text-slate-950" href="/quienes-somos">
            Quienes Somos
          </Link>
          <div className="relative">
            <button
              aria-expanded={servicesOpen}
              className="inline-flex items-center gap-1.5 transition hover:text-slate-950"
              onClick={() => setServicesOpen((open) => !open)}
              type="button"
            >
              Servicios <ChevronDown size={16} />
            </button>
            <div
              className={`absolute left-1/2 top-9 w-72 -translate-x-1/2 rounded-[8px] border border-slate-200 bg-white p-2 text-left shadow-2xl transition ${
                servicesOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
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
            </div>
          </div>
          <Link className="transition hover:text-slate-950" href="/#clientes">
            Clientes
          </Link>
          <Link className="transition hover:text-slate-950" href="#contacto">
            Contacto
          </Link>
        </nav>

        <Link
          aria-label="Solicitar diagnostico"
          className="hidden min-w-fit items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 sm:inline-flex sm:px-6 md:px-7"
          href="#contacto"
        >
          Solicitar diagnostico
        </Link>

        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={21} />}
        </button>
      </div>

      <div
        className={`absolute left-4 right-4 top-[76px] rounded-[8px] border border-slate-200 bg-white p-3 shadow-2xl transition lg:hidden ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
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
            Servicios
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
            href="#contacto"
            onClick={closeMenus}
          >
            Solicitar diagnostico
          </Link>
        </nav>
      </div>
    </header>
  );
}
