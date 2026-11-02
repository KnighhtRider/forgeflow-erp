import { WorkspacePage } from "@/components/workspace/workspace-page";
export default async function VendorDetailPage({ params }: { params: Promise<{ vendorId: string }> }) { const { vendorId } = await params; return <WorkspacePage section="vendor" recordId={vendorId} />; }
