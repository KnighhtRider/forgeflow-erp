"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Warehouse,
  CheckCircle,
  Scale,
  UploadCloud,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/warehouse/receipts", label: "Warehouse", icon: Warehouse },
  { href: "/quality", label: "Quality", icon: CheckCircle },
  { href: "/reconciliation", label: "Reconciliation", icon: Scale },
  { href: "/imports", label: "Imports", icon: UploadCloud },
  { href: "/history", label: "History", icon: Clock },
] as const;

export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "justify-center px-2" : "px-6"
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark
            size="sm"
            showWordmark={!collapsed}
            wordmarkClassName={cn(
              "transition-all duration-300",
              collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
            )}
          />
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="min-h-0 flex-1 touch-pan-y overscroll-contain overflow-y-auto p-3"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-all duration-300",
                      collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive && !collapsed ? (
                    <span
                      aria-hidden="true"
                      className="ml-auto h-4 w-0.5 rounded-full bg-sidebar-primary"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1.5 border-t border-sidebar-border p-2">
        <Link
          href="/dashboard"
          title={collapsed ? "Dashboard" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed && "justify-center px-0",
            pathname === "/dashboard" && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard aria-hidden="true" className="size-4 shrink-0" />
          {collapsed ? null : <span>Dashboard</span>}
        </Link>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : undefined}
            className={cn(
              "flex min-h-10 w-full items-center gap-3 rounded-lg border border-sidebar-border bg-background/70 px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
            )}
            {collapsed ? null : <span>Collapse sidebar</span>}
          </button>
        ) : null}
      </div>
    </div>
  );
}
