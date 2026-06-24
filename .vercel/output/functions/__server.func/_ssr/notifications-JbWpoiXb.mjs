import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { At as BookOpen, _t as CircleCheck, c as Trophy, i as Users, r as Wallet, tt as Gauge } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-JbWpoiXb.js
var import_jsx_runtime = require_jsx_runtime();
var MOCK_NOTIFS = [
	{
		id: "1",
		icon: Gauge,
		title: "Vantage score updated",
		body: "Your new Vantage Point is 720/1000 — up 42 points.",
		time: "2h ago",
		read: false,
		accent: "text-primary"
	},
	{
		id: "2",
		icon: Wallet,
		title: "Wallet funded",
		body: "₦30,000 deposited — 2,000 DOT added to your wallet.",
		time: "5h ago",
		read: false,
		accent: "text-primary"
	},
	{
		id: "3",
		icon: Trophy,
		title: "Pitchathon result",
		body: "Lagos Startup Battle: You ranked #3 with an average score of 8.4.",
		time: "1d ago",
		read: false,
		accent: "text-gold"
	},
	{
		id: "4",
		icon: Users,
		title: "New community member",
		body: "Kwame Asante joined Lagos Builders via your referral link.",
		time: "2d ago",
		read: true,
		accent: "text-primary"
	},
	{
		id: "5",
		icon: BookOpen,
		title: "Course completed",
		body: "Venture Design Thinking marked complete. +750 DOT earned.",
		time: "3d ago",
		read: true,
		accent: "text-gold"
	},
	{
		id: "6",
		icon: Gauge,
		title: "Meeting request accepted",
		body: "Fatima Al-Rashid from DFI Ventures accepted your meeting request.",
		time: "4d ago",
		read: true,
		accent: "text-primary"
	}
];
function NotificationsPage() {
	const unread = MOCK_NOTIFS.filter((n) => !n.read).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Notifications",
		subtitle: `${unread} unread`,
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Mark all read"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 overflow-hidden rounded-2xl border border-border bg-card",
		children: MOCK_NOTIFS.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex items-start gap-4 p-4 transition-colors", i < MOCK_NOTIFS.length - 1 && "border-b border-border", !n.read && "bg-primary/5"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted", n.accent),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(n.icon, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("text-sm font-medium", !n.read && "text-foreground"),
							children: n.title
						}), !n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 shrink-0 rounded-full bg-primary" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-sm text-muted-foreground",
						children: n.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: n.time
					})
				]
			})]
		}, n.id))
	})] });
}
//#endregion
export { NotificationsPage as component };
