import { FinanceDetailPage } from "../../finance-page";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default async function PaymentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<SearchParams> }) { return <FinanceDetailPage kind="payment" id={(await params).id} searchParams={searchParams} />; }
