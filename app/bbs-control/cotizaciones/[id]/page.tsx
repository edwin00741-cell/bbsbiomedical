import { DocumentDetail } from "../../document-detail";
export const dynamic = "force-dynamic";
export default async function QuoteDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  return <DocumentDetail kind="quote" id={id} searchParams={searchParams} />;
}

