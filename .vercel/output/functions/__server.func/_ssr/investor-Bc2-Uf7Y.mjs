import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { kt as Bookmark, rt as Funnel } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { n as INDUSTRIES, r as JOURNEY_STAGES } from "./constants-DV8g_Ppd.mjs";
import { n as useAuth, t as supabase } from "./use-auth-BzqVsto_.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as FounderCard } from "./demo-BNUscTyh.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BYsjabzv.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/investor-Bc2-Uf7Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
function InvestorPage() {
	const { user } = useAuth();
	const qc = useQueryClient();
	const [industry, setIndustry] = (0, import_react.useState)("all");
	const [stage, setStage] = (0, import_react.useState)("all");
	const [minVantage, setMinVantage] = (0, import_react.useState)(0);
	const [savedOnly, setSavedOnly] = (0, import_react.useState)(false);
	const { data: ventures = [], isLoading } = useQuery({
		queryKey: ["showcase"],
		queryFn: async () => {
			const { data, error } = await supabase.from("founder_profiles").select("user_id, venture_name, industry, stage, country, bio, funding_goal, vantage_point, fundability").not("venture_name", "is", null).order("vantage_point", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: saves = [] } = useQuery({
		queryKey: ["investor-saves", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("investor_saves").select("founder_id").eq("investor_id", user.id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const saved = new Set(saves.map((s) => s.founder_id));
	const filtered = (0, import_react.useMemo)(() => ventures.filter((v) => {
		if (industry !== "all" && v.industry !== industry) return false;
		if (stage !== "all" && v.stage !== stage) return false;
		if ((v.vantage_point ?? 0) < minVantage) return false;
		if (savedOnly && !saved.has(v.user_id)) return false;
		return true;
	}), [
		ventures,
		industry,
		stage,
		minVantage,
		savedOnly,
		saved
	]);
	async function toggleSave(founderId) {
		if (!user) return;
		try {
			if (saved.has(founderId)) await supabase.from("investor_saves").delete().eq("investor_id", user.id).eq("founder_id", founderId);
			else await supabase.from("investor_saves").insert({
				investor_id: user.id,
				founder_id: founderId
			});
			qc.invalidateQueries({ queryKey: ["investor-saves", user.id] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update");
		}
	}
	async function requestMeeting(founderId) {
		if (!user) return;
		try {
			const { error } = await supabase.from("meeting_requests").insert({
				investor_id: user.id,
				founder_id: founderId,
				message: "I'd like to learn more about your venture."
			});
			if (error) throw error;
			toast.success("Meeting request sent!");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not send request");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Investor Portal",
			subtitle: "Discover and connect with vetted African ventures."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 rounded-2xl border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-sm font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-4 text-primary" }), " Filters"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs text-muted-foreground",
						children: "Industry"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: industry,
						onValueChange: setIndustry,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "mt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All industries"
						}), INDUSTRIES.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: i,
							children: i
						}, i))] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs text-muted-foreground",
						children: "Stage"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: stage,
						onValueChange: setStage,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "mt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All stages"
						}), JOURNEY_STAGES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: s,
							children: s
						}, s))] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted-foreground",
						children: ["Min Vantage: ", minVantage]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						className: "mt-3",
						value: [minVantage],
						onValueChange: ([v]) => setMinVantage(v),
						max: 1e3,
						step: 50
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSavedOnly((s) => !s),
							className: `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${savedOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-4" }), " Saved only"]
						})
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex items-center justify-between",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
				variant: "secondary",
				children: [filtered.length, " ventures"]
			})
		}),
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
			count: 6,
			cols: 3
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: filtered.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FounderCard, {
				v,
				isInvestor: true,
				isSaved: saved.has(v.user_id),
				isSelf: v.user_id === user?.id,
				onSave: () => toggleSave(v.user_id),
				onMeet: () => requestMeeting(v.user_id)
			}, v.user_id))
		})
	] });
}
//#endregion
export { InvestorPage as component };
