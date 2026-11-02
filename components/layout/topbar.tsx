"use client";

import { useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { HeaderProfile, HeaderSearch } from "./header-actions";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";
import { Button } from "@/components/ui/button";

const pageNames: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Production orders",
  vendors: "Vendors",
  warehouse: "Warehouse",
  quality: "Quality inspection",
  reconciliation: "Reconciliation",
  imports: "Vendor imports",
  history: "Activity history",
};

export function Topbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const firstSegment = pathname.split("/")[1] || "dashboard";
  const pageTitle = pageNames[firstSegment] ?? "Manufacturing workspace";
  const detailLabel = pathname.includes("/") && pathname.split("/").length > 2 && !["warehouse"].includes(firstSegment) ? "Record detail" : "Production operations";

  return (
    <header className="relative flex h-16 items-center gap-3 border-b border-border/80 bg-background/95 px-3 shadow-sm shadow-foreground/[0.025] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-5 lg:px-8">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 lg:hidden" aria-label="Open navigation">
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="h-dvh w-72 overflow-hidden p-0">
          <SheetTitle className="sr-only">ForgeFlow navigation</SheetTitle>
          <SheetDescription className="sr-only">Primary navigation for the manufacturing workspace.</SheetDescription>
          <div className="h-full min-h-0"><SidebarContent onNavigate={() => setMobileNavOpen(false)} /></div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 shrink-0 space-y-0.5">
        <p className="truncate font-heading text-sm font-semibold leading-5 tracking-tight sm:text-base">{pageTitle}</p>
        <p className="hidden truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.13em] text-muted-foreground sm:block">{detailLabel} <span className="px-1 text-primary/50">·</span> ForgeFlow ERP</p>
      </div>

      <div className="mx-auto flex min-w-0 flex-1 justify-center px-1 sm:px-3 lg:px-8"><HeaderSearch /></div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {resolvedTheme === "dark" ? <Sun aria-hidden="true" className="size-4.5" /> : <Moon aria-hidden="true" className="size-4.5" />}
        </Button>
        <span aria-hidden="true" className="mx-0.5 hidden h-7 w-px bg-border sm:block" />
        <HeaderProfile />
      </div>
    </header>
  );
}
