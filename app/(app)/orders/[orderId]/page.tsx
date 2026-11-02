import { WorkspacePage } from "@/components/workspace/workspace-page";
export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) { const { orderId } = await params; return <WorkspacePage section="order" recordId={orderId} />; }
