import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/EmptyState-CROwJFsv.js
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
		className: cn("flex flex-col items-center gap-2 py-10 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-6 text-muted-foreground/50" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-light text-muted-foreground",
				children: title
			}),
			description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xs text-xs text-muted-foreground/70 font-light",
				children: description
			}),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: action
			})
		]
	});
	if (variant === "full-page") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-1 flex-col items-center justify-center gap-5 py-20 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-14 items-center justify-center rounded-sm border border-border bg-muted/30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-6 text-muted-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-light tracking-tight",
					children: title
				}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground font-light",
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
		className: cn("mt-6 flex flex-col items-center gap-4 border border-dashed border-border bg-card px-6 py-14 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-10 items-center justify-center rounded-sm bg-muted/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-muted-foreground/60" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-sm font-light text-foreground",
				children: title
			}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-xs text-xs text-muted-foreground font-light",
				children: description
			})] }),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: action
			})
		]
	});
}
//#endregion
export { EmptyState as t };
