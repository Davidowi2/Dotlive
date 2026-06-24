import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { E as Search, Et as Building2, H as MapPin, i as Users, tt as Gauge, u as TrendingUp } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { t as EmptyState } from "./EmptyState-CROwJFsv.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BRvB6XYo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/discover-72vDAI0A.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VENTURES = [
	{
		id: "1",
		name: "PayAfrika",
		founder: "Amara Okafor",
		location: "Lagos",
		industry: "Fintech",
		vantage: 720,
		stage: "Validate"
	},
	{
		id: "2",
		name: "AgriConnect",
		founder: "Oghenetega Efe",
		location: "Abuja",
		industry: "Agriculture",
		vantage: 680,
		stage: "Improve"
	},
	{
		id: "3",
		name: "MamaList",
		founder: "Chisom Nwosu",
		location: "Enugu",
		industry: "Commerce",
		vantage: 650,
		stage: "Assess"
	},
	{
		id: "4",
		name: "KoboPay",
		founder: "Kwame Asante",
		location: "Accra",
		industry: "Fintech",
		vantage: 810,
		stage: "Fund"
	},
	{
		id: "5",
		name: "HealthBridge",
		founder: "Fatima Diallo",
		location: "Nairobi",
		industry: "Health",
		vantage: 590,
		stage: "Learn"
	},
	{
		id: "6",
		name: "SolarGrid Africa",
		founder: "Tendai Moyo",
		location: "Cape Town",
		industry: "Energy",
		vantage: 740,
		stage: "Scale"
	}
];
var COMMUNITIES = [
	{
		id: "1",
		name: "Lagos Builders",
		leader: "Bola Adeyemi",
		members: 48,
		region: "Lagos, Nigeria"
	},
	{
		id: "2",
		name: "Nairobi Tech Founders",
		leader: "Grace Wanjiku",
		members: 62,
		region: "Nairobi, Kenya"
	},
	{
		id: "3",
		name: "Accra Startup Hub",
		leader: "Kwesi Mensah",
		members: 35,
		region: "Accra, Ghana"
	}
];
function DiscoverPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const filteredVentures = VENTURES.filter((v) => !query || v.name.toLowerCase().includes(query.toLowerCase()) || v.founder.toLowerCase().includes(query.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Discover",
			subtitle: "Search ventures, communities, and opportunities across the DOT network."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "Search ventures, founders, communities…",
				className: "h-12 pl-12 text-base",
				value: query,
				onChange: (e) => setQuery(e.target.value)
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "ventures",
			className: "mt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
					value: "ventures",
					children: [
						"Ventures (",
						filteredVentures.length,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
					value: "communities",
					children: [
						"Communities (",
						COMMUNITIES.length,
						")"
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "ventures",
					className: "mt-4",
					children: filteredVentures.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: Building2,
						title: "No ventures found",
						description: "Try a different search term."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: filteredVentures.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col rounded-2xl border border-border bg-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3 text-primary" }),
											" ",
											v.vantage
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-3 font-display text-base font-semibold",
									children: v.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: v.founder
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex flex-wrap gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											children: v.industry
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											children: v.stage
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-0.5 text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), v.location]
										})
									]
								})
							]
						}, v.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "communities",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: COMMUNITIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col rounded-2xl border border-border bg-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-3 font-display text-base font-semibold",
									children: c.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: c.leader
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center gap-3 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3" }),
											c.members,
											" members"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), c.region]
									})]
								})
							]
						}, c.id))
					})
				})
			]
		})
	] });
}
//#endregion
export { DiscoverPage as component };
