import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as TrendingDown, u as TrendingUp, z as Minus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/StatCard-Wbb7_aCv.js
var import_jsx_runtime = require_jsx_runtime();
/**
* StatCard
*
* Standardised stat/metric card used across:
*   /dashboard (Vantage Point, Fundability, DOT Balance, Academy)
*   /vantage   (Vantage Point, Fundability, Investment Readiness)
*   /community (Members, Active, Vantage Completed, Avg Vantage)
*   /work      (Earned, Completed, Rating)
*   /admin     (Successful payments, DOT funded, Revenue)
*
* Usage:
*   <StatCard
*     label="Vantage Point"
*     value={formatDot(vantagePoint)}
*     sub="/ 1000"
*     icon={Gauge}
*     accent="primary"
*     trend={{ direction: "up", value: "+42 pts", label: "vs last assessment" }}
*   />
*/
function StatCard({ label, value, sub, icon: Icon, accent = "primary", trend, href, className }) {
	const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
	const card = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-2xl border border-border bg-card p-5 transition-shadow", href && "hover:shadow-soft hover:border-primary/30 cursor-pointer", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium text-muted-foreground leading-none",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex size-8 shrink-0 items-center justify-center rounded-lg", accent === "primary" && "bg-primary/10 text-primary", accent === "gold" && "bg-gold/10 text-gold", accent === "muted" && "bg-muted text-muted-foreground"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 font-display text-3xl font-bold leading-none tabular",
				children: [value, sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1.5 text-sm font-normal text-muted-foreground",
					children: sub
				})]
			}),
			trend && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", trend.direction === "up" && "bg-success/10 text-success", trend.direction === "down" && "bg-destructive/10 text-destructive", trend.direction === "neutral" && "bg-muted text-muted-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendIcon, { className: "size-3" }), trend.value]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: trend.label
				})]
			})
		]
	});
	if (href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: href,
		className: "block",
		children: card
	});
	return card;
}
//#endregion
export { StatCard as t };
