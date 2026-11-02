import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = "md",
  showWordmark = true,
  wordmarkClassName,
}: {
  size?: "sm" | "md";
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  const tokens: Record<string, { box: string; icon: string; word: string }> = {
    sm: { box: "size-9", icon: "size-5", word: "text-sm" },
    md: { box: "size-10", icon: "size-5", word: "text-lg" },
  };
  const t = tokens[size ?? "md"];

  return (
    <span className={cn("flex items-center gap-3")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          t.box
        )}
      >
        <Factory aria-hidden="true" className={t.icon} />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "font-heading font-semibold tracking-tight",
            t.word,
            wordmarkClassName
          )}
        >
          ForgeFlow ERP
        </span>
      ) : null}
    </span>
  );
}
