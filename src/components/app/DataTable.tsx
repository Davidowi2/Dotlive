import type { ReactNode } from "react";
import { TableIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /**
   * Unique identifier for this column.
   * Can be a key of T or any string for computed/action columns.
   */
  key: string;
  /** Column header label */
  header: string;
  /** Render function for the cell — receives the full row object */
  cell: (row: T) => ReactNode;
  /** Text alignment within the column */
  align?: "left" | "right" | "center";
  /**
   * If true, this column is hidden on screens narrower than sm (640px).
   * Use for secondary columns like "Channel", "Reference", "Date" in admin tables.
   */
  hideOnMobile?: boolean;
  /** Optional fixed-width Tailwind class, e.g. "w-32", "w-48" */
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Must return a unique string per row (used as React key) */
  getRowKey: (row: T) => string;
  /**
   * Custom empty state rendered when rows.length === 0.
   * Defaults to a generic EmptyState with TableIcon.
   */
  emptyState?: ReactNode;
  /**
   * Called when a row is clicked.
   * Adds cursor-pointer and hover:bg-accent/60 to rows automatically.
   */
  onRowClick?: (row: T) => void;
  /**
   * If true, alternating rows get a subtle background tint.
   * Good for dense data tables (Payments, Roles).
   */
  zebra?: boolean;
  /**
   * If true, the thead becomes sticky within its scroll container.
   * Requires the parent to have a defined height (e.g. max-h-[600px] overflow-y-auto).
   */
  stickyHeader?: boolean;
  /** Shows skeleton rows instead of the table body while data loads */
  isLoading?: boolean;
  /** Number of skeleton rows to display while loading. Defaults to 5 */
  skeletonRows?: number;
  className?: string;
}

/**
 * DataTable
 *
 * Generic, type-safe data table with built-in:
 *   - Loading skeleton state
 *   - Empty state (customisable)
 *   - Sticky header option
 *   - Zebra row striping option
 *   - Row click handler
 *   - Mobile-responsive column hiding
 *   - Consistent header styling (uppercase, tracking-wide, muted)
 *
 * Used in:
 *   /admin MembersTab    — member wallet management
 *   /admin PaymentsTab   — Paystack payment ledger
 *   /admin RolesTab      — role assignment + audit log
 *   /community           — member roster
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Name", cell: (m) => <p>{m.name}</p> },
 *       { key: "balance", header: "Balance", align: "right",
 *         cell: (m) => <span className="tabular">{formatDot(m.balance)} DOT</span> },
 *     ]}
 *     rows={members}
 *     getRowKey={(m) => m.id}
 *     isLoading={isLoading}
 *   />
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  onRowClick,
  zebra = false,
  stickyHeader = false,
  isLoading = false,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* ── Header ─────────────────────────────────────── */}
          <thead
            className={cn(
              "border-b border-border bg-card",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody className="divide-y divide-border">
            {/* Loading state */}
            {isLoading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "p-4",
                          col.hideOnMobile && "hidden sm:table-cell",
                        )}
                      >
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? (
                    /* Empty state */
                    <tr>
                      <td colSpan={columns.length} className="p-0">
                        {emptyState ?? (
                          <EmptyState
                            variant="inline"
                            icon={TableIcon}
                            title="No data yet"
                          />
                        )}
                      </td>
                    </tr>
                  )
                : rows.map((row, i) => (
                    <tr
                      key={getRowKey(row)}
                      className={cn(
                        "transition-colors",
                        onRowClick &&
                          "cursor-pointer hover:bg-accent/60",
                        zebra && i % 2 === 1 && "bg-muted/20",
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "p-4",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                            col.hideOnMobile && "hidden sm:table-cell",
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
