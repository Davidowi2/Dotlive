import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { $ as Globe, At as BookOpen, Et as Building2, H as MapPin, c as Trophy, p as Target, tt as Gauge, u as TrendingUp } from "../_libs/lucide-react.mjs";
import { n as SiteHeader, t as SiteFooter } from "./SiteFooter-D7ueBtYj.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/founder._id-sDr1fcQf.js
var import_jsx_runtime = require_jsx_runtime();
var MOCK = {
	name: "Amara Okafor",
	venture: "PayAfrika",
	bio: "Building Africa's first cross-border micro-payment infrastructure for gig workers and informal traders.",
	industry: "Fintech",
	country: "Lagos, Nigeria",
	stage: "Validate",
	vantage: 720,
	fundability: 68,
	investmentReadiness: 72,
	website: "payafrika.io",
	fundingGoal: "₦5,000,000",
	courses: [
		"LEAPFROG Foundations",
		"Venture Design Thinking",
		"Customer Discovery"
	],
	pitchathons: ["Lagos Startup Battle — #3", "West Africa Demo Day — Finalist"]
};
function PublicFounderProfile() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-6 sm:flex-row sm:items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-20 shrink-0 items-center justify-center rounded-2xl [background-image:var(--gradient-primary)] font-display text-3xl font-bold text-primary-foreground shadow-glow",
								children: MOCK.name.charAt(0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "font-display text-3xl font-bold",
										children: MOCK.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5" }), MOCK.venture]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), MOCK.country]
											}),
											MOCK.website && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `https://${MOCK.website}`,
												target: "_blank",
												rel: "noopener noreferrer",
												className: "flex items-center gap-1 text-primary hover:underline",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }), MOCK.website]
											})] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											children: MOCK.industry
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											children: MOCK.stage
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm text-muted-foreground max-w-xl",
										children: MOCK.bio
									}),
									MOCK.fundingGoal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-sm font-medium",
										children: ["Raising ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-primary",
											children: MOCK.fundingGoal
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "hero",
										size: "sm",
										className: "mt-4",
										children: "Request meeting"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid gap-4 sm:grid-cols-3",
							children: [
								{
									label: "Vantage Point",
									value: `${MOCK.vantage}`,
									sub: "/ 1000",
									icon: Gauge
								},
								{
									label: "Fundability",
									value: `${MOCK.fundability}%`,
									sub: "ready to raise",
									icon: TrendingUp
								},
								{
									label: "Investment Ready",
									value: `${MOCK.investmentReadiness}%`,
									sub: "score",
									icon: Target
								}
							].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border bg-card p-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted-foreground",
										children: s.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "size-4 text-primary" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 font-display text-3xl font-bold tabular",
									children: [s.value, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-1 text-sm font-normal text-muted-foreground",
										children: s.sub
									})]
								})]
							}, s.label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 grid gap-6 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "font-display font-semibold",
										children: [
											"Academy (",
											MOCK.courses.length,
											")"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-2",
									children: MOCK.courses.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-2 text-sm text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary shrink-0" }), c]
									}, c))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4 text-gold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "font-display font-semibold",
										children: [
											"Pitchathons (",
											MOCK.pitchathons.length,
											")"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-2",
									children: MOCK.pitchathons.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-2 text-sm text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-gold shrink-0" }), p]
									}, p))
								})]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { PublicFounderProfile as component };
