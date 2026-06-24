import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { Nt as Award, _ as Star, ct as Download, st as ExternalLink } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/certificates-DQ6j0GVJ.js
var import_jsx_runtime = require_jsx_runtime();
var MOCK_CERTS = [
	{
		id: "1",
		title: "LEAPFROG Founder Foundations",
		course: "DOT Academy",
		issued: "Jun 15, 2026",
		dotEarned: 500,
		level: "Foundations"
	},
	{
		id: "2",
		title: "Venture Design Thinking",
		course: "DOT Academy",
		issued: "Jun 10, 2026",
		dotEarned: 750,
		level: "Intermediate"
	},
	{
		id: "3",
		title: "Customer Discovery Mastery",
		course: "DOT Academy",
		issued: "May 28, 2026",
		dotEarned: 1e3,
		level: "Advanced"
	}
];
function CertificatesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Certificates",
		subtitle: "Your earned credentials from DOT Academy.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "secondary",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "mr-1 size-3" }),
				MOCK_CERTS.length,
				" earned"
			]
		})
	}), MOCK_CERTS.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Award,
		title: "No certificates yet",
		description: "Complete Academy courses to earn DOT credentials."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: MOCK_CERTS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col rounded-2xl border border-border bg-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-12 items-center justify-center rounded-xl [background-image:var(--gradient-gold)] text-gold-foreground shadow-soft",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "size-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: c.level
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-4 font-display text-base font-semibold leading-snug",
					children: c.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: c.course
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Issued ", c.issued] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 text-gold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-current" }),
							" +",
							c.dotEarned,
							" DOT"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), " View"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), " Download"]
					})]
				})
			]
		}, c.id))
	})] });
}
//#endregion
export { CertificatesPage as component };
