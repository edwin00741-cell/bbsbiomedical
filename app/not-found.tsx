import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Footer, Header } from "./components";

export default function NotFound() {
  return (
    <main>
      <Header />
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-10 text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
            Error 404
          </p>
          <h1 className="text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
            Página no encontrada
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
            La ruta que intentas abrir no está disponible o fue movida. Puedes
            volver al inicio o revisar nuestros servicios principales.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="btn-primary" href="/">
              <Home size={18} />
              Volver al inicio
            </Link>
            <Link className="btn-secondary" href="/#servicios">
              <Search size={18} />
              Ver servicios
            </Link>
            <Link className="btn-secondary" href="/#contacto">
              <ArrowLeft size={18} />
              Contactar a BBS
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
