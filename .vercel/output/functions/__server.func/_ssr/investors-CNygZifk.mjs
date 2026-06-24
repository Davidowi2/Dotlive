import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageShell, t as FeatureGrid } from "./PageShell-BBxBkDJx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/investors-CNygZifk.js
var import_jsx_runtime = require_jsx_runtime();
var features = [
	{
		title: "Venture discovery",
		desc: "Browse ventures with filters, search, Vantage sorting and saved lists."
	},
	{
		title: "Vantage reports",
		desc: "Review fundability, investment readiness and venture health for every opportunity."
	},
	{
		title: "Meeting requests",
		desc: "Request meetings with founders directly through DOT Demo."
	},
	{
		title: "Capital partner dashboard",
		desc: "Track commitments, pipeline, Demo participation and portfolio."
	},
	{
		title: "Built for every category",
		desc: "VCs, Angels, DFIs, Banks, Corporates and Family Offices."
	},
	{
		title: "Pilot funding",
		desc: "100 Runway Ventures × $1,000 and 10 Pre-Seed Ventures × $10,000 — a $200,000 target."
	}
];
function InvestorsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "Investors",
		title: "Discover and fund Africa's most ready ventures",
		intro: "DOT Demo connects capital partners with fundable ventures, ranked and verified by Vantage intelligence.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureGrid, { items: features })
	});
}
//#endregion
export { InvestorsPage as component };
