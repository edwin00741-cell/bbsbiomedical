import Image from "next/image";
import { CTA, CheckList, Footer, Header, Hero, SectionHeading } from "../components";
import { values } from "../data";
import { MotionCard, Reveal, RevealSection, Stagger, StaggerItem } from "../motion-primitives";

export default function AboutPage() {
  return (
    <main>
      <Header />
      <Hero
        compact
        eyebrow="Excelencia biomédica"
        title="¿Quiénes somos?"
        description="Lideramos la transformación del sector salud mediante soluciónes tecnológicas avanzadas, rigor científico y una visión humana de la biotecnología aplicada."
        primary="Comenzar ahora"
        secondary="Ver casos de éxito"
      />

      <RevealSection className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <Reveal className="relative min-h-[620px] overflow-hidden rounded-[8px] bg-slate-100 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <Image
              alt="Bryan Rodriguez, fundador de Biomedical Business and Service"
              className="object-cover object-center"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              src="/team/bryan-rodriguez-founder.png"
            />
            <div className="absolute left-5 top-5 rounded-[8px] bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                Fundador
              </p>
              <p className="text-lg font-black text-slate-950">Bryan Rodriguez</p>
            </div>
          </Reveal>
          <Reveal>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              Liderazgo visionario
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Bryan Rodríguez
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Fundador y Director Ejecutivo de Biomedical Business and Service. Con una
              trayectoria marcada por la innovación clínica y el compromiso con
              la precisión diagnóstica, Bryan ha consolidado a BBS como un
              referente en soluciónes integrales para el sector salud.
            </p>
            <blockquote className="mt-8 border-l-4 border-cyan-500 pl-6 text-xl font-bold leading-8 text-slate-800">
              “Nuestra misión no es solo implementar tecnología; es garantizar
              que cada diagnóstico sea el pilar de una decisión de vida
              acertada. La precisión es nuestra lengua materna.”
            </blockquote>
          </Reveal>
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Nuestra Identidad"
            description="Los pilares que sostienen cada proceso, desarrollo y diagnóstico realizado en nuestras instalaciones."
          />
          <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
            <StaggerItem>
            <MotionCard className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">Misión</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Proveer soluciónes biomédicas de vanguardia que eleven el
                estándar de precisión clínica, facilitando herramientas de
                diagnóstico de alta fidelidad.
              </p>
            </MotionCard>
            </StaggerItem>
            <StaggerItem>
            <MotionCard className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">Visión</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Consolidarnos como el aliado tecnológico más confiable en el
                sector biomédico, transformando el futuro de la medicina
                preventiva.
              </p>
            </MotionCard>
            </StaggerItem>
            <StaggerItem>
            <MotionCard className="rounded-[8px] bg-slate-950 p-8 text-white shadow-sm">
              <h3 className="text-3xl font-black">Nuestros Valores</h3>
              <div className="mt-7">
                <CheckList items={values} tone="dark" />
              </div>
            </MotionCard>
            </StaggerItem>
          </Stagger>
        </div>
      </RevealSection>

      <CTA
        title="¿Listo para transformar su práctica clínica?"
        description="Únase a los centros de salud que ya están liderando la vanguardia diagnóstica con BBS."
      />
      <Footer />
    </main>
  );
}
