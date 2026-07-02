"use client";

import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  return (
    <button
      aria-label="Subir al inicio"
      className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-slate-950 text-white shadow-[0_18px_55px_rgba(15,23,42,0.38)] ring-4 ring-cyan-400/18 transition hover:-translate-y-1 hover:bg-cyan-700"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <ArrowUp size={23} strokeWidth={2.8} />
    </button>
  );
}
