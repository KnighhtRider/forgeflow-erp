"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main role="alert" className="flex min-h-svh items-center justify-center px-4">
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">We couldn’t load this page</h1>
        <p className="max-w-md text-sm text-muted-foreground">An unexpected error occurred. You can retry, or return to the dashboard.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild><Link href="/dashboard">Go to dashboard</Link></Button>
        </div>
      </div>
    </main>
  );
}
