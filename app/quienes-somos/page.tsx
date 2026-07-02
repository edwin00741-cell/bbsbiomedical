import Image from "next/image";
import { CTA, CheckList, Footer, Header, Hero, SectionHeading } from "../components";
import { values } from "../data";

export default function AboutPage() {
  return (
    <main>
      <Header />
      <Hero
        compact
        eyebrow="Excelencia biomÃ©dica"
        title="Â¿QuiÃ©nes somos?"
        description="Lideramos la transformaciÃ³n del sector salud mediante soluciones tecnolÃ³gicas avanzadas, rigor cientÃ­fico y una visiÃ³n humana de la biotecnologÃ­a aplicada."
        primary="Comenzar ahora"
        secondary="Ver casos de Ã©xito"
      />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <div className="relative min-h-[620px] overflow-hidden rounded-[8px] bg-slate-100 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <Image
              alt="Bryan Rodriguez, fundador de BBS Biomedical Solutions"
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
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              Liderazgo visionario
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Bryan RodrÃ­guez
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Fundador y Director Ejecutivo de BBS Biomedical Solutions. Con una
              trayectoria marcada por la innovaciÃ³n clÃ­nica y el compromiso con
              la precisiÃ³n diagnÃ³stica, Bryan ha consolidado a BBS como un
              referente en soluciones integrales para el sector salud.
            </p>
            <blockquote className="mt-8 border-l-4 border-cyan-500 pl-6 text-xl font-bold leading-8 text-slate-800">
              â€œNuestra misiÃ³n no es solo implementar tecnologÃ­a; es garantizar
              que cada diagnÃ³stico sea el pilar de una decisiÃ³n de vida
              acertada. La precisiÃ³n es nuestra lengua materna.â€
            </blockquote>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Nuestra Identidad"
            description="Los pilares que sostienen cada proceso, desarrollo y diagnÃ³stico realizado en nuestras instalaciones."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <article className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">MisiÃ³n</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Proveer soluciones biomÃ©dicas de vanguardia que eleven el
                estÃ¡ndar de precisiÃ³n clÃ­nica, facilitando herramientas de
                diagnÃ³stico de alta fidelidad.
              </p>
            </article>
            <article className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">VisiÃ³n</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Consolidarnos como el aliado tecnolÃ³gico mÃ¡s confiable en el
                sector biomÃ©dico, transformando el futuro de la medicina
                preventiva.
              </p>
            </article>
            <article className="rounded-[8px] bg-slate-950 p-8 text-white shadow-sm">
              <h3 className="text-3xl font-black">Nuestros Valores</h3>
              <div className="mt-7">
                <CheckList items={values} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <CTA
        title="Â¿Listo para transformar su prÃ¡ctica clÃ­nica?"
        description="Ãšnase a los centros de salud que ya estÃ¡n liderando la vanguardia diagnÃ³stica con BBS."
      />
      <Footer />
    </main>
  );
}
