const services = [
  "Desarrollo web",
  "Automatizacion",
  "Soporte tecnico",
  "Consultoria digital",
];

const stats = [
  { label: "Entrega clara", value: "01" },
  { label: "Proceso simple", value: "02" },
  { label: "Soporte cercano", value: "03" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#161616]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a className="text-lg font-black tracking-[0.16em]" href="#">
          BBS
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4a4a44] md:flex">
          <a className="transition hover:text-[#161616]" href="#servicios">
            Servicios
          </a>
          <a className="transition hover:text-[#161616]" href="#proceso">
            Proceso
          </a>
          <a className="transition hover:text-[#161616]" href="#contacto">
            Contacto
          </a>
        </nav>
        <a
          className="rounded-full bg-[#161616] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#333333]"
          href="mailto:contacto@bbsservices.com"
        >
          Escribir
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pb-24 lg:pt-20">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-[#d8d8cc] px-4 py-2 text-sm font-bold text-[#4a4a44]">
            Servicios digitales para negocios que quieren avanzar
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
            BBS Services crea sistemas web claros, rapidos y listos para crecer.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4a4a44]">
            Construimos presencia digital, automatizaciones y herramientas de
            trabajo para que tu operacion se vea profesional desde el primer dia.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-full bg-[#c9f24d] px-6 py-3 text-sm font-black text-[#161616] transition hover:bg-[#b7df3e]"
              href="#contacto"
            >
              Cotizar proyecto
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-[#bdbdb0] px-6 py-3 text-sm font-black text-[#161616] transition hover:border-[#161616]"
              href="#servicios"
            >
              Ver servicios
            </a>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[8px] bg-[#161616] p-6 text-white shadow-2xl shadow-black/15">
          <div className="absolute inset-0 opacity-80">
            <div className="h-full w-full bg-[linear-gradient(135deg,#161616_0%,#2b3a34_42%,#c9f24d_100%)]" />
          </div>
          <div className="relative flex h-full min-h-[372px] flex-col justify-between">
            <div className="flex items-center justify-between text-sm font-bold text-white/80">
              <span>WEB / OPS / SUPPORT</span>
              <span>2026</span>
            </div>
            <div>
              <p className="max-w-sm text-2xl font-black leading-tight">
                Base lista para dominio, hosting y crecimiento comercial.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {stats.map((item) => (
                  <div
                    className="rounded-[8px] border border-white/20 bg-white/10 p-4 backdrop-blur"
                    key={item.value}
                  >
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="mt-2 text-xs font-bold uppercase text-white/70">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-y border-[#deded2] bg-white px-6 py-16"
        id="servicios"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase text-[#667b17]">
              Servicios
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Lo esencial para lanzar bien.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {services.map((service) => (
              <article
                className="rounded-[8px] border border-[#e4e4d8] bg-[#fbfbf7] p-6"
                key={service}
              >
                <h3 className="text-lg font-black">{service}</h3>
                <p className="mt-4 text-sm leading-6 text-[#55554e]">
                  Solucion enfocada, implementacion ordenada y base tecnica
                  preparada para evolucionar.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16" id="proceso">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase text-[#667b17]">
              Proceso
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              De idea a sitio publicado.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Brief", "Diseno", "Lanzamiento"].map((step, index) => (
              <div className="border-t border-[#c8c8bc] pt-5" key={step}>
                <p className="text-sm font-black text-[#667b17]">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-xl font-black">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-[#55554e]">
                  Avance por etapas, decisiones visibles y entregables concretos.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#161616] px-6 py-16 text-white" id="contacto">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-[#c9f24d]">
              Contacto
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-4xl">
              Listo para conectar dominio, hosting y contenido real.
            </h2>
          </div>
          <a
            className="inline-flex w-fit items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-[#161616] transition hover:bg-[#c9f24d]"
            href="mailto:contacto@bbsservices.com"
          >
            contacto@bbsservices.com
          </a>
        </div>
      </section>
    </main>
  );
}
