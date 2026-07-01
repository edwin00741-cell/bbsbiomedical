import {
  CTA,
  CheckList,
  Footer,
  Header,
  HomeHero,
  IconCard,
  SectionHeading,
  VisualPanel,
} from "./components";
import { clients, services } from "./data";

export default function Home() {
  return (
    <main>
      <Header />
      <HomeHero />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.92fr_1fr] lg:items-center">
          <VisualPanel
            label="15+ años"
            title="Años de experiencia clínica en el sector."
            tone="light"
          />
          <div>
            <SectionHeading title="Soluciones biomédicas con precisión, seguridad y respaldo técnico." />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              BBS Biomedical Solutions nace del compromiso por elevar los
              estándares de calidad en el sector salud. Entendemos que detrás de
              cada equipo médico hay una vida que depende de su correcto
              funcionamiento.
            </p>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Nuestro equipo de ingenieros especializados combina rigor
              normativo con ejecución técnica impecable para optimizar la vida
              útil de cada activo.
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  "Cumplimiento Normativo Estricto",
                  "Tiempos de Respuesta Prioritarios",
                  "Tecnología de Medición Certificada",
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
            description="Desarrollamos soluciones técnicas modulares adaptadas a las necesidades específicas de clínicas, hospitales y centros diagnósticos."
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
            Confían en nuestra precisión
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
        title="¿Necesitas soporte técnico para tus equipos médicos?"
        description="Conversemos sobre el estado actual de sus equipos y cómo nuestro equipo puede ayudarle a mantener la operatividad clínica sin interrupciones."
      />
      <Footer />
    </main>
  );
}
