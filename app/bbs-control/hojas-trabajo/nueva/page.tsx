import { BackOfficeShell, DataError, PageHeader } from "../../components";
import { requireCapability,createSupabaseServerClient } from "../../../../lib/bbs-control/supabase-server";
import { panamaToday } from "../../../../lib/bbs-control/list-filters";
import { WorksheetForm } from "../worksheet-form";
export default async function NewWorksheet(){
 const user=await requireCapability("worksheets.write");const db=await createSupabaseServerClient();const clients=await db.rpc("get_quote_clients");
 return <BackOfficeShell user={user}><PageHeader eyebrow="Costos y cotizaciones" title="Nueva hoja de trabajo"/>{clients.error?<DataError/>:<WorksheetForm clients={clients.data||[]} seller={user.full_name} today={panamaToday()}/>}</BackOfficeShell>;
}
