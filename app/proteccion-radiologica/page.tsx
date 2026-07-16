import {
  CTA,
  Footer,
  Header,
  Hero,
  IconCard,
  SectionHeading,
  VisualPanel,
} from "../components";
import { alaraSteps, applicableSectors, radiationScope } from "../data";
import { MotionCard, Reveal, RevealSection, Stagger, StaggerItem } from "../motion-primitives";

export default function RadiationPage() {
  return (
    <main>
      <Header />
      <Hero
        eyebrow="Seguridad radiológica"
        title="Rigor Clínico en Protección Radiológica"
        description="Optimizamos la seguridad de sus instalaciones mediante protocolos de vanguardia, garantizando la protección de pacientes y personal técnico bajo estándares internacionales."
        primary="Consultar alcance técnico"
        secondary="Ver normativas"
      />

      <RevealSection className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <Reveal>
            <SectionHeading title="Servicio de Encargado Clase C" />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Contamos con profesionales certificados para actuar como
              Encargados de Protección Radiológica Clase C, supervisando el
              cumplimiento normativo y la seguridad operativa en instalaciones
              que utilizan fuentes radiactivas o equipos generadores de radiación
              ionizante.
            </p>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {["Gestión de Licencias", "Vigilancia Dosimétrica", "Evaluación de Riesgos", "Auditoría Técnica"].map((item) => (
                <StaggerItem className="rounded-[8px] border border-slate-200 p-5 font-black text-slate-800" key={item}>
                  {item}
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
          <VisualPanel label="ALARA" title="Control, medición y documentación técnica para entornos radiológicos." tone="dark" />
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-24" id="servicios">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Alcance del Servicio Técnico"
            description="Una cobertura integral diseñada para infraestructuras hospitalarias y clínicas de alta complejidad."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {radiationScope.map((item) => (
              <IconCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
              Control y gestión
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Filosofía de Gestión: El Principio ALARA
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              “As Low As Reasonably Achievable”. Aplicamos rigor científico para
              mantener las dosis de radiación tan bajas como sea razonablemente
              posible, equilibrando calidad diagnóstica con máxima seguridad.
            </p>
          </Reveal>
          <Stagger className="grid gap-4">
            {alaraSteps.map((step, index) => (
              <StaggerItem key={step.title}>
              <MotionCard className="rounded-[8px] border border-white/10 bg-white/8 p-6">
                <p className="text-sm font-black text-cyan-300">0{index + 1}</p>
                <h3 className="mt-2 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 text-slate-300">{step.description}</p>
              </MotionCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Sectores de aplicación
          </p>
          <Stagger className="mt-9 flex flex-wrap justify-center gap-3">
            {applicableSectors.map((sector) => (
              <StaggerItem className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200" key={sector}>
                {sector}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </RevealSection>

      <CTA
        title="¿Necesita validar la seguridad radiológica de su instalación?"
        description="Solicite una evaluación técnica y reciba una ruta clara de cumplimiento normativo."
      />
      <Footer />
    </main>
  );
}
