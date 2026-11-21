import { notFound } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell,DataError,PageHeader } from "../../../components";
import { requireCapability,createSupabaseServerClient } from "../../../../../lib/bbs-control/supabase-server";
import { panamaToday } from "../../../../../lib/bbs-control/list-filters";
import type { Equipment } from "../../../../../lib/bbs-control/service";
import { ServiceForm } from "../../forms";
export default async function NewService({searchParams}:{searchParams:Promise<{equipo?:string;fecha?:string}>}){const user=await requireCapability("service.manage");const{equipo,fecha}=await searchParams;if(!z.uuid().safeParse(equipo).success)notFound();const db=await createSupabaseServerClient();const e=await db.from("equipment").select("*").eq("id",equipo).maybeSingle();if(e.error)return <BackOfficeShell user={user}><DataError/></BackOfficeShell>;if(!e.data)notFound();return <BackOfficeShell user={user}><PageHeader eyebrow="Servicio t�cnico" title="Nuevo reporte" description={e.data.description}/><ServiceForm equipment={e.data as Equipment} technician={user.full_name} today={panamaToday()} scheduledDate={z.iso.date().safeParse(fecha).success?fecha:undefined}/></BackOfficeShell>;}
