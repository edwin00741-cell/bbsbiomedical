import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackOfficeUser,createSupabaseServerClient } from "../../../../lib/bbs-control/supabase-server";
import { can } from "../../../../lib/bbs-control/permissions";
import { canUseTemplates } from "../../../../lib/bbs-control/service";
export async function POST(request:Request){
 const user=await getBackOfficeUser();if(!user||user.must_change_password)return NextResponse.json({error:"No autorizado."},{status:401});
 const form=await request.formData();const kind=form.get("kind");
 if(kind!=="service"&&kind!=="template")return NextResponse.json({error:"Tipo inválido."},{status:400});
 if(kind==="template"?!canUseTemplates(user):!can(user.role,"service.manage"))return NextResponse.json({error:"No tiene acceso."},{status:403});
 const file=form.get("file");if(!(file instanceof File)||file.size===0||file.size>10*1024*1024)return NextResponse.json({error:"Seleccione un archivo de hasta 10 MB."},{status:400});
 const ext=file.name.split(".").pop()?.toLowerCase()||"";
 const types:Record<string,string>={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
 if(!types[ext]||(kind==="service"&&!['pdf','png','jpg','jpeg'].includes(ext)))return NextResponse.json({error:"Formato no permitido."},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());const signature=Array.from(bytes.slice(0,8));
 const valid=ext==="pdf"?new TextDecoder().decode(bytes.slice(0,5))==="%PDF-":ext==="png"?signature.join(",")==="137,80,78,71,13,10,26,10":['jpg','jpeg'].includes(ext)?signature[0]===255&&signature[1]===216:signature[0]===80&&signature[1]===75;
 if(!valid)return NextResponse.json({error:"El contenido no corresponde al formato del archivo."},{status:400});
 const db=await createSupabaseServerClient();let reportId:string|null=null;
 if(kind==="service"){
  const parsed=z.uuid().safeParse(form.get("report_id"));if(!parsed.success)return NextResponse.json({error:"Reporte inválido."},{status:400});reportId=parsed.data;
  const r=await db.from("service_reports").select("id").eq("id",reportId).maybeSingle();if(r.error||!r.data)return NextResponse.json({error:"Reporte no encontrado."},{status:404});
 }
 const bucket=kind==="service"?"bbs-service-reports":"bbs-private-templates";const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
 const upload=await db.storage.from(bucket).upload(path,bytes,{contentType:types[ext],upsert:false});
 if(upload.error)return NextResponse.json({error:"No se pudo cargar el archivo. Intente nuevamente."},{status:500});
 const row={name:file.name.slice(0,240),path,...(reportId?{report_id:reportId}:{})};
 const insert=await db.from(kind==="service"?"service_attachments":"document_templates").insert(row);
 if(insert.error){await db.storage.from(bucket).remove([path]);return NextResponse.json({error:"No se pudo registrar el archivo. Intente nuevamente."},{status:500});}
 return NextResponse.json({ok:true});
}
