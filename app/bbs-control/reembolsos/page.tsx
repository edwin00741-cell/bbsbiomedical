import { FinanceListPage } from "../finance-page";
import type { SearchParams } from "../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default function RefundsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) { return <FinanceListPage kind="refund" searchParams={searchParams} />; }
