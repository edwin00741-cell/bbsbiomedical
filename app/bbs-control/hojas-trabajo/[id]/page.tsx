import { notFound } from "next/navigation";
import { z } from "zod";
import { BackOfficeShell, DataError, PageHeader } from "../../components";
import { requireCapability,createSupabaseServerClient } from "../../../../lib/bbs-control/supabase-server";
import { can } from "../../../../lib/bbs-control/permissions";
import { panamaToday } from "../../../../lib/bbs-control/list-filters";
import type { Worksheet } from "../../../../lib/bbs-control/worksheets";
import { WorksheetForm } from "../worksheet-form";
export default async function WorksheetDetail({params}:{params:Promise<{id:string}>}){
 const user=await requireCapability("worksheets.read");const{id}=await params;if(!z.uuid().safeParse(id).success)notFound();const db=await createSupabaseServerClient();
 const [result,clients]=await Promise.all([db.from("work_sheets").select("*").eq("id",id).maybeSingle(),db.rpc("get_quote_clients")]);
 if(result.error||clients.error)return <BackOfficeShell user={user}><DataError/></BackOfficeShell>;if(!result.data)notFound();const sheet=result.data as Worksheet;
 const options=clients.data as {id:string;name:string}[];if(!options.some(c=>c.id===sheet.client_id))options.push({id:sheet.client_id,name:sheet.client_name});
 return <BackOfficeShell user={user}><PageHeader eyebrow="Hoja de trabajo" title={sheet.number} description="La cotizaci�n se crea con la �ltima versi�n guardada. Los costos, m�rgenes y observaciones internas permanecen en esta hoja."/><WorksheetForm key={sheet.updated_at} sheet={sheet} clients={options} seller={user.full_name} today={panamaToday()} readOnly={!can(user.role,"worksheets.write")}/></BackOfficeShell>;
}
