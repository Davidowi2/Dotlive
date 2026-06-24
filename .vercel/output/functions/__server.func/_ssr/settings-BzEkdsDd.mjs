import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Globe, N as Palette, U as Mail, W as LogOut, b as Shield, f as Trash2, jt as Bell } from "../_libs/lucide-react.mjs";
import { t as ThemeToggle } from "./ThemeToggle-8k5XJEto.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Separator } from "./separator-0IqrQWSH.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BzEkdsDd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
function SettingsPage() {
	const { user, logout } = useDotAuth();
	const navigate = useNavigate();
	function handleSignOut() {
		logout();
		navigate({ to: "/auth" });
	}
	async function handlePasswordReset() {
		if (!user?.email) return;
		try {
			await dotApi.post("/api/auth/forgot-password", { email: user.email });
			toast.success("Password reset link sent to your email.");
		} catch {
			toast.error("Could not send reset link. Try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Settings",
		subtitle: "Manage your account preferences."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8 max-w-2xl space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				icon: Bell,
				title: "Notifications",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Meeting requests",
						sub: "Get notified when an investor requests a meeting",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: true })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Vantage updates",
						sub: "Score changes and assessment reminders",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: true })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Wallet activity",
						sub: "Deposits, transfers, and rewards",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: true })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Community activity",
						sub: "New members and milestones",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				icon: Palette,
				title: "Appearance",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Theme"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Switch between light and dark mode"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				icon: Shield,
				title: "Security",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "Change password",
					sub: "Send a password reset link to your email",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: handlePasswordReset,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-4" }), " Send reset link"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "Two-factor authentication",
					sub: "Extra security for your account",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "Coming soon"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				icon: Globe,
				title: "Account",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "Language",
					sub: "English (UK)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: "English"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "Currency display",
					sub: "Naira (₦)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: "NGN"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					className: "w-full justify-start text-muted-foreground",
					onClick: handleSignOut,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " Sign out"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					className: "w-full justify-start text-destructive hover:bg-destructive/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Delete account — contact support@dot.africa"]
				})]
			})
		]
	})] });
}
function Section({ icon: Icon, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-base font-semibold",
				children: title
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-5",
			children
		})]
	});
}
function Row({ label, sub, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-sm font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: sub
		})] }), children]
	});
}
//#endregion
export { SettingsPage as component };
