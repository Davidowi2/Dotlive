import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { _ as useNavigate, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { At as BookOpen, C as Settings, Dt as Briefcase, E as Search, Et as Building2, J as LayoutDashboard, K as LoaderCircle, Mt as Award, Tt as CalendarCheck, W as LogOut, Z as Hammer, b as Shield, c as Trophy, i as Users, jt as Bell, r as Wallet, tt as Gauge } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-DjsaxNDC.mjs";
import { t as ThemeToggle } from "./ThemeToggle-8k5XJEto.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { o as ROLE_LABELS } from "./constants-DV8g_Ppd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-DCJ29O8P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV_ITEMS = [
	{
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard
	},
	{
		label: "Discover",
		to: "/discover",
		icon: Search
	},
	{
		label: "Vantage",
		to: "/vantage",
		icon: Gauge,
		roles: ["founder"]
	},
	{
		label: "Wallet",
		to: "/wallet",
		icon: Wallet
	},
	{
		label: "DOT Work",
		to: "/work",
		icon: Hammer
	},
	{
		label: "Academy",
		to: "/academy",
		icon: BookOpen,
		roles: ["founder"]
	},
	{
		label: "Sessions",
		to: "/sessions",
		icon: CalendarCheck
	},
	{
		label: "Pitchathons",
		to: "/pitchathons",
		icon: Trophy,
		roles: ["founder"]
	},
	{
		label: "DOT Demo",
		to: "/demo",
		icon: Building2
	},
	{
		label: "Community",
		to: "/community",
		icon: Users,
		roles: ["community_leader"]
	},
	{
		label: "Investor Portal",
		to: "/investor",
		icon: Briefcase,
		roles: ["investor"]
	},
	{
		label: "Judge Portal",
		to: "/judge",
		icon: Trophy,
		roles: ["investor", "admin"]
	},
	{
		label: "Meetings",
		to: "/meetings",
		icon: Bell,
		roles: ["investor", "founder"]
	},
	{
		label: "Certificates",
		to: "/certificates",
		icon: Award,
		roles: ["founder"]
	},
	{
		label: "Notifications",
		to: "/notifications",
		icon: Bell
	},
	{
		label: "Settings",
		to: "/settings",
		icon: Settings
	},
	{
		label: "Admin",
		to: "/admin",
		icon: Shield,
		roles: ["admin"]
	}
];
function AppShell({ children }) {
	const { user, roles, primaryRole, isLoading, logout } = useDotAuth();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	(0, import_react.useEffect)(() => {
		if (!isLoading && user && roles.length === 0) navigate({ to: "/onboarding" });
	}, [
		isLoading,
		user,
		roles,
		navigate
	]);
	function handleSignOut() {
		logout();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-muted-foreground" })
	});
	const items = NAV_ITEMS.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
	const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
							primaryRole && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden text-[10px] tracking-widest uppercase text-muted-foreground sm:inline",
								children: ROLE_LABELS[primaryRole] ?? primaryRole
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground",
								children: initial
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSignOut,
								className: "text-muted-foreground transition-colors hover:text-foreground",
								"aria-label": "Sign out",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" })
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 py-6 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hidden w-48 shrink-0 border-r border-border pr-6 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "sticky top-20 space-y-0",
						children: items.map((item) => {
							const active = pathname === item.to;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex items-center gap-2.5 py-2 text-sm transition-colors", active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground font-normal"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/50") }), item.label]
							}, item.to);
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "min-w-0 flex-1 lg:pl-8",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "sticky bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 px-2 py-1 backdrop-blur-xl lg:hidden",
				children: items.slice(0, 5).map((item) => {
					const active = pathname === item.to;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors", active ? "text-primary font-medium" : "text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-5", active && "text-primary") }), item.label]
					}, item.to);
				})
			})
		]
	});
}
//#endregion
export { AppShell as t };
