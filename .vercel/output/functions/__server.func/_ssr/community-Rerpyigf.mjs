import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { K as LoaderCircle, _t as CircleCheck, i as Users, j as Plus, lt as Copy, tt as Gauge, u as TrendingUp } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { t as EmptyState } from "./EmptyState-CROwJFsv.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as StatCard } from "./StatCard-CPkc4AhQ.mjs";
import { t as DataTable } from "./DataTable-DlVcX3MI.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
import { t as QRCodeCanvas } from "../_libs/qrcode.react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/community-Rerpyigf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Community API — wraps the Fastify /api/community/* endpoints.
*/
async function getMyCommunity() {
	try {
		return (await dotApi.get("/api/community/my")).community;
	} catch {
		return null;
	}
}
async function listMembers(communityId) {
	return (await dotApi.get(`/api/community/${communityId}/members`)).members ?? [];
}
async function getReferralCode() {
	try {
		return (await dotApi.get("/api/community/referral-code")).referralCode;
	} catch {
		return null;
	}
}
async function createCommunity(data) {
	return (await dotApi.post("/api/community", data)).community;
}
function CommunityPage() {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [region, setRegion] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const { data: community, isLoading } = useQuery({
		queryKey: ["my-community"],
		queryFn: getMyCommunity,
		enabled: !!user
	});
	const communityId = community?.id;
	const { data: members = [] } = useQuery({
		queryKey: ["community-members", communityId],
		queryFn: () => listMembers(communityId),
		enabled: !!communityId
	});
	const { data: referralCode } = useQuery({
		queryKey: ["referral-code"],
		queryFn: getReferralCode,
		enabled: !!communityId
	});
	const createMutation = useMutation({
		mutationFn: (data) => createCommunity(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-community"] });
			toast.success("Community created!");
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : "Could not create");
		}
	});
	async function handleCreate(e) {
		e.preventDefault();
		if (!user) return;
		await createMutation.mutateAsync({
			name,
			description,
			region,
			category
		});
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.Header, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.StatCards, { count: 4 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TableRows, {
			rows: 5,
			cols: 4
		})
	] });
	if (!community) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Create your community",
		subtitle: "Launch your community and start onboarding founders."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleCreate,
		className: "mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "name",
					children: "Community name"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "name",
					required: true,
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "Lagos Builders"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "region",
						children: "Region"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "region",
						value: region,
						onChange: (e) => setRegion(e.target.value),
						placeholder: "Lagos, Nigeria"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "cat",
						children: "Category"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "cat",
						value: category,
						onChange: (e) => setCategory(e.target.value),
						placeholder: "Tech / Agric"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "desc",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "desc",
					value: description,
					onChange: (e) => setDescription(e.target.value),
					rows: 3
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				variant: "hero",
				disabled: createMutation.isPending,
				children: [createMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Create community"]
			})
		]
	})] });
	const code = referralCode ?? community.referralCode;
	const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`;
	const activeCount = members.filter((m) => m.status === "active").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: community.name,
			subtitle: community.description ?? void 0
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Members",
					value: String(members.length),
					icon: Users,
					accent: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Active founders",
					value: String(activeCount),
					icon: TrendingUp,
					accent: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Vantage completed",
					value: String(0),
					icon: CircleCheck,
					accent: "gold"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Avg Vantage",
					value: String(0),
					sub: "/ 1000",
					icon: Gauge,
					accent: "gold"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6 lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Members"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
					columns: [
						{
							key: "founder",
							header: "Founder",
							cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: m.founder?.name ?? "—"
							})
						},
						{
							key: "dotId",
							header: "DOT ID",
							hideOnMobile: true,
							cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: m.founder?.dotId ?? "—"
							})
						},
						{
							key: "status",
							header: "Status",
							align: "right",
							cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular",
								children: m.status
							})
						},
						{
							key: "joined",
							header: "Joined",
							align: "right",
							hideOnMobile: true,
							cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: new Date(m.joinedAt).toLocaleDateString()
							})
						}
					],
					rows: members,
					getRowKey: (m) => m.id,
					emptyState: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						variant: "inline",
						icon: Users,
						title: "No members yet",
						description: "Share your referral link or QR code to onboard founders."
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Invite founders"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex justify-center rounded-xl bg-white p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QRCodeCanvas, {
							value: joinUrl,
							size: 140
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs text-muted-foreground",
						children: "Referral code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium",
							children: code
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "icon",
							onClick: () => {
								navigator.clipboard.writeText(joinUrl);
								toast.success("Invite link copied!");
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 break-all text-xs text-muted-foreground",
						children: joinUrl
					})
				]
			})]
		})
	] });
}
//#endregion
export { CommunityPage as component };
