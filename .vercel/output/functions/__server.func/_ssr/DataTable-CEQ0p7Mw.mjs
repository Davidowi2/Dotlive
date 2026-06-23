import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { m as Table } from "../_libs/lucide-react.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { n as Skeleton } from "./PageSkeleton-NlnwrOgm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DataTable-CEQ0p7Mw.js
var import_jsx_runtime = require_jsx_runtime();
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
function DataTable({ columns, rows, getRowKey, emptyState, onRowClick, zebra = false, stickyHeader = false, isLoading = false, skeletonRows = 5, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("overflow-hidden rounded-2xl border border-border bg-card", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: cn("border-b border-border bg-card", stickyHeader && "sticky top-0 z-10"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: cn("p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", col.align === "right" && "text-right", col.align === "center" && "text-center", col.hideOnMobile && "hidden sm:table-cell", col.width),
						children: col.header
					}, col.key)) })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-border",
					children: isLoading ? Array.from({ length: skeletonRows }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cn("p-4", col.hideOnMobile && "hidden sm:table-cell"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full max-w-[180px]" })
					}, col.key)) }, `skeleton-${i}`)) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: columns.length,
						className: "p-0",
						children: emptyState ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							variant: "inline",
							icon: Table,
							title: "No data yet"
						})
					}) }) : rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: cn("transition-colors", onRowClick && "cursor-pointer hover:bg-accent/60", zebra && i % 2 === 1 && "bg-muted/20"),
						onClick: () => onRowClick?.(row),
						children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: cn("p-4", col.align === "right" && "text-right", col.align === "center" && "text-center", col.hideOnMobile && "hidden sm:table-cell"),
							children: col.cell(row)
						}, col.key))
					}, getRowKey(row)))
				})]
			})
		})
	});
}
//#endregion
export { DataTable as t };
