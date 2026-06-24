import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { D as Save, et as Globe, q as LoaderCircle, wt as Camera } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { n as INDUSTRIES, t as AFRICAN_COUNTRIES } from "./constants-DV8g_Ppd.mjs";
import { t as supabase } from "./use-auth-BzqVsto_.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
import { r as useFounderProfile } from "./use-dot-data-nzOTE_4W.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BYsjabzv.mjs";
import { n as uploadImage } from "./upload-rCpE3Cez.mjs";
import { t as Separator } from "./separator-0IqrQWSH.mjs";
import { n as updateProfile } from "./users-BbtXgb_n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-m2_DxYJX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfileEditPage() {
	const { user, refresh } = useDotAuth();
	const { data: founder, isLoading: founderLoading } = useFounderProfile();
	const qc = useQueryClient();
	const isFounder = (user?.roles ?? []).includes("founder");
	const [name, setName] = (0, import_react.useState)("");
	const [ventureName, setVentureName] = (0, import_react.useState)("");
	const [industry, setIndustry] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [website, setWebsite] = (0, import_react.useState)("");
	const [fundingGoal, setFundingGoal] = (0, import_react.useState)("");
	const [avatarFile, setAvatarFile] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (user) setName(user.name ?? "");
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (founder) {
			setVentureName(founder.venture_name ?? "");
			setIndustry(founder.industry ?? "");
			setCountry(founder.country ?? "");
			setBio(founder.bio ?? "");
			setWebsite(founder.website ?? "");
			setFundingGoal(founder.funding_goal ? String(founder.funding_goal) : "");
		}
	}, [founder]);
	async function handleSave(e) {
		e.preventDefault();
		if (!user) return;
		setBusy(true);
		try {
			let avatarUrl;
			if (avatarFile) avatarUrl = await uploadImage(avatarFile, "avatars");
			await updateProfile({
				name: name.trim() || void 0,
				avatarUrl
			});
			if (isFounder) {
				const { error: fpErr } = await supabase.from("founder_profiles").update({
					venture_name: ventureName.trim() || null,
					industry: industry || null,
					country: country || null,
					bio: bio.trim() || null,
					website: website.trim() || null,
					funding_goal: fundingGoal ? Number(fundingGoal) : 0
				}).eq("user_id", user.id);
				if (fpErr) throw fpErr;
			}
			await refresh();
			qc.invalidateQueries({ queryKey: ["founder_profile", user.id] });
			toast.success("Profile updated.");
		} catch (err) {
			const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save profile";
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	}
	if (founderLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.Header, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
		count: 2,
		cols: 2
	})] });
	const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
	const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : user?.avatarUrl ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Edit Profile",
		subtitle: "Update your personal information and venture details.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "hero",
			onClick: handleSave,
			disabled: busy,
			children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Save changes"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleSave,
		className: "mt-8 grid gap-8 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					htmlFor: "avatar-upload",
					className: "relative cursor-pointer",
					children: [
						avatarPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarPreview,
							alt: "Avatar",
							className: "size-24 rounded-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-24 items-center justify-center rounded-full [background-image:var(--gradient-primary)] font-display text-3xl font-bold text-primary-foreground",
							children: initial
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3.5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "avatar-upload",
							type: "file",
							accept: "image/*",
							className: "sr-only",
							onChange: (e) => setAvatarFile(e.target.files?.[0] ?? null)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display font-semibold",
						children: user?.name || "—"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: user?.email
					})]
				}),
				avatarFile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-primary",
					children: [avatarFile.name, " — will upload on save"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6 lg:col-span-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Personal info"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid gap-4 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "name",
									children: "Full name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "name",
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Amara Okafor"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "email",
										children: "Email"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										value: user?.email ?? "",
										disabled: true,
										className: "opacity-60"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Email cannot be changed here"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "DOT ID" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: user?.dotId ?? "",
									disabled: true,
									className: "font-mono opacity-60"
								})]
							})
						]
					})]
				}),
				isFounder && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Venture info"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "venture",
									children: "Venture name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "venture",
									value: ventureName,
									onChange: (e) => setVentureName(e.target.value),
									placeholder: "PayAfrika"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Industry" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: industry,
										onValueChange: setIndustry,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select industry" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: INDUSTRIES.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: i,
											children: i
										}, i)) })]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Country" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: country,
										onValueChange: setCountry,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select country" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: AFRICAN_COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c,
											children: c
										}, c)) })]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "website",
									children: "Website"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "website",
										className: "pl-9",
										value: website,
										onChange: (e) => setWebsite(e.target.value),
										placeholder: "yourventure.io"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "bio",
									children: "Bio"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "bio",
									rows: 3,
									value: bio,
									onChange: (e) => setBio(e.target.value),
									placeholder: "What does your venture do?",
									maxLength: 500
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "goal",
									children: "Funding goal (₦)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "goal",
									type: "number",
									value: fundingGoal,
									onChange: (e) => setFundingGoal(e.target.value),
									placeholder: "5000000"
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						variant: "hero",
						disabled: busy,
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Save changes"]
					})
				})
			]
		})]
	})] });
}
//#endregion
export { ProfileEditPage as component };
