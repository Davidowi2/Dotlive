import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { H as Medal, c as Trophy, it as FileText, q as LoaderCircle, s as Upload } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { t as AppShell } from "./AppShell-C3C0RWJM.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DBN5_Tb-.mjs";
import { r as useFounderProfile } from "./use-dot-data-DSqFe_0n.mjs";
import { t as uploadDocument } from "./upload-rCpE3Cez.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pitchathons-NygPfk2-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Pitchathons API — wraps the Fastify /api/pitchathons/* endpoints.
*/
async function listPitchathons() {
	return (await dotApi.get("/api/pitchathons")).pitchathons ?? [];
}
async function applyToPitchathon(id, data) {
	return (await dotApi.post(`/api/pitchathons/${id}/apply`, data)).application;
}
async function getLeaderboard(id) {
	return (await dotApi.get(`/api/pitchathons/${id}/leaderboard`)).leaderboard ?? [];
}
async function getMyApplications() {
	return (await dotApi.get("/api/pitchathons/applications/me")).applications ?? [];
}
function PitchathonsPage() {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const { data: founder } = useFounderProfile();
	const [active, setActive] = (0, import_react.useState)(null);
	const [ventureName, setVentureName] = (0, import_react.useState)("");
	const [fundingAsk, setFundingAsk] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)(null);
	const { data: pitchathons = [], isLoading } = useQuery({
		queryKey: ["pitchathons"],
		queryFn: listPitchathons
	});
	const { data: myApps = [] } = useQuery({
		queryKey: ["my-applications"],
		enabled: !!user,
		queryFn: getMyApplications
	});
	const applyMutation = useMutation({
		mutationFn: async (pitchathonId) => {
			let deckUrl = null;
			if (file) deckUrl = await uploadDocument(file, "pitch-decks");
			return applyToPitchathon(pitchathonId, {
				ventureName: ventureName || founder?.venture_name || "",
				pitchDeckUrl: deckUrl,
				fundingAsk: fundingAsk ? Number(fundingAsk) : null
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-applications"] });
			toast.success("Application submitted!");
			setActive(null);
			setVentureName("");
			setFundingAsk("");
			setFile(null);
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : "Could not submit");
		}
	});
	const appliedTo = new Set(myApps.map((a) => a.pitchathonId));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Pitchathons",
			subtitle: "Submit your venture, get scored by judges, and climb the leaderboard."
		}),
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
			count: 3,
			cols: 1
		}) : pitchathons.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: Trophy,
			title: "No pitchathons yet",
			description: "Check back soon — upcoming competitions will appear here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 space-y-6",
			children: pitchathons.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-5 text-gold" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-semibold",
									children: p.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: p.status === "open" ? "default" : "secondary",
									children: p.status
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-2xl text-sm text-muted-foreground",
							children: p.description
						}),
						p.prize && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm font-medium text-gold",
							children: ["Prize: ", p.prize]
						})
					] }), appliedTo.has(p.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: "Applied"
					}) : p.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "hero",
						onClick: () => {
							setActive(p.id);
							setVentureName(founder?.venture_name ?? "");
						},
						children: "Apply"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leaderboard, { pitchathonId: p.id })]
			}, p.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!active,
			onOpenChange: (o) => !o && setActive(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Apply to pitchathon" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Submit your venture details and pitch deck." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "vn",
								children: "Venture name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "vn",
								value: ventureName,
								onChange: (e) => setVentureName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "ask",
									children: "Funding ask (₦)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "ask",
									type: "number",
									value: fundingAsk,
									onChange: (e) => setFundingAsk(e.target.value),
									placeholder: "5000000"
								}),
								fundingAsk && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: formatNaira(Number(fundingAsk))
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "deck",
									children: "Pitch deck (PDF)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "deck",
									type: "file",
									accept: ".pdf,.ppt,.pptx",
									onChange: (e) => setFile(e.target.files?.[0] ?? null)
								}),
								file && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-1 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3" }),
										" ",
										file.name
									]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					onClick: () => active && applyMutation.mutate(active),
					disabled: applyMutation.isPending,
					children: [applyMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Submit application"]
				}) })
			] })
		})
	] });
}
function Leaderboard({ pitchathonId }) {
	const { data } = useQuery({
		queryKey: ["leaderboard", pitchathonId],
		queryFn: () => getLeaderboard(pitchathonId)
	});
	const filtered = (data ?? []).filter((r) => r.count > 0).sort((a, b) => b.avg - a.avg);
	if (filtered.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 rounded-xl border border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "border-b border-border px-4 py-2 text-sm font-medium",
			children: "Leaderboard"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "divide-y divide-border",
			children: filtered.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-3 px-4 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("flex size-7 items-center justify-center rounded-full text-xs font-bold", i === 0 ? "bg-gold/20 text-gold" : i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"),
						children: i < 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, { className: "size-4" }) : i + 1
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex-1 text-sm font-medium",
						children: row.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: row.count > 0 ? `${row.avg.toFixed(1)} (${row.count})` : "Not scored"
					})
				]
			}, row.id))
		})]
	});
}
//#endregion
export { PitchathonsPage as component };
