"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient,requireCapability } from "../../../lib/bbs-control/supabase-server";
import { equipmentSchema,serviceReportSchema } from "../../../lib/bbs-control/service";
export async function saveEquipment(_state:{error:string},form:FormData){
 await requireCapability("service.manage");
 try{
  const payload=equipmentSchema.parse(JSON.parse(String(form.get("payload"))));const db=await createSupabaseServerClient();
  const id=z.uuid().parse(form.get("id"));const version=form.get("version");
  const result=version?await db.from("equipment").update({...payload,updated_at:new Date().toISOString()}).eq("id",id).eq("updated_at",z.iso.datetime({offset:true}).parse(version)).select("id").maybeSingle():await db.from("equipment").insert({id,...payload}).select("id").single();
  if(result.error)return{error:result.error.message};if(!result.data)return{error:"El equipo cambió. Recargue antes de guardar."};revalidatePath("/bbs-control/servicio");return {error:"",id:String(result.data.id)};
 }catch(e){return{error:e instanceof z.ZodError?e.issues[0].message:"No se pudo guardar el equipo."};}
}
export async function saveServiceReport(_state:{error:string},form:FormData){
 await requireCapability("service.manage");
 try{
  const payload=serviceReportSchema.parse(JSON.parse(String(form.get("payload"))));
  const meta=z.object({id:z.uuid().nullable(),version:z.iso.datetime({offset:true}).nullable(),request:z.uuid()}).parse({id:form.get("id")||null,version:form.get("version")||null,request:form.get("request_id")});
  const db=await createSupabaseServerClient();const r=await db.rpc("save_service_report",{p_payload:payload,p_request_id:meta.request,p_id:meta.id,p_version:meta.version});
  if(r.error)return {error:r.error.message};revalidatePath("/bbs-control/servicio");return {error:"",id:String(r.data)};
 }catch(e){return {error:e instanceof z.ZodError?e.issues[0].message:"No se pudo guardar el reporte."};}
}
