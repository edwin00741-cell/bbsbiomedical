import Image from "next/image";
import {
  CTA,
  CheckList,
  Footer,
  Header,
  HomeHero,
  HeroSupportImage,
  IconCard,
  SectionHeading,
} from "./components";
import { clients, services } from "./data";

export default function Home() {
  return (
    <main>
      <Header />
      <HomeHero />
      <HeroSupportImage />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.92fr_1fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[8px] bg-slate-200 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <Image
              alt="Laboratorio biomedico con equipo de metrologia y experiencia clinica"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              src="/images/bbs-biomedical-solutions-lab.png"
            />
            <div className="absolute left-6 top-6 rounded-[8px] bg-white/88 px-4 py-3 shadow-lg backdrop-blur">
              <Image
                alt="BBS Biomedical Business & Services"
                className="h-auto w-[150px]"
                height={838}
                src="/brand/bbs-primary-horizontal-color.png"
                width={3270}
              />
            </div>
          </div>

          <div>
            <SectionHeading title="Soluciones biomedicas con precision, seguridad y respaldo tecnico." />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              BBS Biomedical Solutions nace del compromiso por elevar los
              estandares de calidad en el sector salud. Entendemos que detras de
              cada equipo medico hay una vida que depende de su correcto
              funcionamiento.
            </p>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Nuestro equipo de ingenieros especializados combina rigor
              normativo con ejecucion tecnica impecable para optimizar la vida
              util de cada activo.
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  "Cumplimiento Normativo Estricto",
                  "Tiempos de Respuesta Prioritarios",
                  "Tecnologia de Medicion Certificada",
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24" id="servicios">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Nuestros Servicios"
            description="Desarrollamos soluciones tecnicas modulares adaptadas a las necesidades especificas de clinicas, hospitales y centros diagnosticos."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <IconCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-white px-6 py-20"
        id="clientes"
      >
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Confian en nuestra precision
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {clients.map((client) => (
              <div
                className="rounded-[8px] border border-slate-200 bg-slate-50 px-5 py-6 text-xl font-black text-slate-700"
                key={client}
              >
                {client}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA
        title="Necesitas soporte tecnico para tus equipos medicos?"
        description="Conversemos sobre el estado actual de sus equipos y como nuestro equipo puede ayudarle a mantener la operatividad clinica sin interrupciones."
      />
      <Footer />
    </main>
  );
}
