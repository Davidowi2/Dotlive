import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { Et as Building2, H as MapPin, Ot as Bookmark, T as Send, kt as BookmarkCheck, tt as Gauge } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { u as formatNaira } from "./constants-DV8g_Ppd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/demo-BJjQgLip.js
var import_jsx_runtime = require_jsx_runtime();
var $$splitComponentImporter = () => import("./demo-BUhwZR15.mjs");
var Route = createFileRoute("/_authenticated/demo")({
	head: () => ({ meta: [{ title: "DOT Demo — DOT" }, {
		name: "description",
		content: "Discover investable African ventures on DOT Demo."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function FounderCard({ v, isInvestor, isSaved, isSelf, onSave, onMeet }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col rounded-2xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3 text-primary" }),
						" ",
						v.vantage_point ?? 0
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 font-display text-lg font-semibold",
				children: v.venture_name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
				children: [
					v.industry && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: v.industry
					}),
					v.stage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						children: v.stage
					}),
					v.country && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-0.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }),
							" ",
							v.country
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 flex-1 text-sm text-muted-foreground line-clamp-3",
				children: v.bio
			}),
			v.funding_goal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm font-medium",
				children: ["Raising ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: formatNaira(Number(v.funding_goal))
				})]
			}) : null,
			isInvestor && !isSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "flex-1",
					onClick: onSave,
					children: [isSaved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkCheck, { className: "size-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-4" }), isSaved ? "Saved" : "Save"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					className: "flex-1",
					onClick: onMeet,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), " Meet"]
				})]
			})
		]
	});
}
//#endregion
export { Route as n, FounderCard as t };
