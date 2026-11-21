import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell,DataError,PageHeader } from "../../../components";
import { createSupabaseServerClient,requireCapability } from "../../../../../lib/bbs-control/supabase-server";
import { panamaToday } from "../../../../../lib/bbs-control/list-filters";
import { readAllPages } from "../../../../../lib/bbs-control/dashboard";
import type { Equipment,ServiceReport } from "../../../../../lib/bbs-control/service";
import { ServiceForm } from "../../forms";
import { PrivateUpload } from "../../../private-upload";
export default async function ReportDetail({params}:{params:Promise<{id:string}>}){
 const user=await requireCapability("service.manage");const{id}=await params;if(!z.uuid().safeParse(id).success)notFound();const db=await createSupabaseServerClient();const r=await db.from("service_reports").select("*").eq("id",id).maybeSingle();if(r.error)return <BackOfficeShell user={user}><DataError/></BackOfficeShell>;if(!r.data)notFound();const report=r.data as ServiceReport;
 const[e,a]=await Promise.all([db.from("equipment").select("*").eq("id",report.equipment_id).single(),readAllPages<{id:string;name:string}>((from,to)=>db.from("service_attachments").select("id,name",{count:"exact"}).eq("report_id",id).order("created_at").order("id").range(from,to))]);if(e.error||a.error)return <BackOfficeShell user={user}><DataError/></BackOfficeShell>;
 return <BackOfficeShell user={user}><PageHeader eyebrow="Reporte de servicio" title={report.number} description={e.data.description} action={<><a className="bbs-button" href={`/api/bbs-control/service/${id}/pdf`}>Descargar reporte PDF</a><Link className="bbs-button" href={`/bbs-control/servicio/equipos/${report.equipment_id}`}>Ver expediente</Link></>}/><ServiceForm key={report.updated_at} equipment={e.data as Equipment} report={report} technician={user.full_name} today={panamaToday()}/><section className="bbs-card mt-6"><h2>Reportes firmados y sellados</h2><PrivateUpload kind="service" reportId={id}/>{a.data?.map(f=><p className="mt-3" key={f.id}><a className="bbs-button" href={`/api/bbs-control/private-files/${f.id}`}>{f.name}</a></p>)}{!a.data?.length?<p>Aún no hay archivos firmados adjuntos.</p>:null}</section></BackOfficeShell>;
}
