import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">This page was not found.</p>
        <Link href="/dashboard" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
