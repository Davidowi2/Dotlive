/**
 * PageSkeleton
 *
 * Reusable skeleton patterns for all authenticated pages.
 * Every component here uses the existing shadcn Skeleton primitive.
 *
 * Usage:
 *   if (isLoading) return <AppShell><PageSkeleton.Dashboard /></AppShell>
 */
import { Skeleton } from "@/components/ui/skeleton";

/** 4-column stat card row */
function StatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Generic card grid (courses, sessions, services, ventures) */
function CardGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Table rows (admin members, payments, community members) */
function TableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      {/* header */}
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Transaction list rows (wallet history) */
function TransactionRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Full page header skeleton */
function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-36 rounded-lg" />
    </div>
  );
}

/** Progression bar (dashboard founder journey) */
function ProgressBar() {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Two-column action cards (dashboard bottom section) */
function ActionCards() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <Skeleton className="size-5" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Wallet balance hero card */
function WalletHero() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-muted/50 p-6 sm:col-span-2 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-48" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 justify-center">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-3 w-40 mx-auto" />
      </div>
    </div>
  );
}

/** Category breakdown (vantage results) */
function CategoryBreakdown() {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Filter bar (investor portal) */
function FilterBar() {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 space-y-4">
      <Skeleton className="h-4 w-16" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const PageSkeleton = {
  StatCards,
  CardGrid,
  TableRows,
  TransactionRows,
  Header,
  ProgressBar,
  ActionCards,
  WalletHero,
  CategoryBreakdown,
  FilterBar,
};
