import Link from "next/link";
import { BackOfficeCard, BackOfficeShell, PageHeader } from "./components";
import { money } from "../../lib/bbs-control/format";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const [{ count: clients }, { count: quotes }, { data: recentQuotes }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("quotes").select("id", { count: "exact", head: true }),
    supabase.from("quotes")
      .select("id, quote_number, client_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        action={
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-500 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            href="/bbs-control/cotizaciones/nueva"
          >
            Nueva cotización
          </Link>
        }
        description="Control interno para usuarios, clientes y cotizaciones de Biomedical Business and Service."
        eyebrow="Back-office"
        title="Panel operativo"
      />
      <div className="grid gap-5 md:grid-cols-3">
        <BackOfficeCard>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Clientes</p>
          <p className="mt-3 text-4xl font-black text-slate-950">{clients || 0}</p>
        </BackOfficeCard>
        <BackOfficeCard>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Cotizaciones</p>
          <p className="mt-3 text-4xl font-black text-slate-950">{quotes || 0}</p>
        </BackOfficeCard>
        <BackOfficeCard>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Rol activo</p>
          <p className="mt-3 text-2xl font-black text-cyan-700">{user.role}</p>
        </BackOfficeCard>
      </div>
      <BackOfficeCard className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">Cotizaciones recientes</h2>
          <Link className="text-sm font-black text-cyan-700" href="/bbs-control/cotizaciones">
            Ver todas
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="py-3">Número</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recentQuotes || []).map((quote) => (
                <tr key={quote.id}>
                  <td className="py-4 font-black text-slate-950">
                    <Link href={`/bbs-control/cotizaciones/${quote.id}`}>{quote.quote_number}</Link>
                  </td>
                  <td className="font-semibold text-slate-700">{quote.client_name}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {quote.status}
                    </span>
                  </td>
                  <td className="text-right font-black text-slate-950">{money(Number(quote.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BackOfficeCard>
    </BackOfficeShell>
  );
}




