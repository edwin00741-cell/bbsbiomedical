import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../../components";
import { DocumentEditor } from "../../document-editor";
import { getDocumentEditorData } from "../../../../lib/bbs-control/documents";
import { panamaToday, param } from "../../../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";
import { redirect } from "next/navigation";
import { z } from "zod";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const query = searchParams ? await searchParams : {};
  const sourceId = param(query, "quote_id");
  if (z.uuid().safeParse(sourceId).success) {
    const supabase = await createSupabaseServerClient();
    const existing = await supabase.from("invoices").select("id").eq("quote_id", sourceId).neq("status", "void")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing.error) return <BackOfficeShell user={user}><PageHeader eyebrow="Nueva prefactura" title="Nueva Prefactura" /><DataError>No se pudo comprobar la factura de origen. Intente nuevamente.</DataError></BackOfficeShell>;
    if (existing.data) redirect(`/bbs-control/facturas/${existing.data.id}?success=Esta%20cotización%20ya%20tiene%20una%20factura.`);
  }
  let data;
  try { data = await getDocumentEditorData("invoice", undefined, sourceId || undefined); }
  catch { return <BackOfficeShell user={user}><PageHeader eyebrow="Nueva prefactura" title="Nueva Prefactura" /><DataError>No se pudieron cargar los datos para crear la factura. Verifique la cotización de origen e intente nuevamente.</DataError></BackOfficeShell>; }
  const issueDate = panamaToday();
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Nueva prefactura" title="Nueva Prefactura" />
    <FlashMessage searchParams={searchParams} />
    <DocumentEditor data={data} sellerName={user.full_name} issueDate={issueDate} validUntil={issueDate} />
  </BackOfficeShell>;
}
