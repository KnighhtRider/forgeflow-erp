import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function KpiTile({
  label,
  value,
  icon: IconComponent,
  definition,
  warn,
  compact = false,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  definition: string;
  warn?: boolean;
  compact?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          aria-label={`${label}: ${value}`}
          className={`cursor-help bg-card/80 backdrop-blur-sm outline-none transition-colors hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 rounded-xl border shadow-sm ${compact ? "px-3 py-3 sm:px-4 sm:py-4" : "px-4 py-4"}`}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            {IconComponent ? (
              <IconComponent
                className={`${compact ? "size-3 sm:size-3.5" : "size-3.5"} ${warn ? "text-amber-600" : ""}`}
                aria-hidden="true"
              />
            ) : null}
            <span className={compact ? "min-h-8 text-xs leading-4" : "text-xs"}>{label}</span>
          </div>
          <div
            className={`mt-2 font-heading ${compact ? "text-xl sm:text-2xl" : "text-2xl"} font-semibold leading-none tabular-nums ${
              warn ? "text-amber-600" : ""
            }`}
          >
            {value}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="max-w-xs text-xs">{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function KpiGroup({
  title,
  gridClass,
  children,
}: {
  title: string;
  gridClass: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex h-full flex-col overflow-hidden rounded-xl border bg-card/70 backdrop-blur-sm text-card-foreground shadow-sm"
    >
      <h2 className="px-5 pb-2 pt-4 text-xs font-medium text-muted-foreground">
        {title}
      </h2>
      <div className={`grid flex-1 gap-px border-t bg-border ${gridClass}`}>
        {children}
      </div>
    </section>
  );
}
