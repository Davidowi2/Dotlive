import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageShell, t as FeatureGrid } from "./PageShell-ByepecKB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/communities-DVGVUDIv.js
var import_jsx_runtime = require_jsx_runtime();
var features = [
	{
		title: "Unique referral links",
		desc: "Each community gets a link like dot.africa/community/name to track visits, signups and activated founders."
	},
	{
		title: "Community dashboards",
		desc: "Members, active members, Vantage completions, Academy progress, Pitchathon entries and Demo qualifiers."
	},
	{
		title: "Community Vantage",
		desc: "Average community score, fundable ventures and active builders — with cross-community ranking."
	},
	{
		title: "Leader rewards",
		desc: "Track referrals, engagement and completion rates and reward Community Leaders with DOT."
	},
	{
		title: "WhatsApp-first",
		desc: "Leaders connect WhatsApp groups and communities; DOT tracks engagement through platform activity."
	},
	{
		title: "100 communities pilot",
		desc: "100 founders per community, 100 Community Leaders — designed to scale to thousands."
	}
];
function CommunitiesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		eyebrow: "Community OS",
		title: "Community-led growth, measured end to end",
		intro: "Community Leaders recruit, activate and progress founders — and earn DOT for the value they create.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureGrid, { items: features })
	});
}
//#endregion
export { CommunitiesPage as component };
