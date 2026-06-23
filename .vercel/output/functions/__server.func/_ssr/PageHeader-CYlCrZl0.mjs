import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PageHeader-CYlCrZl0.js
var import_jsx_runtime = require_jsx_runtime();
/**
* PageHeader
*
* Standardised page-level header for all authenticated app routes.
* Replaces the repeated pattern of:
*   <h1 className="font-display text-3xl font-bold">...</h1>
*   <p className="mt-1 text-sm text-muted-foreground">...</p>
*
* Usage (default):
*   <PageHeader
*     eyebrow="Welcome back,"
*     title="Amara Okafor"
*     subtitle="FarmLink Africa · Stage: Validate"
*     action={<Button variant="hero">Update Vantage</Button>}
*   />
*
* Usage (compact, inside a tab or card):
*   <PageHeader variant="compact" title="Members" action={<Badge>42</Badge>} />
*/
function PageHeader({ title, subtitle, eyebrow, action, variant = "default", className }) {
	if (variant === "compact") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center justify-between gap-4", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl font-semibold tracking-tight",
			children: title
		}), action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-end", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: eyebrow
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-bold tracking-tight",
					children: title
				}),
				subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: subtitle
				})
			]
		}), action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		})]
	});
}
//#endregion
export { PageHeader as t };
