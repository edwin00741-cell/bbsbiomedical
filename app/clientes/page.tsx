import Image from "next/image";
import { CTA, Footer, Header, Hero, SectionHeading } from "../components";
import { clients } from "../data";

export default function ClientsPage() {
  return (
    <main>
      <Header />
      <Hero
        compact
        eyebrow="Relaciones institucionales"
        title="Clientes"
        description="Trabajamos con instituciones publicas, centros de salud, clinicas, laboratorios y organizaciones que dependen de equipos confiables."
        primary="Solicitar informacion"
        secondary="Ver servicios"
      />

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Instituciones que han confiado en BBS"
            description="Logos de clientes y aliados atendidos por nuestro equipo. Las historias de caso e imagenes de proyecto se incorporaran en una siguiente fase."
          />
          <div className="mt-12 grid items-center gap-x-14 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <article
                className="flex min-h-[120px] items-center justify-center text-center"
                key={client.name}
              >
                <Image
                  alt={client.name}
                  className="max-h-24 w-auto max-w-full object-contain opacity-85 grayscale transition hover:opacity-100 hover:grayscale-0"
                  height={140}
                  src={client.logo}
                  width={280}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTA
        title="Tu institucion necesita respaldo tecnico?"
        description="Conversemos sobre el estado actual de sus equipos y el tipo de soporte que necesita."
      />
      <Footer />
    </main>
  );
}
