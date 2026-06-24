import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { Dt as Briefcase, K as LoaderCircle, O as Rocket, Pt as ArrowRight, Z as Hammer, i as Users, xt as Check } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-DjsaxNDC.mjs";
import { t as ThemeToggle } from "./ThemeToggle-8k5XJEto.mjs";
import { n as INDUSTRIES, t as AFRICAN_COUNTRIES } from "./constants-DV8g_Ppd.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as useAuth } from "./use-auth-DnlQb86O.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BYsjabzv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-DXIXJI3-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ROLE_OPTIONS = [
	{
		role: "builder",
		title: "Builder",
		desc: "Offer skills, earn DOT, and access the marketplace. Your default starting role on DOT.",
		icon: Hammer,
		badge: "Default",
		free: true
	},
	{
		role: "founder",
		title: "Founder",
		desc: "I'm building a venture and want to progress, learn and raise.",
		icon: Rocket
	},
	{
		role: "community_leader",
		title: "Community Leader",
		desc: "I run a community and want to onboard and track founders.",
		icon: Users
	},
	{
		role: "investor",
		title: "Investor",
		desc: "I want to discover and back African ventures.",
		icon: Briefcase
	}
];
function Onboarding() {
	const navigate = useNavigate();
	const { user, roles, profile, loading, refresh } = useAuth();
	const [step, setStep] = (0, import_react.useState)(1);
	const [role, setRole] = (0, import_react.useState)("builder");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [ventureName, setVentureName] = (0, import_react.useState)("");
	const [industry, setIndustry] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!loading && roles.length > 0) navigate({ to: "/dashboard" });
	}, [
		loading,
		roles,
		navigate
	]);
	async function selectRole(r) {
		setRole(r);
		if (r === "founder") setStep(2);
		else await saveRole(r);
	}
	async function saveRole(r, founderData) {
		if (!user) return;
		setBusy(true);
		try {
			const { error: roleErr } = await supabase.from("user_roles").insert({
				user_id: user.id,
				role: r
			});
			if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
			if (r === "founder" && founderData) {
				const { error: fpErr } = await supabase.from("founder_profiles").upsert({
					user_id: user.id,
					venture_name: founderData.ventureName,
					industry: founderData.industry,
					country: founderData.country,
					bio: founderData.bio,
					stage: "Assess"
				});
				if (fpErr) throw fpErr;
			}
			await refresh();
			toast.success("Welcome to DOT!");
			navigate({ to: "/dashboard" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not complete setup");
			setBusy(false);
		}
	}
	async function handleFounderSubmit(e) {
		e.preventDefault();
		await saveRole("founder", {
			ventureName,
			industry,
			country,
			bio
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-muted/30",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border/60 bg-background/80",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-16 max-w-3xl items-center justify-between px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10",
			children: step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-bold",
					children: "What are you joining as?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-muted-foreground",
					children: [profile?.name ? `Welcome, ${profile.name.split(" ")[0]}. ` : "", "Pick the role that fits you best."]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-4",
				children: ROLE_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => selectRole(opt.role),
					disabled: busy,
					className: cn("flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-md disabled:opacity-60", role === opt.role && "border-primary ring-2 ring-primary/20"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(opt.icon, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-lg font-semibold",
								children: opt.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm text-muted-foreground",
								children: opt.desc
							})]
						}),
						busy && role === opt.role ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 text-muted-foreground" })
					]
				}, opt.role))
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), " Founder"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 font-display text-3xl font-bold",
						children: "Tell us about your venture"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted-foreground",
						children: "You can refine this anytime."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleFounderSubmit,
				className: "mx-auto mt-8 max-w-lg space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "venture",
							children: "Venture name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "venture",
							required: true,
							value: ventureName,
							onChange: (e) => setVentureName(e.target.value),
							placeholder: "FarmLink Africa"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Industry" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: industry,
								onValueChange: setIndustry,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: INDUSTRIES.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: i,
									children: i
								}, i)) })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Country" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: country,
								onValueChange: setCountry,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: AFRICAN_COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c,
									children: c
								}, c)) })]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "bio",
							children: "Short bio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "bio",
							value: bio,
							onChange: (e) => setBio(e.target.value),
							placeholder: "What does your venture do?",
							rows: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setStep(1),
							disabled: busy,
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							variant: "hero",
							className: "flex-1",
							disabled: busy,
							children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Enter DOT"]
						})]
					})
				]
			})] })
		})]
	});
}
//#endregion
export { Onboarding as component };
