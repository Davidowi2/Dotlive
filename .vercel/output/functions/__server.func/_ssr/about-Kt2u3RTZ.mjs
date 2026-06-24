import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Globe, Pt as ArrowRight, i as Users, p as Target, t as Zap } from "../_libs/lucide-react.mjs";
import { n as PageShell } from "./PageShell-CZmK0bBA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/about-Kt2u3RTZ.js
var import_jsx_runtime = require_jsx_runtime();
var VALUES = [
	{
		icon: Target,
		title: "Measurable progress",
		desc: "Every stage, score and milestone on DOT is quantified. We believe founders deserve clarity, not vague advice."
	},
	{
		icon: Users,
		title: "Community-led growth",
		desc: "Africa's builder communities are the distribution layer. DOT is infrastructure for them, not a replacement."
	},
	{
		icon: Zap,
		title: "Move fast, stay fundable",
		desc: "Speed matters. DOT compresses the journey from idea to investor-ready without cutting corners."
	},
	{
		icon: Globe,
		title: "Pan-African by design",
		desc: "Built for Lagos, Nairobi, Accra, Cape Town and everywhere in between — not adapted for Africa from elsewhere."
	}
];
var TEAM = [
	{
		name: "Amara Okafor",
		role: "Co-founder & CEO",
		location: "Lagos",
		initial: "A"
	},
	{
		name: "Kwame Asante",
		role: "Co-founder & CTO",
		location: "Accra",
		initial: "K"
	},
	{
		name: "Fatima Al-Rashid",
		role: "Head of Investor Relations",
		location: "Nairobi",
		initial: "F"
	}
];
function AboutPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "About DOT",
		title: "Building Africa's venture progression infrastructure",
		intro: "DOT is the operating system for African venture creation — combining intelligence, education, community and capital access into one measurable network.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold",
					children: "Our values"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-6 sm:grid-cols-2",
					children: VALUES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-4 rounded-2xl border border-border bg-card p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(v.icon, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display font-semibold",
							children: v.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: v.desc
						})] })]
					}, v.title))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold",
					children: "The team"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-3",
					children: TEAM.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-16 items-center justify-center rounded-full [background-image:var(--gradient-primary)] font-display text-2xl font-bold text-primary-foreground",
								children: t.initial
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-display font-semibold",
								children: t.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-primary",
								children: t.role
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: t.location
							})
						]
					}, t.name))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border [background-image:var(--gradient-primary)] p-8 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-bold text-primary-foreground",
							children: "Join the pilot"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-primary-foreground/80",
							children: "10,000 founders. 100 communities. $200K in capital. Starting now."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "gold",
							size: "lg",
							className: "mt-6",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/auth",
								children: ["Get started ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
export { AboutPage as component };
