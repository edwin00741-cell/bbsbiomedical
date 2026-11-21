import { FinanceDetailPage } from "../../finance-page";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default async function RefundDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<SearchParams> }) { return <FinanceDetailPage kind="refund" id={(await params).id} searchParams={searchParams} />; }
