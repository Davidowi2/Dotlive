import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageShell } from "./PageShell-CZmK0bBA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journey-SIB46M4n.js
var import_jsx_runtime = require_jsx_runtime();
var stages = [
	{
		n: "01",
		label: "Assess",
		desc: "Complete Vantage to measure venture quality, founder readiness, market strength and fundability."
	},
	{
		n: "02",
		label: "Learn",
		desc: "Follow Academy tracks — LEAPFROG, Venture Design, Customer Discovery and more — powered by Whop."
	},
	{
		n: "03",
		label: "Improve",
		desc: "Act on AI Venture Advisor recommendations to close gaps and raise your score."
	},
	{
		n: "04",
		label: "Validate",
		desc: "Prove demand, traction and product readiness with real market evidence."
	},
	{
		n: "05",
		label: "Pitch",
		desc: "Enter Pitchathons, get evaluated by judges and climb the leaderboard."
	},
	{
		n: "06",
		label: "Fund",
		desc: "Surface on DOT Demo where capital partners discover and meet fundable ventures."
	},
	{
		n: "07",
		label: "Scale",
		desc: "Grow with community distribution, sessions and continuous reassessment."
	}
];
function JourneyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "The Journey",
		title: "From idea to funded, in seven measurable stages",
		intro: "Every founder follows the same progression — and DOT measures movement at every step.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "relative space-y-6 border-l border-border pl-8",
			children: stages.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute -left-[42px] flex size-8 items-center justify-center rounded-full [background-image:var(--gradient-primary)] text-xs font-bold text-primary-foreground",
					children: s.n
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-xl font-semibold",
						children: s.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: s.desc
					})]
				})]
			}, s.n))
		})
	});
}
//#endregion
export { JourneyPage as component };
