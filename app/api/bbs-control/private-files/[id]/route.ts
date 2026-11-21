import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser,createSupabaseServerClient } from "../../../../../lib/bbs-control/supabase-server";
import { can } from "../../../../../lib/bbs-control/permissions";
import { canUseTemplates } from "../../../../../lib/bbs-control/service";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getBackOfficeUser();if(!user||user.must_change_password)return NextResponse.json({error:"No autorizado."},{status:401});const{id}=await params;
 if(!z.uuid().safeParse(id).success)return NextResponse.json({error:"Referencia inválida."},{status:400});
 const template=new URL(request.url).searchParams.get("kind")==="template";
 if(template?!canUseTemplates(user):!can(user.role,"service.manage"))return NextResponse.json({error:"No autorizado."},{status:403});
 const db=await createSupabaseServerClient();const row=await db.from(template?"document_templates":"service_attachments").select("path,name").eq("id",id).maybeSingle();if(row.error||!row.data)return NextResponse.json({error:"Archivo no encontrado."},{status:404});
 const result=await db.storage.from(template?"bbs-private-templates":"bbs-service-reports").createSignedUrl(row.data.path,60,{download:row.data.name});
 if(result.error||!result.data)return NextResponse.json({error:"No se pudo descargar el archivo."},{status:500});
 return NextResponse.redirect(result.data.signedUrl,{headers:{"Cache-Control":"private, no-store"}});
}
