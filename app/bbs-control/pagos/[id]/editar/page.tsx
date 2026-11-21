import { FinanceDetailPage } from "../../../finance-page";
export const dynamic = "force-dynamic";
export default async function EditPayment({ params }: { params: Promise<{ id: string }> }) { return <FinanceDetailPage kind="payment" id={(await params).id} edit />; }
