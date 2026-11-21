import Link from "next/link";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../../../components";
import { DocumentEditor } from "../../../document-editor";
import { getDocumentEditorData } from "../../../../../lib/bbs-control/documents";
import { requireBackOfficeUser } from "../../../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const { id } = await params;
  let data;
  try { data = await getDocumentEditorData("quote", id); }
  catch { return <BackOfficeShell user={user}><PageHeader eyebrow="Editar cotización" title="Editar Cotización" /><DataError>No se pudo cargar la cotización. Verifique que exista e intente nuevamente.</DataError></BackOfficeShell>; }
  const document = data.document!;
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Editar cotización" title={document.number} action={<Link className="bbs-button" href={`/bbs-control/cotizaciones/${document.id}`}>Ver detalle</Link>} />
    <FlashMessage searchParams={searchParams} />
    <DocumentEditor key={`${document.id}:${document.updated_at}`} actorRole={user.role} data={data} sellerName={user.full_name} issueDate={document.issue_date} validUntil={document.valid_until} />
  </BackOfficeShell>;
}
