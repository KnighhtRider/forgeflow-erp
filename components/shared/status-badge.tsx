import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    open: "bg-amber-100 text-amber-800 border-amber-200",
    resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-rose-100 text-rose-800 border-rose-200",
    blocked: "bg-orange-100 text-orange-800 border-orange-200",
    received: "bg-teal-100 text-teal-800 border-teal-200",
    shipped: "bg-violet-100 text-violet-800 border-violet-200",
  };
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  const style = map[normalized] || "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
