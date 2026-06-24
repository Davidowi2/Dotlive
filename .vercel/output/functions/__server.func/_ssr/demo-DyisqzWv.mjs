import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { At as BookmarkCheck, Dt as Building2, T as Send, U as MapPin, kt as Bookmark, nt as Gauge } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { n as useAuth, t as supabase } from "./use-auth-BzqVsto_.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/demo-DyisqzWv.js
var import_jsx_runtime = require_jsx_runtime();
function DemoPage() {
	const { user, roles } = useAuth();
	const qc = useQueryClient();
	const isInvestor = roles.includes("investor");
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
		enabled: !!user && isInvestor,
		queryFn: async () => {
			const { data, error } = await supabase.from("investor_saves").select("founder_id").eq("investor_id", user.id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const saved = new Set(saves.map((s) => s.founder_id));
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "DOT Demo",
		subtitle: isInvestor ? "Investable ventures, ranked by Vantage. Save and request meetings." : "Investable ventures, ranked by Vantage. Boost your Vantage to rank higher."
	}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
		count: 6,
		cols: 3
	}) : ventures.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Building2,
		title: "No ventures listed yet",
		description: "Founders with completed Vantage assessments will appear here."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: ventures.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FounderCard, {
			v,
			isInvestor,
			isSaved: saved.has(v.user_id),
			isSelf: v.user_id === user?.id,
			onSave: () => toggleSave(v.user_id),
			onMeet: () => requestMeeting(v.user_id)
		}, v.user_id))
	})] });
}
function FounderCard({ v, isInvestor, isSaved, isSelf, onSave, onMeet }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col rounded-2xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3 text-primary" }),
						" ",
						v.vantage_point ?? 0
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 font-display text-lg font-semibold",
				children: v.venture_name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
				children: [
					v.industry && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: v.industry
					}),
					v.stage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						children: v.stage
					}),
					v.country && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-0.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }),
							" ",
							v.country
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 flex-1 text-sm text-muted-foreground line-clamp-3",
				children: v.bio
			}),
			v.funding_goal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm font-medium",
				children: ["Raising ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: formatNaira(Number(v.funding_goal))
				})]
			}) : null,
			isInvestor && !isSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "flex-1",
					onClick: onSave,
					children: [isSaved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkCheck, { className: "size-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-4" }), isSaved ? "Saved" : "Save"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					className: "flex-1",
					onClick: onMeet,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), " Meet"]
				})]
			})
		]
	});
}
//#endregion
export { FounderCard, DemoPage as component };
