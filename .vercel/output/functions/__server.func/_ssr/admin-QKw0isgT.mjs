import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { Et as CalendarCheck, S as ShieldCheck, Z as History, b as Shield, c as Trophy, ft as Coins, i as Users, j as Plus, jt as BookOpen, lt as DollarSign, q as LoaderCircle, u as TrendingUp, x as ShieldMinus } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { l as formatDot, o as ROLE_LABELS, u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as AppShell } from "./AppShell-C3C0RWJM.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-CW9j8dJg.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.mjs";
import { t as StatCard } from "./StatCard-Wbb7_aCv.mjs";
import { t as DataTable } from "./DataTable-CEQ0p7Mw.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-DBN5_Tb-.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BRvB6XYo.mjs";
import { i as stringType, r as objectType, t as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-QKw0isgT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var adminRole = enumType(["admin", "super_admin"]);
var elevateInput = objectType({
	targetUserId: stringType().uuid(),
	newRole: adminRole.default("super_admin"),
	reason: stringType().trim().max(500).optional()
});
var revokeInput = objectType({
	targetUserId: stringType().uuid(),
	role: adminRole.default("admin"),
	reason: stringType().trim().max(500).optional()
});
/**
* Elevate a user to an admin role. Runs as the authenticated caller; the
* underlying SECURITY DEFINER function enforces that only super admins can
* call it and blocks self-assignment.
*/
var elevateUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => elevateInput.parse(data)).handler(createSsrRpc("f0f685d425ad065ab7fe05586b7cef58b92fb9afceadfb1eb734416b921dccbe"));
/** Revoke an admin role from a user. Super admins only; cannot revoke self. */
var revokeAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => revokeInput.parse(data)).handler(createSsrRpc("06e0572fac90316a37f1b88d6cb83786d8a44f92579a42e2a91a7f7f3f158af7"));
/**
* One-time bootstrap: the first authenticated user can claim the Super Admin
* role, but only while no super admin exists yet. Uses the service-role-only
* bootstrap_super_admin function via the admin client.
*/
var claimSuperAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0521649be2cdd5136881072b44960ffa318666bfd4ffd15b2d336ba60e6d2239"));
/**
* Admin API — wraps the Fastify /api/admin/* endpoints.
* All endpoints require admin or super_admin role.
* Write operations require an Idempotency-Key header (generated automatically).
*/
function idempotencyKey() {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
async function listAdminUsers(params) {
	const q = new URLSearchParams();
	if (params?.search) q.set("search", params.search);
	if (params?.role) q.set("role", params.role);
	if (params?.banned) q.set("banned", params.banned);
	if (params?.limit) q.set("limit", String(params.limit));
	const qs = q.toString() ? `?${q}` : "";
	return dotApi.get(`/api/admin/users${qs}`);
}
async function adjustBalance(userId, amount, description) {
	return dotApi.post(`/api/admin/users/${userId}/adjust-balance`, {
		amount,
		description,
		reason: description
	}, { headers: { "Idempotency-Key": idempotencyKey() } });
}
async function banUser(userId, reason, expiresInHours) {
	return dotApi.post(`/api/admin/users/${userId}/ban`, {
		reason,
		expiresInHours
	}, { headers: { "Idempotency-Key": idempotencyKey() } });
}
async function unbanUser(userId, reason) {
	return dotApi.post(`/api/admin/users/${userId}/unban`, { reason }, { headers: { "Idempotency-Key": idempotencyKey() } });
}
async function getAdminStats() {
	return dotApi.get("/api/stats");
}
function AdminPage() {
	const { roles, refresh } = useDotAuth();
	const isAdmin = roles.includes("admin") || roles.includes("super_admin");
	const isSuperAdmin = roles.includes("super_admin");
	const claim = useServerFn(claimSuperAdmin);
	const [claiming, setClaiming] = (0, import_react.useState)(false);
	async function handleClaim() {
		setClaiming(true);
		try {
			await claim();
			toast.success("You are now the Super Admin");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to claim");
		} finally {
			setClaiming(false);
		}
	}
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "mx-auto size-10 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-2xl font-bold",
				children: "Admins only"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "You don't have access to this area."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-6 max-w-md rounded-2xl border border-dashed border-border bg-card p-5 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display font-semibold",
						children: "Platform setup"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "If no Super Admin exists yet, you can claim it once to initialise the platform."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						className: "mt-4",
						onClick: handleClaim,
						disabled: claiming,
						children: [claiming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), "Claim initial Super Admin"]
					})
				]
			})
		]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Admin",
		subtitle: "Manage members, credits and platform content."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		defaultValue: "members",
		className: "mt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "members",
					children: "Members"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "payments",
					children: "Payments"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "content",
					children: "Content"
				}),
				isSuperAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "roles",
					children: "Roles & Audit"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "members",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MembersTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "payments",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentsTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "content",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContentTab, {})
			}),
			isSuperAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "roles",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolesTab, {})
			})
		]
	})] });
}
function RolesTab() {
	const qc = useQueryClient();
	const { user } = useDotAuth();
	const elevate = useServerFn(elevateUser);
	const revoke = useServerFn(revokeAdmin);
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const { data: members = [], isLoading } = useQuery({
		queryKey: ["admin-roles-members"],
		queryFn: async () => {
			const [{ data: profiles }, { data: roleRows }] = await Promise.all([supabase.from("profiles").select("id, name, email"), supabase.from("user_roles").select("user_id, role")]);
			const rmap = /* @__PURE__ */ new Map();
			(roleRows ?? []).forEach((r) => {
				const arr = rmap.get(r.user_id) ?? [];
				arr.push(r.role);
				rmap.set(r.user_id, arr);
			});
			return (profiles ?? []).map((p) => ({
				...p,
				roles: rmap.get(p.id) ?? []
			}));
		}
	});
	const { data: audit = [] } = useQuery({
		queryKey: ["role-audit-log"],
		queryFn: async () => {
			const { data } = await supabase.from("role_audit_log").select("*").order("created_at", { ascending: false }).limit(50);
			return data ?? [];
		}
	});
	async function doElevate(id, role) {
		setBusyId(id);
		try {
			await elevate({ data: {
				targetUserId: id,
				newRole: role
			} });
			toast.success(`Granted ${ROLE_LABELS[role]}`);
			qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
			qc.invalidateQueries({ queryKey: ["role-audit-log"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed");
		} finally {
			setBusyId(null);
		}
	}
	async function doRevoke(id, role) {
		setBusyId(id);
		try {
			await revoke({ data: {
				targetUserId: id,
				role
			} });
			toast.success(`Revoked ${ROLE_LABELS[role]}`);
			qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
			qc.invalidateQueries({ queryKey: ["role-audit-log"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed");
		} finally {
			setBusyId(null);
		}
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TableRows, {
		rows: 5,
		cols: 3
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-2xl border border-border bg-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold",
					children: "Admin assignment"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Grant or revoke admin access. You cannot change your own role."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
				columns: [
					{
						key: "name",
						header: "Name",
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: m.name ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: m.email
						})] })
					},
					{
						key: "roles",
						header: "Roles",
						hideOnMobile: true,
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1",
							children: [m.roles.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "—"
							}), m.roles.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: r === "super_admin" ? "default" : "secondary",
								children: ROLE_LABELS[r] ?? r
							}, r))]
						})
					},
					{
						key: "actions",
						header: "",
						align: "right",
						cell: (m) => {
							const isSelf = m.id === user?.id;
							const isMemberAdmin = m.roles.includes("admin");
							const isMemberSuper = m.roles.includes("super_admin");
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap justify-end gap-2",
								children: isSelf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "Your account"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									!isMemberSuper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										disabled: busyId === m.id,
										onClick: () => doElevate(m.id, "super_admin"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), " Super Admin"]
									}),
									!isMemberAdmin && !isMemberSuper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										disabled: busyId === m.id,
										onClick: () => doElevate(m.id, "admin"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), " Make Admin"]
									}),
									isMemberSuper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										disabled: busyId === m.id,
										onClick: () => doRevoke(m.id, "super_admin"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldMinus, { className: "size-4" }), " Revoke Super"]
									}),
									isMemberAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										disabled: busyId === m.id,
										onClick: () => doRevoke(m.id, "admin"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldMinus, { className: "size-4" }), " Revoke Admin"]
									})
								] })
							});
						}
					}
				],
				rows: members,
				getRowKey: (m) => m.id,
				emptyState: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					variant: "inline",
					icon: Users,
					title: "No members found"
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-2xl border border-border bg-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold",
					children: "Role audit log"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
				columns: [
					{
						key: "when",
						header: "When",
						cell: (a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: new Date(a.created_at).toLocaleString()
						})
					},
					{
						key: "action",
						header: "Action",
						cell: (a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: a.action === "revoked" ? "destructive" : "secondary",
							children: a.action
						})
					},
					{
						key: "role",
						header: "Role",
						cell: (a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.new_role })
					},
					{
						key: "previous",
						header: "Previous",
						hideOnMobile: true,
						cell: (a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: a.previous_role ?? "—"
						})
					}
				],
				rows: audit,
				getRowKey: (a) => a.id,
				emptyState: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					variant: "inline",
					icon: History,
					title: "No role changes recorded yet"
				})
			})]
		})]
	});
}
function MembersTab() {
	const qc = useQueryClient();
	const [target, setTarget] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)(0);
	const [type, setType] = (0, import_react.useState)("Admin Credit");
	const [banTarget, setBanTarget] = (0, import_react.useState)(null);
	const [banReason, setBanReason] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const { data, isLoading } = useQuery({
		queryKey: ["admin-members", search],
		queryFn: () => listAdminUsers({
			search: search || void 0,
			limit: 100
		})
	});
	const members = data?.users ?? [];
	const adjustMutation = useMutation({
		mutationFn: () => adjustBalance(target.id, amount, `${type} — manual admin adjustment`),
		onSuccess: () => {
			toast.success("Balance updated");
			qc.invalidateQueries({ queryKey: ["admin-members"] });
			setTarget(null);
			setAmount(0);
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Failed")
	});
	const banMutation = useMutation({
		mutationFn: () => banUser(banTarget.id, banReason),
		onSuccess: () => {
			toast.success("User banned");
			qc.invalidateQueries({ queryKey: ["admin-members"] });
			setBanTarget(null);
			setBanReason("");
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Failed")
	});
	useMutation({
		mutationFn: (userId) => unbanUser(userId, "Admin unban"),
		onSuccess: () => {
			toast.success("User unbanned");
			qc.invalidateQueries({ queryKey: ["admin-members"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Failed")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TableRows, {
		rows: 6,
		cols: 4
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "Search by name, email or DOT ID…",
				value: search,
				onChange: (e) => setSearch(e.target.value),
				className: "max-w-sm"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
				columns: [
					{
						key: "name",
						header: "Name",
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: m.name ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-muted-foreground",
							children: m.dotId
						})] })
					},
					{
						key: "email",
						header: "Email",
						hideOnMobile: true,
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: m.email
						})
					},
					{
						key: "joined",
						header: "Joined",
						hideOnMobile: true,
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: new Date(m.createdAt).toLocaleDateString()
						})
					},
					{
						key: "actions",
						header: "",
						align: "right",
						cell: (m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => setTarget({
									id: m.id,
									name: m.name ?? m.email ?? ""
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "size-4" }), " Adjust"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								className: "text-destructive hover:bg-destructive/10",
								onClick: () => setBanTarget(m),
								children: "Ban"
							})]
						})
					}
				],
				rows: members,
				getRowKey: (m) => m.id,
				emptyState: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					variant: "inline",
					icon: Users,
					title: "No members yet"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!target,
				onOpenChange: (o) => !o && setTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Adjust balance — ", target?.name] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									"Admin Credit",
									"Reward",
									"Admin Adjustment",
									"Refund"
								].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setType(t),
									className: `rounded-full border px-3 py-1 text-sm ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border"}`,
									children: t
								}, t))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "amt",
								children: "Amount (DOT, negative to deduct)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "amt",
								type: "number",
								value: amount,
								onChange: (e) => setAmount(Number(e.target.value))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						onClick: () => adjustMutation.mutate(),
						disabled: adjustMutation.isPending,
						children: [adjustMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Apply"]
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!banTarget,
				onOpenChange: (o) => !o && setBanTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Ban — ", banTarget?.name ?? banTarget?.email] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "ban-reason",
							children: "Reason"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "ban-reason",
							value: banReason,
							onChange: (e) => setBanReason(e.target.value),
							placeholder: "Reason for ban (required)",
							rows: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "text-destructive",
						onClick: () => banMutation.mutate(),
						disabled: banMutation.isPending || banReason.length < 5,
						children: [banMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Confirm ban"]
					}) })
				] })
			})
		]
	});
}
function PaymentsTab() {
	const { data: stats } = useQuery({
		queryKey: ["admin-stats"],
		queryFn: getAdminStats
	});
	const { data: payments = [], isLoading } = useQuery({
		queryKey: ["admin-payments"],
		queryFn: async () => {
			const [{ data: rows }, { data: profiles }] = await Promise.all([supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200), supabase.from("profiles").select("id, name, email")]);
			const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
			return (rows ?? []).map((r) => ({
				...r,
				profile: pmap.get(r.user_id)
			}));
		}
	});
	const totals = payments.reduce((acc, p) => {
		if (p.credited_at) {
			acc.dot += Number(p.dot_amount);
			acc.naira += Number(p.naira_amount);
			acc.count += 1;
		}
		return acc;
	}, {
		dot: 0,
		naira: 0,
		count: 0
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.StatCards, { count: 3 });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Successful payments",
						value: String(totals.count),
						icon: TrendingUp,
						accent: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "DOT funded",
						value: `${formatDot(totals.dot)} DOT`,
						icon: Coins,
						accent: "gold"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Revenue",
						value: formatNaira(totals.naira),
						icon: DollarSign,
						accent: "primary"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
				columns: [
					{
						key: "user",
						header: "User",
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: p.profile?.name ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: p.profile?.email
						})] })
					},
					{
						key: "dot",
						header: "DOT",
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular",
							children: formatDot(Number(p.dot_amount))
						})
					},
					{
						key: "amount",
						header: "Amount",
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular",
							children: formatNaira(Number(p.naira_amount))
						})
					},
					{
						key: "status",
						header: "Status",
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: p.credited_at ? "default" : p.status === "pending" ? "secondary" : "destructive",
							children: p.credited_at ? "credited" : p.status
						})
					},
					{
						key: "channel",
						header: "Channel",
						hideOnMobile: true,
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: p.channel ?? "—"
						})
					},
					{
						key: "reference",
						header: "Reference",
						hideOnMobile: true,
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-muted-foreground",
							children: p.reference
						})
					},
					{
						key: "date",
						header: "Date",
						hideOnMobile: true,
						cell: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: new Date(p.created_at).toLocaleString()
						})
					}
				],
				rows: payments,
				getRowKey: (p) => p.id,
				emptyState: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					variant: "inline",
					icon: DollarSign,
					title: "No payments recorded yet"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"Wallets are credited only after Paystack verifies the payment. To credit or refund manually, use the ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Members" }),
					" tab — every change is written permanently to the ledger."
				]
			})
		]
	});
}
function ContentTab() {
	const qc = useQueryClient();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 grid gap-6 lg:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCard, {
				title: "New course",
				icon: BookOpen,
				fields: [
					{
						key: "title",
						label: "Title"
					},
					{
						key: "description",
						label: "Description",
						textarea: true
					},
					{
						key: "whop_url",
						label: "Whop URL"
					},
					{
						key: "category",
						label: "Category"
					},
					{
						key: "dot_reward",
						label: "DOT reward",
						number: true
					},
					{
						key: "vantage_boost",
						label: "Vantage boost",
						number: true
					}
				],
				onSubmit: async (v) => {
					const { error } = await supabase.from("courses").insert({
						title: v.title,
						description: v.description,
						whop_url: v.whop_url,
						category: v.category,
						dot_reward: Number(v.dot_reward) || 0,
						vantage_boost: Number(v.vantage_boost) || 0
					});
					if (error) throw error;
					qc.invalidateQueries({ queryKey: ["courses"] });
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCard, {
				title: "New session",
				icon: CalendarCheck,
				fields: [
					{
						key: "title",
						label: "Title"
					},
					{
						key: "description",
						label: "Description",
						textarea: true
					},
					{
						key: "speaker",
						label: "Speaker"
					},
					{
						key: "event_date",
						label: "Date & time",
						type: "datetime-local"
					},
					{
						key: "dot_cost",
						label: "DOT cost",
						number: true
					},
					{
						key: "capacity",
						label: "Capacity",
						number: true
					}
				],
				onSubmit: async (v) => {
					const { error } = await supabase.from("events").insert({
						title: v.title,
						description: v.description,
						speaker: v.speaker,
						event_date: v.event_date ? new Date(v.event_date).toISOString() : null,
						dot_cost: Number(v.dot_cost) || 0,
						capacity: Number(v.capacity) || 100
					});
					if (error) throw error;
					qc.invalidateQueries({ queryKey: ["events"] });
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCard, {
				title: "New pitchathon",
				icon: Trophy,
				fields: [
					{
						key: "title",
						label: "Title"
					},
					{
						key: "description",
						label: "Description",
						textarea: true
					},
					{
						key: "prize",
						label: "Prize"
					},
					{
						key: "start_date",
						label: "Start",
						type: "datetime-local"
					},
					{
						key: "end_date",
						label: "End",
						type: "datetime-local"
					}
				],
				onSubmit: async (v) => {
					const { error } = await supabase.from("pitchathons").insert({
						title: v.title,
						description: v.description,
						prize: v.prize,
						start_date: v.start_date ? new Date(v.start_date).toISOString() : null,
						end_date: v.end_date ? new Date(v.end_date).toISOString() : null,
						status: "open"
					});
					if (error) throw error;
					qc.invalidateQueries({ queryKey: ["pitchathons"] });
				}
			})
		]
	});
}
function CreateCard({ title, icon: Icon, fields, onSubmit }) {
	const [values, setValues] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await onSubmit(values);
			toast.success(`${title} created`);
			setValues({});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "rounded-2xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold",
					children: title
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: fields.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs",
						children: f.label
					}), f.textarea ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						rows: 2,
						value: values[f.key] ?? "",
						onChange: (e) => setValues((v) => ({
							...v,
							[f.key]: e.target.value
						}))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: f.type ?? (f.number ? "number" : "text"),
						value: values[f.key] ?? "",
						onChange: (e) => setValues((v) => ({
							...v,
							[f.key]: e.target.value
						}))
					})]
				}, f.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				variant: "hero",
				className: "mt-4 w-full",
				disabled: busy,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Create"]
			})
		]
	});
}
//#endregion
export { AdminPage as component };
