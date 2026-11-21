import { FinanceDetailPage } from "../../../finance-page";
export const dynamic = "force-dynamic";
export default async function EditCredit({ params }: { params: Promise<{ id: string }> }) { return <FinanceDetailPage kind="credit" id={(await params).id} edit />; }
