import { serveDeliveryPdf } from "../../../../../../lib/bbs-control/delivery-route";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return serveDeliveryPdf(request, (await params).id, "delivery-note");
}
