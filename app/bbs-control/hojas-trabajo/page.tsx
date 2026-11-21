import Link from "next/link";
import { BackOfficeShell, DataError, PageHeader } from "../components";
import { createSupabaseServerClient, requireCapability } from "../../../lib/bbs-control/supabase-server";
import { can } from "../../../lib/bbs-control/permissions";
import { readAllPages } from "../../../lib/bbs-control/dashboard";
import type { Worksheet } from "../../../lib/bbs-control/worksheets";
export const dynamic="force-dynamic";
export default async function WorksheetsPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const user=await requireCapability("worksheets.read");const db=await createSupabaseServerClient();const {q=""}=await searchParams;
 const result=await readAllPages<Worksheet>((from,to)=>db.from("work_sheets").select("*",{count:"exact"}).order("created_at",{ascending:false}).order("id").range(from,to));
 const rows=(result.data||[]).filter(w=>`${w.number} ${w.client_name} ${w.payload.title}`.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
 return <BackOfficeShell user={user}><PageHeader eyebrow="Costos y cotizaciones" title="Hojas de trabajo" description="Prepare costos, revise la rentabilidad y genere la cotización desde una hoja guardada." action={can(user.role,"worksheets.write")?<Link className="bbs-button bbs-button-primary" href="/bbs-control/hojas-trabajo/nueva">Nueva hoja de trabajo</Link>:undefined}/><form className="bbs-toolbar"><input className="bbs-input" name="q" defaultValue={q} aria-label="Buscar hojas de trabajo" placeholder="Número HT, cliente o proyecto" style={{maxWidth:400}}/><button className="bbs-button">Buscar</button></form>{result.error?<DataError>No se pudieron cargar las hojas de trabajo.</DataError>:<div className="bbs-table-scroll"><table className="bbs-table"><thead><tr><th>Hoja</th><th>Cliente</th><th>Proyecto</th><th>Vendedor</th><th>Fecha</th></tr></thead><tbody>{rows.map(w=><tr key={w.id}><td><Link href={`/bbs-control/hojas-trabajo/${w.id}`}>{w.number}</Link></td><td>{w.client_name}</td><td>{w.payload.title}</td><td>{w.payload.seller_name}</td><td>{w.payload.issue_date}</td></tr>)}{!rows.length?<tr><td className="bbs-empty" colSpan={5}>No hay hojas de trabajo para esta búsqueda.</td></tr>:null}</tbody></table></div>}</BackOfficeShell>;
}
