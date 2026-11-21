import { FinanceNewPage } from "../../finance-page";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
export const dynamic = "force-dynamic";
export default function NewCredit({ searchParams }: { searchParams?: Promise<SearchParams> }) { return <FinanceNewPage kind="credit" searchParams={searchParams} />; }
