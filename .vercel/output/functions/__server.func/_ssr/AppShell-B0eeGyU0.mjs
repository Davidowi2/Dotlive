import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { _ as useNavigate, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Settings, Dt as Building2, E as Search, Et as CalendarCheck, G as LogOut, Mt as Bell, Nt as Award, Ot as Briefcase, Q as Hammer, Y as LayoutDashboard, b as Shield, c as Trophy, i as Users, jt as BookOpen, nt as Gauge, q as LoaderCircle, r as Wallet } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-C-2KEfEk.mjs";
import { t as ThemeToggle } from "./ThemeToggle-8k5XJEto.mjs";
import { o as ROLE_LABELS } from "./constants-DV8g_Ppd.mjs";
import { n as useAuth, t as supabase } from "./use-auth-BzqVsto_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-B0eeGyU0.js
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
	const { profile, roles, primaryRole, loading, user } = useAuth();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	(0, import_react.useEffect)(() => {
		if (!loading && user && roles.length === 0) navigate({ to: "/onboarding" });
	}, [
		loading,
		user,
		roles,
		navigate
	]);
	async function handleSignOut() {
		await supabase.auth.signOut();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-primary" })
	});
	const items = NAV_ITEMS.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
	const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-muted/30",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden text-sm text-muted-foreground sm:inline",
								children: primaryRole ? ROLE_LABELS[primaryRole] : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-9 items-center justify-center rounded-full [background-image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground",
								children: initial
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSignOut,
								className: "flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
								"aria-label": "Sign out",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" })
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hidden w-56 shrink-0 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "sticky top-20 space-y-1",
						children: items.map((item) => {
							const active = pathname === item.to;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", active ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]" : "text-muted-foreground hover:bg-accent hover:text-foreground border-l-2 border-transparent pl-[10px]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground") }), item.label]
							}, item.to);
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "min-w-0 flex-1",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "sticky bottom-0 z-40 flex items-center justify-around border-t border-border/60 bg-background/90 px-2 py-1 backdrop-blur-xl lg:hidden",
				children: items.slice(0, 5).map((item) => {
					const active = pathname === item.to;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-5", active && "text-primary") }),
							item.label,
							active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1 rounded-full bg-primary" })
						]
					}, item.to);
				})
			})
		]
	});
}
//#endregion
export { AppShell as t };
