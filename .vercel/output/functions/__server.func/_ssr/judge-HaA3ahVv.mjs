import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { _ as Star, _t as CircleCheck, c as Trophy, rt as FileText } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { t as EmptyState } from "./EmptyState-CROwJFsv.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/judge-HaA3ahVv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MOCK_APPLICATIONS = [
	{
		id: "1",
		venture: "PayAfrika",
		founder: "Amara Okafor",
		ask: "₦5,000,000",
		deck: true,
		scored: false,
		vantage: 720
	},
	{
		id: "2",
		venture: "AgriConnect",
		founder: "Oghenetega Efe",
		ask: "₦2,500,000",
		deck: true,
		scored: true,
		avgScore: 7.8,
		vantage: 680
	},
	{
		id: "3",
		venture: "KoboPay",
		founder: "Kwame Asante",
		ask: "₦10,000,000",
		deck: false,
		scored: false,
		vantage: 810
	},
	{
		id: "4",
		venture: "MamaList",
		founder: "Chisom Nwosu",
		ask: "₦1,500,000",
		deck: true,
		scored: true,
		avgScore: 8.4,
		vantage: 650
	}
];
function JudgePage() {
	const [scoring, setScoring] = (0, import_react.useState)(null);
	const [score, setScore] = (0, import_react.useState)(5);
	const [feedback, setFeedback] = (0, import_react.useState)("");
	const pending = MOCK_APPLICATIONS.filter((a) => !a.scored).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Judge Portal",
		subtitle: "Score pitchathon applications and help surface the best ventures.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "secondary",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "mr-1 size-3" }),
				pending,
				" to score"
			]
		})
	}), MOCK_APPLICATIONS.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Trophy,
		title: "No applications assigned",
		description: "You haven't been assigned as a judge for any pitchathons yet."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 space-y-4",
		children: MOCK_APPLICATIONS.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: app.venture
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: app.scored ? "default" : "secondary",
						children: app.scored ? `Scored ${app.avgScore}` : "Pending"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						app.founder,
						" · Raising ",
						app.ask,
						" · Vantage ",
						app.vantage
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [app.deck && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), " Pitch deck"]
					}), !app.scored && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						size: "sm",
						onClick: () => {
							setScoring(app.id);
							setScore(5);
							setFeedback("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-4" }), " Score"]
					})]
				})]
			}), scoring === app.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-xl border border-border bg-muted/30 p-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-sm font-medium",
						children: "Score (1–10)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 flex-wrap",
						children: [
							1,
							2,
							3,
							4,
							5,
							6,
							7,
							8,
							9,
							10
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setScore(n),
							className: cn("flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-all", score === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"),
							children: n
						}, n))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Feedback (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: feedback,
							onChange: (e) => setFeedback(e.target.value),
							placeholder: "What stood out? What needs work?",
							rows: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "hero",
							onClick: () => setScoring(null),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Submit score"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setScoring(null),
							children: "Cancel"
						})]
					})
				]
			})]
		}, app.id))
	})] });
}
//#endregion
export { JudgePage as component };
