import Link from "next/link";
import { BackOfficeShell, PageHeader } from "../components";
import { requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { reportCatalog } from "../../../lib/bbs-control/reports-types";
import "./reports.css";
export const dynamic = "force-dynamic";
export default async function ReportsPage() {
  const user = await requireBackOfficeUser(), groups = [...new Set(reportCatalog.map((row) => row.group))];
  return <BackOfficeShell user={user}><PageHeader eyebrow="Informes" title="Informes" />
    <div className="bbs-report-catalog">{groups.map((group) => <section className="bbs-card" key={group}><h2>{group}</h2><ul>{reportCatalog.filter((row) => row.group === group).map((row) => <li key={row.id}><Link href={`/bbs-control/informes/${row.id}`}>{row.name}</Link></li>)}</ul></section>)}</div>
  </BackOfficeShell>;
}
