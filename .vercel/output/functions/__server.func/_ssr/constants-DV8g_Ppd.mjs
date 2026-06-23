//#region node_modules/.nitro/vite/services/ssr/assets/constants-DV8g_Ppd.js
var MIN_DEPOSIT_DOT = 2e3;
function dotToNaira(dot) {
	return Math.round(dot * 15);
}
function formatNaira(amount) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0
	}).format(amount);
}
function formatDot(dot) {
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(dot);
}
var JOURNEY_STAGES = [
	"Assess",
	"Learn",
	"Improve",
	"Validate",
	"Pitch",
	"Fund",
	"Scale"
];
var ROLE_LABELS = {
	founder: "Founder",
	builder: "Builder",
	vendor: "Vendor",
	community_leader: "Community Leader",
	investor: "Investor",
	capital_partner: "Capital Partner",
	admin: "Admin",
	super_admin: "Super Admin"
};
var INDUSTRIES = [
	"Agriculture",
	"Fintech",
	"Health",
	"Education",
	"Commerce",
	"Logistics",
	"Energy",
	"Media",
	"SaaS",
	"Other"
];
var WORK_CATEGORIES = [
	"Graphics",
	"Website/App Development",
	"Content",
	"Marketing",
	"AI Services",
	"Operations",
	"Sales",
	"Customer Support",
	"Design",
	"Finance"
];
var ORDER_STATUS_META = {
	in_progress: {
		label: "In progress",
		tone: "text-gold"
	},
	delivered: {
		label: "Delivered",
		tone: "text-primary"
	},
	completed: {
		label: "Completed",
		tone: "text-primary"
	},
	cancelled: {
		label: "Cancelled",
		tone: "text-destructive"
	}
};
var AFRICAN_COUNTRIES = [
	"Nigeria",
	"Ghana",
	"Kenya",
	"South Africa",
	"Egypt",
	"Rwanda",
	"Tanzania",
	"Uganda",
	"Senegal",
	"Côte d'Ivoire",
	"Ethiopia",
	"Other"
];
//#endregion
export { ORDER_STATUS_META as a, dotToNaira as c, MIN_DEPOSIT_DOT as i, formatDot as l, INDUSTRIES as n, ROLE_LABELS as o, JOURNEY_STAGES as r, WORK_CATEGORIES as s, AFRICAN_COUNTRIES as t, formatNaira as u };
