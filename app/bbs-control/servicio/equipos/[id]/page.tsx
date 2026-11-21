import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell,DataError,PageHeader } from "../../../components";
import { requireCapability,createSupabaseServerClient } from "../../../../../lib/bbs-control/supabase-server";
import type { Equipment,ServiceReport } from "../../../../../lib/bbs-control/service";
import { readAllPages } from "../../../../../lib/bbs-control/dashboard";
import { EquipmentForm } from "../../forms";
export default async function EquipmentDetail({params}:{params:Promise<{id:string}>}){
 const user=await requireCapability("service.manage");const{id}=await params;if(!z.uuid().safeParse(id).success)notFound();const db=await createSupabaseServerClient();const[e,c,r]=await Promise.all([db.from("equipment").select("*").eq("id",id).maybeSingle(),db.rpc("get_quote_clients"),readAllPages<ServiceReport>((from,to)=>db.from("service_reports").select("*",{count:"exact"}).eq("equipment_id",id).order("created_at",{ascending:false}).order("id").range(from,to))]);if(e.error||c.error||r.error)return <BackOfficeShell user={user}><DataError/></BackOfficeShell>;if(!e.data)notFound();const equipment=e.data as Equipment;
 return <BackOfficeShell user={user}><PageHeader eyebrow="Expediente del equipo" title={equipment.description} action={<Link className="bbs-button bbs-button-primary" href={`/bbs-control/servicio/reportes/nuevo?equipo=${id}`}>Nuevo servicio</Link>}/><EquipmentForm key={equipment.updated_at} equipment={equipment} clients={c.data||[]}/><h2 className="mt-8 mb-4">Historial de servicios</h2><div className="bbs-table-scroll"><table className="bbs-table"><thead><tr><th>Reporte</th><th>Fecha</th><th>Trabajo</th><th>Estado</th></tr></thead><tbody>{(r.data||[]).map(s=><tr key={s.id}><td><Link href={`/bbs-control/servicio/reportes/${s.id}`}>{s.number}</Link></td><td>{s.payload.scheduled_date}</td><td>{s.payload.description}</td><td>{s.payload.status.replaceAll("_"," ")}</td></tr>)}{!r.data?.length?<tr><td colSpan={4} className="bbs-empty">Todavía no hay reportes para este equipo.</td></tr>:null}</tbody></table></div></BackOfficeShell>;
}
