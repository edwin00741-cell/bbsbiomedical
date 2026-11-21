"use server";
import{revalidatePath}from"next/cache";
import{z}from"zod";
import{effectiveSettingsSchema}from"../../../lib/bbs-control/settings";
import{createSupabaseServerClient,requireBackOfficeUser}from"../../../lib/bbs-control/supabase-server";
export async function saveSettings(form:FormData):Promise<{error:string;success?:string}>{
 await requireBackOfficeUser();let value;try{value=JSON.parse(String(form.get("payload")));}catch{return{error:"Datos inválidos."};}
 const parsed=effectiveSettingsSchema.safeParse(value);if(!parsed.success)return{error:parsed.error.issues[0]?.message||"Revise los ajustes."};
 const{id,version,...values}=parsed.data;const db=await createSupabaseServerClient();const{data,error}=await db.from("business_settings").update({...values,updated_at:new Date().toISOString()}).eq("id",id).eq("updated_at",version).select("updated_at").maybeSingle();
 if(error||!data)return{error:"No se pudo guardar. Otro usuario puede haber modificado la configuración; recargue antes de continuar."};
 revalidatePath("/bbs-control","layout");return{error:"",success:data.updated_at};
}
export async function saveTax(form:FormData):Promise<{error:string;success?:string}>{
 await requireBackOfficeUser();const parsed=z.object({id:z.uuid().nullable(),name:z.string().trim().min(2).max(100),percent:z.coerce.number().finite().min(0).max(100).multipleOf(.0001),is_default:z.boolean(),is_active:z.boolean()}).safeParse({id:form.get("id")||null,name:form.get("name"),percent:form.get("percent"),is_default:form.get("is_default")==="on",is_active:form.get("is_active")==="on"});
 if(!parsed.success)return{error:"Revise el nombre y el porcentaje."};const db=await createSupabaseServerClient();const{error}=await db.rpc("save_tax_definition",{p_tax:parsed.data});if(error)return{error:error.message};revalidatePath("/bbs-control/configuracion");return{error:"",success:"Impuesto guardado. Recargue el listado para ver el resultado."};
}
