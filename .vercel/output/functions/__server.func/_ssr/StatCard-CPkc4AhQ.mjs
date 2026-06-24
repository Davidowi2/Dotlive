import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { R as Minus, d as TrendingDown, u as TrendingUp } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/StatCard-CPkc4AhQ.js
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
		className: cn("rounded-sm border border-border bg-card p-5 transition-all", href && "hover:shadow-soft hover:border-foreground/20 cursor-pointer", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] tracking-widest uppercase font-medium text-muted-foreground",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex size-7 shrink-0 items-center justify-center", accent === "primary" && "text-primary", accent === "gold" && "text-gold", accent === "muted" && "text-muted-foreground"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 font-display text-4xl font-light leading-none tracking-tight tabular",
				children: [value, sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1.5 text-sm font-normal text-muted-foreground",
					children: sub
				})]
			}),
			trend && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("inline-flex items-center gap-1 text-xs font-medium", trend.direction === "up" && "text-success", trend.direction === "down" && "text-destructive", trend.direction === "neutral" && "text-muted-foreground"),
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
