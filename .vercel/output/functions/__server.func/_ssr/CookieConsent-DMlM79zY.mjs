import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Settings, n as X, xt as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/CookieConsent-DMlM79zY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* CookieConsent — bottom banner with Accept/Reject/Customize options.
* Stores user preference in localStorage under "dot-cookie-consent".
* Shows only on first visit (or when cleared).
*/
var STORAGE_KEY = "dot-cookie-consent";
function saveConsent(prefs) {
	const value = {
		...prefs,
		decided: true
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {}
	return value;
}
function CookieConsent() {
	const [show, setShow] = (0, import_react.useState)(false);
	const [showCustomize, setShowCustomize] = (0, import_react.useState)(false);
	const [prefs, setPrefs] = (0, import_react.useState)({
		essential: true,
		analytics: false,
		marketing: false,
		preferences: true
	});
	(0, import_react.useEffect)(() => {
		try {
			if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
		} catch {
			setShow(true);
		}
	}, []);
	function acceptAll() {
		saveConsent({
			essential: true,
			analytics: true,
			marketing: true,
			preferences: true
		});
		setShow(false);
	}
	function rejectNonEssential() {
		saveConsent({
			essential: true,
			analytics: false,
			marketing: false,
			preferences: false
		});
		setShow(false);
	}
	function saveCustom() {
		saveConsent(prefs);
		setShow(false);
		setShowCustomize(false);
	}
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [!showCustomize && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-0 left-0 right-0 z-[100] border-t border-border/80 bg-card/95 shadow-elegant backdrop-blur-xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Cookie consent",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold text-sm",
						children: "We use cookies 🍪"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground leading-relaxed",
						children: "We use cookies to make DOT work better for you. You choose what you're comfortable with."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: rejectNonEssential,
						className: "shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors",
						"aria-label": "Reject non-essential and close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "hero",
						className: "w-full",
						onClick: acceptAll,
						children: "Accept all"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "flex-1",
							onClick: rejectNonEssential,
							children: "Reject non-essential"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setShowCustomize(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-3.5" }), "Customize"]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-[10px] text-muted-foreground text-center",
					children: [
						"Read our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/privacy",
							className: "text-primary hover:underline",
							children: "Privacy Policy"
						}),
						" ",
						"for more details."
					]
				})
			]
		})
	}), showCustomize && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[101] flex items-end justify-center sm:items-center sm:p-4",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Cookie preferences",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-background/60 backdrop-blur-sm",
			onClick: () => setShowCustomize(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-elegant",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Cookie preferences"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowCustomize(false),
						className: "text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4",
					children: [
						{
							key: "essential",
							label: "Essential",
							desc: "Required for the site to work — authentication, session management. Cannot be disabled.",
							locked: true
						},
						{
							key: "analytics",
							label: "Analytics",
							desc: "Help us understand how people use DOT so we can improve it. No personal data is sold.",
							locked: false
						},
						{
							key: "preferences",
							label: "Preferences",
							desc: "Remember your settings like dark/light mode between visits.",
							locked: false
						},
						{
							key: "marketing",
							label: "Marketing",
							desc: "Used to show you relevant content on other platforms. Off by default.",
							locked: false
						}
					].map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4 rounded-xl border border-border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-sm",
								children: cat.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-0.5 leading-relaxed",
								children: cat.desc
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: cat.locked,
							onClick: () => !cat.locked && setPrefs((p) => ({
								...p,
								[cat.key]: !p[cat.key]
							})),
							className: cn("relative shrink-0 h-5 w-9 rounded-full transition-all", prefs[cat.key] ? "bg-primary" : "bg-muted", cat.locked && "opacity-60 cursor-not-allowed"),
							"aria-pressed": prefs[cat.key],
							"aria-label": `Toggle ${cat.label} cookies`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", prefs[cat.key] ? "left-4" : "left-0.5") })
						})]
					}, cat.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1",
						onClick: rejectNonEssential,
						children: "Reject all optional"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						className: "flex-1",
						onClick: saveCustom,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Save preferences"]
					})]
				})
			]
		})]
	})] });
}
/** Small link to re-open cookie preferences (use in footer) */
function CookieSettingsLink({ className }) {
	function open() {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		window.location.reload();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: open,
		className,
		children: "Cookie Settings"
	});
}
//#endregion
export { CookieSettingsLink as n, CookieConsent as t };
