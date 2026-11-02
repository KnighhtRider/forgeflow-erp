"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Activity, ArrowRight, Boxes, CheckCircle2, ClipboardList, Command, Factory, FileUp, History, Moon, PackageCheck, Scale, Search, Sun, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useForge } from "@/components/providers/forge-provider";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/domain";

type SearchResult = { id: string; title: string; detail: string; href: string; group: string; icon: LucideIcon };
const pages: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", detail: "Production overview and key metrics", href: "/dashboard", group: "Pages", icon: Factory },
  { id: "orders", title: "Production orders", detail: "Create and track work orders", href: "/orders", group: "Pages", icon: ClipboardList },
  { id: "vendors", title: "Vendors", detail: "Suppliers and subcontractors", href: "/vendors", group: "Pages", icon: Users },
  { id: "receipts", title: "Warehouse receipts", detail: "Goods received against orders", href: "/warehouse/receipts", group: "Pages", icon: PackageCheck },
  { id: "quality", title: "Quality inspection", detail: "Accepted and rejected quantities", href: "/quality", group: "Pages", icon: CheckCircle2 },
  { id: "reconciliation", title: "Reconciliation", detail: "Compare reported, received, and accepted", href: "/reconciliation", group: "Pages", icon: Scale },
  { id: "imports", title: "Vendor update import", detail: "Import CSV updates and retry failures", href: "/imports", group: "Pages", icon: FileUp },
  { id: "history", title: "Activity history", detail: "Recent workspace changes", href: "/history", group: "Pages", icon: History },
];

export function HeaderSearch() {
  const { data } = useForge();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActiveIndex(0);
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open && wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const results = useMemo(() => {
    const records: SearchResult[] = [
      ...data.orders.map((order) => ({ id: order.id, title: order.code, detail: `${order.product} · ${formatNumber(order.quantity)} units · ${order.status}`, href: `/orders/${order.id}`, group: "Orders", icon: ClipboardList })),
      ...data.vendors.map((vendor) => ({ id: vendor.id, title: vendor.name, detail: `${vendor.code} · ${vendor.contact}`, href: `/vendors/${vendor.id}`, group: "Vendors", icon: Users })),
      ...data.receipts.map((receipt) => ({ id: receipt.id, title: receipt.reference, detail: `Goods receipt · ${formatNumber(receipt.quantity)} units`, href: "/warehouse/receipts", group: "Warehouse", icon: Boxes })),
      ...data.reconciliations.map((item) => ({ id: item.id, title: `Reconciliation · ${data.orders.find((order) => order.id === item.orderId)?.code ?? "Order"}`, detail: `${item.status} · vendor reported ${formatNumber(item.reported)}`, href: "/reconciliation", group: "Reconciliation", icon: Scale })),
    ];
    const all = query.trim() ? [...records, ...pages] : pages;
    const needle = query.trim().toLowerCase();
    return all.filter((item) => !needle || `${item.title} ${item.detail} ${item.group}`.toLowerCase().includes(needle)).slice(0, 12);
  }, [data, query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].href);
    }
  }

  return <>
    <Button ref={triggerRef} variant="outline" size="sm" className="group h-9 w-9 justify-center rounded-xl border-border/80 bg-muted/35 px-0 text-muted-foreground shadow-sm hover:bg-muted sm:w-auto sm:min-w-56 sm:justify-start sm:px-3.5" onClick={() => { setQuery(""); setActiveIndex(0); setOpen(true); }} aria-label="Search workspace (Ctrl+K)">
      <Search aria-hidden="true" className="size-4 transition-colors group-hover:text-foreground" />
      <span className="hidden flex-1 text-left font-normal sm:inline">Search workspace…</span>
      <kbd className="hidden rounded-md border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">Ctrl K</kbd>
    </Button>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/65 backdrop-blur-sm" />
        <Dialog.Content onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }} className="fixed left-1/2 top-[12vh] z-[61] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl focus:outline-none">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-5"><Command aria-hidden="true" className="size-5 shrink-0 text-primary" /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleSearchKeyDown} placeholder="Search pages, orders, vendors…" className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground" aria-label="Search pages and records" role="combobox" aria-expanded="true" aria-controls="forgeflow-search-results" aria-activedescendant={results[activeIndex] ? `result-${results[activeIndex].id}` : undefined} /><kbd className="hidden rounded border bg-muted px-1.5 py-1 font-mono text-[10px] text-muted-foreground sm:block">ESC</kbd><Dialog.Close asChild><button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close search"><X className="size-4" /></button></Dialog.Close></div>
          <div className="h-px bg-border" />
          <div id="forgeflow-search-results" role="listbox" aria-label="Search results" className="max-h-[55vh] overflow-y-auto p-2">
            {results.length ? results.map((item, index) => { const Icon = item.icon; return <button key={`${item.group}-${item.id}`} id={`result-${item.id}`} role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => go(item.href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${index === activeIndex ? "bg-muted" : "hover:bg-muted/70"}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><span className="hidden items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:flex">{item.group}<ArrowRight className="size-3" /></span></button>; }) : <div className="px-4 py-10 text-center"><Search className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No matching pages or records</p><p className="mt-1 text-xs text-muted-foreground">Try an order code, vendor name, or page title.</p></div>}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-[10px] text-muted-foreground sm:px-5"><span>Arrow keys to navigate · Enter to open</span><span>ForgeFlow ERP</span></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

export function HeaderProfile() {
  const [open, setOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, []);
  return <div className="relative" ref={rootRef}>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open profile menu" aria-haspopup="dialog" aria-expanded={open} className="group flex h-10 items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-1.5 transition-colors hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:gap-2.5 sm:pr-2.5">
      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-[11px] font-semibold tracking-wide text-primary-foreground shadow-sm ring-2 ring-background">FF</span>
      <span className="hidden text-left sm:block"><span className="block text-xs font-semibold leading-4">ForgeFlow operator</span><span className="block text-[10px] leading-3 text-muted-foreground">Workspace profile</span></span>
      <span aria-hidden="true" className="hidden size-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/15 sm:block" />
    </button>
    {open && <div role="dialog" aria-label="Profile and preferences" className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl">
      <div className="flex items-center gap-3 rounded-xl bg-muted/55 p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-semibold text-primary-foreground">FF</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">ForgeFlow operator</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">Local manufacturing workspace</span><span className="mt-2 inline-flex rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Operations manager</span></span></div>
      <div className="my-2 h-px bg-border" />
      <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"><span><span className="block text-sm font-medium">Appearance</span><span className="text-xs text-muted-foreground">{resolvedTheme === "dark" ? "Dark mode" : "Light mode"}</span></span><Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{resolvedTheme === "dark" ? <Sun /> : <Moon />}</Button></div>
      <a href="/history" onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Activity className="size-4" />Workspace activity<ArrowRight className="ml-auto size-3.5" /></a>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" />Profile is stored locally for this prototype</div>
    </div>}
  </div>;
}
