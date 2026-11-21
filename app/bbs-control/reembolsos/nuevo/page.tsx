import { FinanceNewPage } from "../../finance-page";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default function NewRefund({ searchParams }: { searchParams?: Promise<SearchParams> }) { return <FinanceNewPage kind="refund" searchParams={searchParams} />; }
