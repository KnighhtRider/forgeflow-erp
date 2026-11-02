import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background" style={{ overflowX: "clip" }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring print:hidden"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="min-w-0 transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-w,15rem)]">
        <div className="sticky top-0 z-20">
          <Topbar />
        </div>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-6 outline-none lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
