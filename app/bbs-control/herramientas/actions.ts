"use server";
import{revalidatePath}from"next/cache";
import{redirect}from"next/navigation";
import{z}from"zod";
import{prepareImport}from"../../../lib/bbs-control/imports";
import{createSupabaseServerClient,requireBackOfficeUser}from"../../../lib/bbs-control/supabase-server";
export type ImportPreview={error:string;hash?:string;count?:number;rows?:{row:number;name:string;description:string;total:number}[];errors?:string[]};
export async function previewImport(form:FormData):Promise<ImportPreview>{await requireBackOfficeUser();try{const value=await prepareImport(form);return{error:"",hash:value.hash,count:value.rows.length,rows:value.summary,errors:value.errors};}catch(error){return{error:error instanceof Error?error.message:"No se pudo revisar el archivo."};}}
export async function commitImport(form:FormData):Promise<{error:string}>{
 await requireBackOfficeUser();let id="";try{
 const value=await prepareImport(form);if(value.errors.length) return{error:value.errors.join("\n")};if(value.hash!==form.get("preview_hash"))return{error:"El archivo o los registros cambiaron desde la vista previa. Revise el archivo nuevamente."};
 const request=String(form.get("request_id"));if(!z.uuid().safeParse(request).success)return{error:"Solicitud inválida."};const db=await createSupabaseServerClient();const result=await db.rpc("import_commercial_batch",{p_kind:value.kind,p_file_name:value.fileName,p_rows:value.rows,p_overwrite:value.overwrite,p_request_id:request});if(result.error)return{error:result.error.message};id=String(result.data);
 }catch(error){return{error:error instanceof Error?error.message:"No se pudo importar."};}
 revalidatePath("/bbs-control","layout");redirect(`/bbs-control/herramientas?batch=${id}&success=Importación%20completada.`);
}
export async function undoImport(form:FormData){
 await requireBackOfficeUser();const id=String(form.get("batch_id"));if(!z.uuid().safeParse(id).success)return;const db=await createSupabaseServerClient();const{error}=await db.rpc("undo_commercial_import",{p_batch:id});
 if(error)redirect(`/bbs-control/herramientas?error=${encodeURIComponent(error.message)}`);revalidatePath("/bbs-control","layout");redirect("/bbs-control/herramientas?success=Importación%20deshecha.");
}
