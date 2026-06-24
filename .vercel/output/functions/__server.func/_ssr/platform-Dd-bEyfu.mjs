import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageShell, t as FeatureGrid } from "./PageShell-BBxBkDJx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/platform-Dd-bEyfu.js
var import_jsx_runtime = require_jsx_runtime();
var pillars = [
	{
		title: "Vantage",
		desc: "Venture assessment and intelligence engine. A 0–1000 Vantage Point plus fundability and investment readiness scores with reports, benchmarking and reassessment."
	},
	{
		title: "DOT Academy",
		desc: "Founder learning progression powered by Whop. DOT handles access control, course tracking, scoring, rewards and eligibility — Whop handles content delivery."
	},
	{
		title: "Founder Sessions",
		desc: "Live access to entrepreneurs, investors, operators and experts. Event listings, DOT-based registration, attendance tracking and replays."
	},
	{
		title: "Pitchathons",
		desc: "Founder selection and evaluation. Applications, submissions, judge portals, scoring, rankings and leaderboards with configurable eligibility."
	},
	{
		title: "DOT Demo",
		desc: "Investor discovery and funding marketplace. Venture profiles, pitch decks, investor profiles, meeting requests and funding tracking."
	},
	{
		title: "Community OS",
		desc: "Community-led founder acquisition. Referral links, community dashboards, community Vantage scoring and DOT leader rewards."
	}
];
function PlatformPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "The Platform",
		title: "Six integrated pillars built for venture progression",
		intro: "DOT combines venture intelligence, education, access, competition, capital discovery and community-led distribution into a single network.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureGrid, { items: pillars })
	});
}
//#endregion
export { PlatformPage as component };
