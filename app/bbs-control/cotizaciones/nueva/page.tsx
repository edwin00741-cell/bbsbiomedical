import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../../components";
import { DocumentEditor } from "../../document-editor";
import { calculateDueDate } from "../../../../lib/bbs-control/document-math";
import { getDocumentEditorData } from "../../../../lib/bbs-control/documents";
import { panamaToday } from "../../../../lib/bbs-control/list-filters";
import { requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  let data;
  try { data = await getDocumentEditorData("quote"); }
  catch { return <BackOfficeShell user={user}><PageHeader eyebrow="Nueva cotización" title="Nueva Cotización" /><DataError>No se pudieron cargar los datos para crear la cotización. Intente nuevamente.</DataError></BackOfficeShell>; }
  const issueDate = panamaToday();
  const validUntil = calculateDueDate(issueDate, "days", data.settings.default_validity_days || 30);
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Nueva cotización" title="Nueva Cotización" />
    <FlashMessage searchParams={searchParams} />
    {user.role==="cotizador"?<p className="bbs-message">Seleccione un cliente registrado. Si falta un cliente, solicite su creación al administrador.</p>:null}
    <DocumentEditor data={data} actorRole={user.role} sellerName={user.full_name} issueDate={issueDate} validUntil={validUntil} />
  </BackOfficeShell>;
}
