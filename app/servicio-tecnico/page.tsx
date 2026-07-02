import Image from "next/image";
import {
  CTA,
  Footer,
  Header,
  Hero,
  IconCard,
  SectionHeading,
  VisualPanel,
} from "../components";
import { capabilities, projects } from "../data";

export default function TechnicalServicePage() {
  return (
    <main>
      <Header />
      <Hero
        eyebrow="Ingeniería clínica de precisión"
        title="Excelencia en Servicio Técnico Biomédico."
        description="Mantenimiento preventivo, correctivo y calibración certificada para instituciones de salud que no pueden permitirse fallos. Rigor técnico aplicado a la vanguardia médica."
        primary="Ver trabajos realizados"
        secondary="Consultar tarifas"
      />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading title="Mantenimiento con rigor editorial." />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              No solo reparamos equipos; garantizamos la continuidad operativa
              de centros de diagnóstico y laboratorios de alta complejidad.
              Nuestro protocolo se basa en estándares internacionales de calidad,
              asegurando que cada intervención sea documentada con precisión.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[8px] bg-slate-950 p-7 text-white">
                <p className="text-5xl font-black">500+</p>
                <p className="mt-2 text-sm font-black uppercase text-cyan-300">
                  Intervenciones anuales
                </p>
              </div>
              <div className="rounded-[8px] bg-cyan-50 p-7 text-slate-950">
                <p className="text-5xl font-black">99.8%</p>
                <p className="mt-2 text-sm font-black uppercase text-cyan-700">
                  Up-time garantizado
                </p>
              </div>
            </div>
          </div>
          <VisualPanel label="Service lab" title="Diagnóstico, calibración y soporte con trazabilidad completa." />
        </div>
      </section>

      <section className="px-6 py-24" id="servicios">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Portfolio técnico"
            title="Trabajos Realizados"
            description="Una muestra de nuestra capacidad técnica en entornos hospitalarios y de laboratorio de primer nivel."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {projects.map((project, index) => (
              <article
                className={`overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
                key={project.title}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image
                    alt={project.title}
                    className="object-cover"
                    fill
                    sizes={
                      index === 0
                        ? "(min-width: 1024px) 62vw, 100vw"
                        : "(min-width: 1024px) 31vw, 100vw"
                    }
                    src={project.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_45%,rgba(2,6,23,0.68)_100%)]" />
                  <p className="absolute bottom-5 left-5 right-5 text-sm font-black uppercase tracking-[0.14em] text-white/88">
                    {project.tag || "BBS technical"}
                  </p>
                </div>
                <div className="p-7">
                  <h3 className="text-2xl font-black text-slate-950">
                    {project.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {project.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr]">
          <SectionHeading title="Nuestra Capacidad de Respuesta" />
          <div className="grid gap-5">
            {capabilities.map((capability) => (
              <IconCard key={capability.title} {...capability} />
            ))}
          </div>
        </div>
      </section>

      <CTA
        title="¿Su equipamiento necesita atención técnica especializada?"
        description="Agende una visita técnica o solicite un presupuesto para contratos de mantenimiento preventivo."
      />
      <Footer />
    </main>
  );
}
