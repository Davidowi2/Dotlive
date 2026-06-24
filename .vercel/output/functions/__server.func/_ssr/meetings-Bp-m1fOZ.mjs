import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { Et as Building2, H as MapPin, K as LoaderCircle, T as Send, _t as CircleCheck, ft as Clock, mt as CircleX, z as MessageSquare } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { t as EmptyState } from "./EmptyState-CROwJFsv.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BRvB6XYo.mjs";
import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as useAuth } from "./use-auth-DnlQb86O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/meetings-Bp-m1fOZ.js
var import_jsx_runtime = require_jsx_runtime();
function MeetingsPage() {
	const { user, roles } = useAuth();
	const qc = useQueryClient();
	const isInvestor = roles.includes("investor");
	const isFounder = roles.includes("founder");
	const { data: received = [], isLoading: rxLoading } = useQuery({
		queryKey: ["meetings-received", user?.id],
		enabled: !!user && isFounder,
		queryFn: async () => {
			const { data, error } = await supabase.from("meeting_requests").select("id, message, status, created_at, investor_id").eq("founder_id", user.id).order("created_at", { ascending: false });
			if (error) throw error;
			if (!data || data.length === 0) return [];
			const ids = [...new Set(data.map((r) => r.investor_id))];
			const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", ids);
			const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
			return data.map((r) => ({
				...r,
				investor: pmap.get(r.investor_id)
			}));
		}
	});
	const { data: sent = [], isLoading: sentLoading } = useQuery({
		queryKey: ["meetings-sent", user?.id],
		enabled: !!user && isInvestor,
		queryFn: async () => {
			const { data, error } = await supabase.from("meeting_requests").select("id, message, status, created_at, founder_id").eq("investor_id", user.id).order("created_at", { ascending: false });
			if (error) throw error;
			if (!data || data.length === 0) return [];
			const ids = [...new Set(data.map((r) => r.founder_id))];
			const { data: fps } = await supabase.from("founder_profiles").select("user_id, venture_name, vantage_point, country").in("user_id", ids);
			const fpmap = new Map((fps ?? []).map((p) => [p.user_id, p]));
			return data.map((r) => ({
				...r,
				founder: fpmap.get(r.founder_id)
			}));
		}
	});
	async function updateStatus(id, status) {
		try {
			const { error } = await supabase.from("meeting_requests").update({ status }).eq("id", id);
			if (error) throw error;
			qc.invalidateQueries({ queryKey: ["meetings-received", user?.id] });
			toast.success(status === "accepted" ? "Meeting accepted!" : "Request declined.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not update");
		}
	}
	const pendingCount = received.filter((r) => r.status === "pending").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Meeting Requests",
		subtitle: "Manage your investor conversations and founder connections."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		defaultValue: "received",
		className: "mt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
				value: "received",
				children: ["Received ", pendingCount > 0 && `(${pendingCount})`]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
				value: "sent",
				children: "Sent"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "received",
				className: "mt-4",
				children: rxLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mt-8 size-6 animate-spin text-primary" }) : received.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: MessageSquare,
					title: "No meeting requests yet",
					description: "When investors request meetings with you, they'll appear here."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4",
					children: received.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
										children: (r.investor?.name ?? "I").charAt(0).toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: r.investor?.name ?? "Investor"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: r.investor?.email
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary",
										children: r.status
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1 text-xs text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }), new Date(r.created_at).toLocaleDateString()]
									})]
								})]
							}),
							r.message && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground",
								children: [
									"\"",
									r.message,
									"\""
								]
							}),
							r.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "hero",
									size: "sm",
									onClick: () => updateStatus(r.id, "accepted"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Accept"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => updateStatus(r.id, "declined"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-4" }), " Decline"]
								})]
							})
						]
					}, r.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "sent",
				className: "mt-4",
				children: sentLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mt-8 size-6 animate-spin text-primary" }) : sent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Send,
					title: "No requests sent",
					description: "Browse ventures in DOT Demo to request meetings."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: sent.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-center gap-4 rounded-2xl border border-border bg-card p-5"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: r.founder?.venture_name ?? "Venture"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: r.founder?.country && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), r.founder.country]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary",
									children: r.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: new Date(r.created_at).toLocaleDateString()
								})]
							})
						]
					}, r.id))
				})
			})
		]
	})] });
}
//#endregion
export { MeetingsPage as component };
