import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { Et as CalendarCheck, St as Check, a as User, ft as Coins } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { l as formatDot } from "./constants-DV8g_Ppd.mjs";
import { n as useAuth, t as supabase } from "./use-auth-BzqVsto_.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sessions-D49LFGop.js
var import_jsx_runtime = require_jsx_runtime();
function SessionsPage() {
	const { user } = useAuth();
	const qc = useQueryClient();
	const { data: events = [], isLoading } = useQuery({
		queryKey: ["events"],
		queryFn: async () => {
			const { data, error } = await supabase.from("events").select("*").order("event_date");
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: registrations = [] } = useQuery({
		queryKey: ["my-registrations", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const registered = new Set(registrations.map((r) => r.event_id));
	async function register(eventId, cost) {
		if (!user) return;
		try {
			if (cost > 0) {
				const { error: spendErr } = await supabase.rpc("spend_dot", {
					_amount: cost,
					_description: "Session registration"
				});
				if (spendErr) throw spendErr;
			}
			const { error } = await supabase.from("event_registrations").insert({
				event_id: eventId,
				user_id: user.id
			});
			if (error) throw error;
			qc.invalidateQueries({ queryKey: ["my-registrations", user.id] });
			qc.invalidateQueries({ queryKey: ["wallet", user.id] });
			qc.invalidateQueries({ queryKey: ["transactions", user.id] });
			toast.success(cost > 0 ? `Registered! ${formatDot(cost)} DOT spent.` : "Registered!");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not register");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Founder Sessions",
		subtitle: "Live access to operators, experts and investors. Pay with DOT."
	}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
		count: 4,
		cols: 2
	}) : events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: CalendarCheck,
		title: "No sessions scheduled yet",
		description: "Check back soon — upcoming sessions with operators and investors will appear here."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 grid gap-4 sm:grid-cols-2",
		children: events.map((e) => {
			const isReg = registered.has(e.id);
			const date = e.event_date ? new Date(e.event_date) : null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col rounded-2xl border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck, { className: "mr-1 size-3" }), date ? date.toLocaleDateString("en", {
								month: "short",
								day: "numeric"
							}) : "TBA"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-sm font-medium text-gold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "size-4" }),
								" ",
								e.dot_cost > 0 ? `${formatDot(e.dot_cost)} DOT` : "Free"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 font-display text-lg font-semibold",
						children: e.title
					}),
					e.speaker && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 flex items-center gap-1 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-3.5" }),
							" ",
							e.speaker
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 flex-1 text-sm text-muted-foreground",
						children: e.description
					}),
					date && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: date.toLocaleString("en", {
							weekday: "long",
							hour: "numeric",
							minute: "2-digit"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: isReg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "w-full",
							disabled: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-primary" }), " Registered"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "hero",
							className: "w-full",
							onClick: () => register(e.id, e.dot_cost),
							children: ["Register ", e.dot_cost > 0 ? `· ${formatDot(e.dot_cost)} DOT` : ""]
						})
					})
				]
			}, e.id);
		})
	})] });
}
//#endregion
export { SessionsPage as component };
