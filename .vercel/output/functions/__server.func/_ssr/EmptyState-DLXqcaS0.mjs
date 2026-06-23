import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/EmptyState-DLXqcaS0.js
var import_jsx_runtime = require_jsx_runtime();
/**
* EmptyState
*
* Standardised empty/zero-data state for all authenticated pages.
* Replaces 9+ different hand-rolled empty state implementations.
*
* Usage (card — default):
*   <EmptyState
*     icon={BookOpen}
*     title="No courses yet"
*     description="Check back soon — new learning tracks are being added."
*   />
*
* Usage (inline — inside a card):
*   <EmptyState
*     variant="inline"
*     icon={Users}
*     title="No members yet"
*     description="Share your referral link to onboard founders."
*   />
*
* Usage (full-page — first-time experience):
*   <EmptyState
*     variant="full-page"
*     icon={Gauge}
*     title="Take your first Vantage"
*     description="Answer 19 questions and unlock your venture report."
*     action={<Button variant="hero" onClick={start}>Start now</Button>}
*   />
*/
function EmptyState({ icon: Icon, title, description, action, variant = "card", className }) {
	if (variant === "inline") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center gap-2 py-8 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-7 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-muted-foreground",
				children: title
			}),
			description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xs text-xs text-muted-foreground",
				children: description
			}),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: action
			})
		]
	});
	if (variant === "full-page") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-16 items-center justify-center rounded-2xl\r\n                     [background-image:var(--gradient-primary)] text-primary-foreground\r\n                     shadow-glow",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-8" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: title
				}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: description
				})]
			}),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed", "border-border bg-card px-6 py-12 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-12 items-center justify-center rounded-xl bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-6 text-muted-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-sm font-semibold text-foreground",
				children: title
			}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-xs text-sm text-muted-foreground",
				children: description
			})] }),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: action
			})
		]
	});
}
//#endregion
export { EmptyState as t };
