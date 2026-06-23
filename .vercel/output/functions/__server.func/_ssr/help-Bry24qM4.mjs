import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { B as MessageSquare, W as Mail, _t as CircleQuestionMark, jt as BookOpen, xt as ChevronDown, yt as ChevronUp } from "../_libs/lucide-react.mjs";
import { n as PageShell } from "./PageShell-ByepecKB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-Bry24qM4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FAQS = [
	{
		q: "What is the Vantage Point?",
		a: "Vantage Point is DOT's 0–1000 score measuring your venture's quality across 9 dimensions: Founder, Problem, Market, Validation, Product, Team, Revenue, Scalability, and Investment Readiness. Higher scores unlock better visibility and investor access."
	},
	{
		q: "How do I deposit DOT?",
		a: "Go to Wallet → Deposit DOT. We use Paystack for secure Naira payments. Minimum deposit is 2,000 DOT (₦30,000). Your wallet is credited instantly after payment verification."
	},
	{
		q: "How do I join a community?",
		a: "Ask your community leader for their referral link (format: dot.africa/join/CODE) or scan their QR code. You'll be added automatically after clicking the link while signed in."
	},
	{
		q: "How are pitchathon scores calculated?",
		a: "Each judge scores your application from 1–10. Your leaderboard position is based on the average score across all judges assigned to that pitchathon."
	},
	{
		q: "Can I have multiple roles?",
		a: "Currently DOT supports one primary role per account. You can be a Founder, Community Leader, or Investor. Contact support if you need to change your role."
	},
	{
		q: "How do I earn DOT?",
		a: "Complete Academy courses to earn DOT rewards. Each course has a fixed reward set by admins. You can also receive DOT via transfers from other users or admin credits."
	},
	{
		q: "Is my data safe?",
		a: "Yes. DOT uses Supabase with Row Level Security — every piece of data is scoped to your account. Payments are handled by Paystack and we never store card details."
	}
];
var CATEGORIES = [
	{
		icon: BookOpen,
		title: "Academy & Learning",
		desc: "Courses, completion, and DOT rewards"
	},
	{
		icon: MessageSquare,
		title: "Pitchathons",
		desc: "Applications, scoring, and leaderboards"
	},
	{
		icon: CircleQuestionMark,
		title: "Wallet & Payments",
		desc: "Deposits, transfers, and transaction history"
	},
	{
		icon: Mail,
		title: "Account & Profile",
		desc: "Roles, settings, and verification"
	}
];
function HelpPage() {
	const [open, setOpen] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "Help & Support",
		title: "How can we help?",
		intro: "Find answers, browse guides, or reach out to the DOT team.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c.icon, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display font-semibold",
							children: c.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-sm text-muted-foreground",
							children: c.desc
						})] })]
					}, c.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Frequently asked questions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 space-y-2",
					children: FAQS.map((faq, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setOpen(open === i ? null : i),
							className: "flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-accent/50 transition-colors",
							children: [faq.q, open === i ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted-foreground" })]
						}), open === i && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border px-5 py-4 text-sm text-muted-foreground",
							children: faq.a
						})]
					}, i))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-border bg-card p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "mx-auto size-8 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-3 font-display text-lg font-semibold",
							children: "Still need help?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Our team is here for you. Reach us at support@dot.africa"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "hero",
							className: "mt-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "mailto:support@dot.africa",
								children: "Email support"
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
export { HelpPage as component };
