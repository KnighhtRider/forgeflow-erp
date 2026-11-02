import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";

export const metadata: Metadata = {
  title: { default: "ForgeFlow ERP · Workflow Demo", template: "%s · ForgeFlow ERP" },
  description: "A manufacturing subcontracting workflow demo for production orders, vendor returns, warehouse receipts, quality, and reconciliation.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
