import Link from "next/link";
import { BackOfficeCard, BackOfficeShell, PageHeader } from "./components";
import { money } from "../../lib/bbs-control/format";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../lib/bbs-control/supabase-server";

type ModuleConfig = {
  eyebrow: string;
  title: string;
  description: string;
  tableName?: string;
  columns?: string;
  numberField?: string;
  dateField?: string;
  amountField?: string;
  nameField?: string;
  actionHref?: string;
  actionLabel?: string;
  emptyText?: string;
  features: string[];
};

export async function BriskModulePage({ config }: { config: ModuleConfig }) {
  const user = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();
  const rowsPromise = config.tableName
    ? supabase.from(config.tableName)
        .select(config.columns || "*")
        .order(config.dateField || "created_at", { ascending: false })
        .limit(25)
    : Promise.resolve({ data: [] });
  const { data } = await rowsPromise;
  const rows = (Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[];

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        action={
          config.actionHref ? (
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-500 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              href={config.actionHref}
            >
              {config.actionLabel}
            </Link>
          ) : null
        }
        description={config.description}
        eyebrow={config.eyebrow}
        title={config.title}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Registros recientes</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3">Referencia</th>
                  <th>Nombre / Cliente</th>
                  <th>Fecha</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={String(row.id)}>
                    <td className="py-4 font-black text-slate-950">
                      {String(row[config.numberField || "id"] || "-")}
                    </td>
                    <td className="font-semibold text-slate-700">
                      {String(row[config.nameField || "client_name"] || row.name || "-")}
                    </td>
                    <td className="font-semibold text-slate-700">
                      {String(row[config.dateField || "created_at"] || "").slice(0, 10) || "-"}
                    </td>
                    <td className="text-right font-black text-slate-950">
                      {money(Number(row[config.amountField || "total"] || 0))}
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td className="py-8 text-center font-semibold text-slate-500" colSpan={4}>
                      {config.emptyText || "Todavía no hay registros."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </BackOfficeCard>
        <BackOfficeCard>
          <h2 className="text-xl font-black text-slate-950">Funciones del módulo</h2>
          <div className="mt-4 grid gap-3">
            {config.features.map((feature) => (
              <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4" key={feature}>
                <p className="text-sm font-black text-slate-800">{feature}</p>
              </div>
            ))}
          </div>
        </BackOfficeCard>
      </div>
    </BackOfficeShell>
  );
}




