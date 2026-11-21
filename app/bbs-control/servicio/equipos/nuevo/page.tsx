import { BackOfficeShell,DataError,PageHeader } from "../../../components";
import { requireCapability,createSupabaseServerClient } from "../../../../../lib/bbs-control/supabase-server";
import { EquipmentForm } from "../../forms";
export default async function NewEquipment(){const user=await requireCapability("service.manage");const db=await createSupabaseServerClient();const c=await db.rpc("get_quote_clients");return <BackOfficeShell user={user}><PageHeader eyebrow="Servicio técnico" title="Registrar equipo"/>{c.error?<DataError/>:<EquipmentForm clients={c.data||[]}/>}</BackOfficeShell>;}
