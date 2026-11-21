"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCapability, createSupabaseServerClient } from "../../../lib/bbs-control/supabase-server";
import { worksheetSchema, calculateWorksheet } from "../../../lib/bbs-control/worksheets";
export async function saveWorksheet(_state:{error:string},form:FormData){
 await requireCapability("worksheets.write");
 try {
  const input=worksheetSchema.parse(JSON.parse(String(form.get("payload"))));calculateWorksheet(input);
  const meta=z.object({id:z.uuid().nullable(),version:z.iso.datetime({offset:true}).nullable(),request:z.uuid()}).parse({id:form.get("id")||null,version:form.get("version")||null,request:form.get("request_id")});
  const db=await createSupabaseServerClient();const {data,error}=await db.rpc("save_work_sheet",{p_payload:input,p_request_id:meta.request,p_id:meta.id,p_version:meta.version});
  if(error)return {error:error.message};revalidatePath("/bbs-control/hojas-trabajo");
  return {error:"",id:String(data)};
 }catch(error){return {error:error instanceof z.ZodError?error.issues[0].message:error instanceof Error?error.message:"No se pudo guardar la hoja."};}
}
export async function createWorksheetQuote(_state:{error:string},form:FormData){
 await requireCapability("quotes.write");let id:string;
 try{
  const input=z.object({id:z.uuid(),version:z.iso.datetime({offset:true}),request_id:z.uuid()}).parse(Object.fromEntries(form));
  const db=await createSupabaseServerClient();const result=await db.rpc("quote_from_work_sheet",{p_id:input.id,p_version:input.version,p_request_id:input.request_id});
  if(result.error)return{error:result.error.message};id=String(result.data);
 }catch{return{error:"No se pudo crear la cotización. Recargue e intente nuevamente."};}
 revalidatePath("/bbs-control/cotizaciones");redirect(`/bbs-control/cotizaciones/${id}/editar`);
}
