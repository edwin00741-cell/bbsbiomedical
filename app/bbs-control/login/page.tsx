import Image from "next/image";
import { redirect } from "next/navigation";
import { signInAction } from "../actions";
import { FlashMessage, PrimaryButton, TextInput } from "../components";
import { hasSupabasePublicEnv } from "../../../lib/bbs-control/env";
import { getBackOfficeUser } from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const nextParam = typeof params.next === "string" ? params.next : "/bbs-control";

  if (hasSupabasePublicEnv()) {
    const currentUser = await getBackOfficeUser();

    if (currentUser) {
      redirect(nextParam.startsWith("/bbs-control") ? nextParam : "/bbs-control");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#0e7490_0%,#031f33_36%,#020617_100%)] px-5 py-12 font-[Montserrat]">
      <section className="w-full max-w-md rounded-[8px] border border-cyan-100/80 bg-white p-7 shadow-[0_30px_90px_rgba(2,6,23,0.36)]">
        <Image
          alt="Biomedical Business and Service"
          className="h-auto w-64"
          height={180}
          priority
          src="/brand/bbs-primary-horizontal-color.png"
          width={700}
        />
        <div className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Acceso interno
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Panel BBS</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Gestión privada de usuarios, clientes, artículos, facturas y cotizaciones.
          </p>
        </div>
        <div className="mt-6">
          <FlashMessage searchParams={Promise.resolve(params)} />
        </div>
        <form action={signInAction} className="mt-6 grid gap-4">
          <input name="next" type="hidden" value={nextParam} />
          <label className="grid gap-2 text-sm font-black text-slate-900">
            Usuario
            <TextInput autoComplete="username" name="username" placeholder="edwin00741" required />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-900">
            Contraseña
            <TextInput
              autoComplete="current-password"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </label>
          <PrimaryButton className="mt-2 w-full" type="submit">
            Entrar
          </PrimaryButton>
        </form>
      </section>
    </main>
  );
}


