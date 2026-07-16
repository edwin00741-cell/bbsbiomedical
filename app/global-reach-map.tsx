"use client";

import DottedMap from "dotted-map";
import { motion, useReducedMotion } from "framer-motion";

type Locale = "es" | "en";

type Dot = {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
};

const dots: Dot[] = [
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 40.7128, lng: -74.006 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 19.4326, lng: -99.1332 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: -23.5505, lng: -46.6333 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 51.5074, lng: -0.1278 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 40.4168, lng: -3.7038 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 25.2048, lng: 55.2708 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: 1.3521, lng: 103.8198 } },
  { start: { lat: 8.9824, lng: -79.5199 }, end: { lat: -1.2921, lng: 36.8219 } },
];

function projectPoint(lat: number, lng: number) {
  return {
    x: (lng + 180) * (800 / 360),
    y: (90 - lat) * (400 / 180),
  };
}

function createCurvedPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - Math.abs(start.x - end.x) * 0.08 - 34;

  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

export function GlobalReachMap({ locale = "es" }: { locale?: Locale }) {
  const reduceMotion = useReducedMotion();
  const map = new DottedMap({ height: 100, grid: "diagonal" });
  const svgMap = map.getSVG({
    backgroundColor: "#020617",
    color: "#ffffff34",
    radius: 0.22,
    shape: "circle",
  });
  const isEnglish = locale === "en";

  return (
    <section className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        >
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            {isEnglish ? "Global reach" : "Alcance global"}
          </p>
          <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white">
            {isEnglish
              ? "We support biomedical operations wherever your project needs us."
              : "Trabajamos donde tu operación biomédica nos necesite."}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            {isEnglish
              ? "From Panama, BBS coordinates technical support, advisory, documentation and biomedical service planning for institutions and partners across the world."
              : "Desde Panamá, BBS coordina soporte técnico, asesoría, documentación y planificación de servicios biomédicos para instituciones y aliados en cualquier parte del mundo."}
          </p>
          <div className="mt-8 grid gap-3 text-sm font-black uppercase tracking-[0.12em] text-slate-300 sm:grid-cols-3">
            {(isEnglish
              ? ["Remote advisory", "Technical logistics", "Global partners"]
              : ["Asesoría remota", "Logística técnica", "Aliados globales"]
            ).map((item) => (
              <div className="rounded-[8px] border border-white/10 bg-white/8 px-4 py-3" key={item}>
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-[8px] border border-white/10 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
          transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.22 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        >
          <div className="relative aspect-[2/1] w-full">
            <img
              alt={isEnglish ? "BBS global service coverage map" : "Mapa de cobertura global de BBS"}
              className="h-full w-full select-none object-cover opacity-80 [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
              draggable={false}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
            />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
              viewBox="0 0 800 400"
            >
              <defs>
                <linearGradient id="bbs-global-path" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                  <stop offset="8%" stopColor="#22d3ee" stopOpacity="1" />
                  <stop offset="92%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {dots.map((dot, index) => {
                const start = projectPoint(dot.start.lat, dot.start.lng);
                const end = projectPoint(dot.end.lat, dot.end.lng);

                return (
                  <g key={`${dot.end.lat}-${dot.end.lng}`}>
                    <motion.path
                      animate={reduceMotion ? undefined : { pathLength: 1 }}
                      d={createCurvedPath(start, end)}
                      fill="none"
                      initial={reduceMotion ? false : { pathLength: 0 }}
                      stroke="url(#bbs-global-path)"
                      strokeWidth="1.4"
                      transition={{ delay: index * 0.12, duration: 1.1, ease: "easeOut" }}
                    />
                    {[start, end].map((point, pointIndex) => (
                      <g key={`${index}-${pointIndex}`}>
                        <circle cx={point.x} cy={point.y} fill="#22d3ee" r="2.6" />
                        <circle cx={point.x} cy={point.y} fill="#22d3ee" opacity="0.45" r="2.6">
                          <animate attributeName="r" dur="1.8s" repeatCount="indefinite" to="10" />
                          <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" to="0" />
                        </circle>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
