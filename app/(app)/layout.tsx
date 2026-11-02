import { Suspense } from "react";
import { Providers } from "@/components/providers/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ForgeProvider } from "@/components/providers/forge-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ForgeProvider>
        <Suspense fallback={<div className="min-h-svh bg-background p-6 text-sm text-muted-foreground">Loading ForgeFlow workspace…</div>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </ForgeProvider>
    </Providers>
  );
}
