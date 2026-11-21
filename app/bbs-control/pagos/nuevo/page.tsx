import { FinanceNewPage } from "../../finance-page";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default function NewPayment({ searchParams }: { searchParams?: Promise<SearchParams> }) { return <FinanceNewPage kind="payment" searchParams={searchParams} />; }
