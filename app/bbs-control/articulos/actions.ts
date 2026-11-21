"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { catalogItemSchema } from "../../../lib/bbs-control/catalog";
import { createSupabaseServerClient,requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
export async function saveItem(form:FormData):Promise<{error:string}>{
 await requireBackOfficeUser();let value;try{value=JSON.parse(String(form.get("payload")));}catch{return {error:"Formulario inválido."};}
 const parsed=catalogItemSchema.safeParse(value);if(!parsed.success)return {error:parsed.error.issues[0]?.message||"Revise los datos."};
 const meta=z.object({id:z.uuid().nullable(),version:z.iso.datetime({offset:true}).nullable()}).safeParse({id:form.get("id")||null,version:form.get("version")||null});if(!meta.success)return {error:"Referencia inválida. Recargue el formulario."};
 const db=await createSupabaseServerClient();const {error}=await db.rpc("save_catalog_item",{p_item:parsed.data,p_id:meta.data.id,p_version:meta.data.version});if(error)return {error:error.message};
 revalidatePath("/bbs-control/articulos");revalidatePath("/bbs-control/informes");redirect("/bbs-control/articulos?success=Artículo%20guardado.");
}
export async function setItemActive(form:FormData){
 await requireBackOfficeUser();const id=String(form.get("id"));if(!z.uuid().safeParse(id).success)return;
 const db=await createSupabaseServerClient();const {data,error}=await db.from("items").update({is_active:form.get("active")==="1"}).eq("id",id).eq("updated_at",String(form.get("version"))).select("id").maybeSingle();
 if(error||!data)redirect("/bbs-control/articulos?error=No%20se%20pudo%20actualizar.%20Recargue%20el%20listado.");revalidatePath("/bbs-control/articulos");redirect("/bbs-control/articulos?success=Estado%20actualizado.");
}
