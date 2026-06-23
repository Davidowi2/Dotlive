import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as Search, F as Package, I as PackageCheck, K as Lock, N as Pencil, Ot as Briefcase, _ as Star, f as Trash2, g as Store, j as Plus, pt as Clock, q as LoaderCircle, r as Wallet, vt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { a as ORDER_STATUS_META, c as dotToNaira, l as formatDot, s as WORK_CATEGORIES, u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as AppShell } from "./AppShell-C3C0RWJM.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as StatCard } from "./StatCard-Wbb7_aCv.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Textarea } from "./textarea-CF5-G6fJ.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DBN5_Tb-.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BRvB6XYo.mjs";
import { i as useMyBuilderProfile, n as useBuilderStats, s as useWallet } from "./use-dot-data-DSqFe_0n.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BYsjabzv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/work-DSyA5qEE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* DeliveryDialog
*
* Replaces the window.prompt() call in DOT Work SellTab.
* Builder marks an order as delivered with an optional note
* or link (e.g. Google Drive, Figma, GitHub).
*/
function DeliveryDialog({ orderId, orderTitle, onClose, onDeliver }) {
	const [note, setNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function handleSubmit() {
		if (!orderId) return;
		setBusy(true);
		try {
			await onDeliver(orderId, note.trim());
			setNote("");
			onClose();
		} finally {
			setBusy(false);
		}
	}
	function handleOpenChange(open) {
		if (!open) {
			setNote("");
			onClose();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!orderId,
		onOpenChange: handleOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Mark as delivered" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: ["Share your deliverable for: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium text-foreground",
				children: orderTitle
			})] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "delivery-note",
							children: "Delivery note or link"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "delivery-note",
							value: note,
							onChange: (e) => setNote(e.target.value),
							placeholder: "Add a link to your work (Google Drive, Figma, GitHub…) or a note for the client.",
							rows: 3,
							maxLength: 1e3
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "The client will see this note when confirming delivery."
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: onClose,
				disabled: busy,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "hero",
				onClick: handleSubmit,
				disabled: busy,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCheck, { className: "size-4" }), "Mark delivered"]
			})] })
		] })
	});
}
/**
* Marketplace API — wraps the Fastify /api/services, /api/jobs, /api/orders endpoints.
*/
async function listServices(filters) {
	const params = new URLSearchParams();
	if (filters?.category) params.set("category", filters.category);
	if (filters?.search) params.set("search", filters.search);
	if (filters?.limit) params.set("limit", String(filters.limit));
	const query = params.toString() ? `?${params}` : "";
	return (await dotApi.get(`/api/services${query}`)).services ?? [];
}
async function createService(data) {
	return (await dotApi.post("/api/services", data)).service;
}
async function updateService(id, data) {
	return (await dotApi.patch(`/api/services/${id}`, data)).service;
}
async function deleteService(id) {
	await dotApi.delete(`/api/services/${id}`);
}
async function listJobs(filters) {
	const params = new URLSearchParams();
	if (filters?.category) params.set("category", filters.category);
	if (filters?.search) params.set("search", filters.search);
	if (filters?.limit) params.set("limit", String(filters.limit));
	if (filters?.minSalary) params.set("minSalary", String(filters.minSalary));
	if (filters?.employmentType) params.set("employmentType", filters.employmentType);
	const query = params.toString() ? `?${params}` : "";
	return (await dotApi.get(`/api/jobs${query}`)).jobs ?? [];
}
async function createJob(data) {
	return (await dotApi.post("/api/jobs", data)).job;
}
async function updateJob(id, data) {
	return (await dotApi.patch(`/api/jobs/${id}`, data)).job;
}
async function deleteJob(id) {
	await dotApi.delete(`/api/jobs/${id}`);
}
async function listOrders(role = "client") {
	return (await dotApi.get(`/api/orders?role=${role}`)).orders ?? [];
}
async function createOrder(serviceId, requirements) {
	return (await dotApi.post("/api/orders", {
		serviceId,
		requirements
	})).order;
}
async function deliverOrder(orderId, note) {
	return (await dotApi.patch(`/api/orders/${orderId}/deliver`, { note })).order;
}
async function completeOrder(orderId) {
	return (await dotApi.patch(`/api/orders/${orderId}/complete`)).order;
}
async function cancelOrder(orderId) {
	return (await dotApi.patch(`/api/orders/${orderId}/cancel`)).order;
}
var JOB_EMPLOYMENT_TYPES = [
	{
		value: "full_time",
		label: "Full-time"
	},
	{
		value: "part_time",
		label: "Part-time"
	},
	{
		value: "contract",
		label: "Contract"
	},
	{
		value: "internship",
		label: "Internship"
	}
];
function WorkPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "DOT Work",
		subtitle: "Hire builders, browse jobs, or earn DOT with your skills."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		defaultValue: "gigs",
		className: "mt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "gigs",
					children: "Gigs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "jobs",
					children: "Jobs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "orders",
					children: "My Orders"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "sell",
					children: "Sell"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "gigs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GigsTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "jobs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobsTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "orders",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrdersTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "sell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SellTab, {})
			})
		]
	})] });
}
function GigsTab() {
	const { user } = useDotAuth();
	const [category, setCategory] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: services = [], isLoading } = useQuery({
		queryKey: [
			"services",
			category || "all",
			search || ""
		],
		queryFn: () => listServices({
			category: category || void 0,
			search: search || void 0
		})
	});
	const [order, setOrder] = (0, import_react.useState)(null);
	const visible = services.filter((s) => s.builderId !== user?.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Search gigs…",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "pl-9"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: category || "all",
					onValueChange: (v) => setCategory(v === "all" ? "" : v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "sm:w-56",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All categories" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All categories"
					}), WORK_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: c,
						children: c
					}, c))] })]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
				count: 6,
				cols: 3
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Store,
				title: "No gigs found",
				description: "Try a different category or search term."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: visible.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceCard, {
					service: s,
					onOrder: () => setOrder(s)
				}, s.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDialog, {
				service: order,
				onClose: () => setOrder(null)
			})
		]
	});
}
function ServiceCard({ service, onOrder }) {
	const { data: stats } = useBuilderStats(service.builderId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col rounded-2xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					children: service.category
				}), stats && Number(stats.review_count) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1 text-xs font-medium text-gold",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-current" }),
						" ",
						Number(stats.avg_rating),
						" (",
						Number(stats.review_count),
						")"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 font-display text-lg font-semibold",
				children: service.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground",
				children: service.description
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3 text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
						" ",
						service.deliveryDays,
						"d delivery"
					]
				}), stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(stats.orders_completed), " done"] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-lg font-bold text-primary",
					children: [formatDot(service.priceDot), " DOT"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: formatNaira(dotToNaira(service.priceDot))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "hero",
					onClick: onOrder,
					children: "Order"
				})]
			})
		]
	});
}
function OrderDialog({ service, onClose }) {
	const qc = useQueryClient();
	const { data: balance = 0 } = useWallet();
	const [requirements, setRequirements] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function placeOrder() {
		if (!service) return;
		if (service.priceDot > balance) {
			toast.error("Insufficient DOT balance — top up your wallet first.");
			return;
		}
		setBusy(true);
		try {
			await createOrder(service.id, requirements.trim() || void 0);
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transactions"] });
			qc.invalidateQueries({ queryKey: ["orders", "client"] });
			toast.success("Order placed! DOT is held until you confirm delivery.");
			onClose();
			setRequirements("");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not place order");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!service,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Order: ", service?.title] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: service && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [formatDot(service.priceDot), " DOT will be held from your wallet and released to the builder when you confirm the work is done."] }) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "req",
						children: "What do you need? (optional)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "req",
						value: requirements,
						onChange: (e) => setRequirements(e.target.value),
						placeholder: "Describe your requirements, links, brand assets…",
						maxLength: 2e3
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Your balance: ",
							formatDot(balance),
							" DOT"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "hero",
				onClick: placeOrder,
				disabled: busy,
				children: [
					busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }),
					"Pay ",
					service ? formatDot(service.priceDot) : "",
					" DOT"
				]
			}) })
		] })
	});
}
function JobsTab() {
	const { roles } = useDotAuth();
	const isFounder = roles.includes("founder");
	const [category, setCategory] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [minSalary, setMinSalary] = (0, import_react.useState)("");
	const [employmentType, setEmploymentType] = (0, import_react.useState)("");
	const { data: jobs = [], isLoading } = useQuery({
		queryKey: [
			"job_listings",
			category || "all",
			search || ""
		],
		queryFn: () => listJobs({
			category: category || void 0,
			search: search || void 0
		})
	});
	const [selectedJob, setSelectedJob] = (0, import_react.useState)(null);
	const [showPostForm, setShowPostForm] = (0, import_react.useState)(false);
	const filtered = jobs.filter((j) => {
		if (employmentType && j.employmentType !== employmentType) return false;
		if (minSalary && j.salaryDot < Number(minSalary)) return false;
		return true;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Search jobs…",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "pl-9"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: category || "all",
						onValueChange: (v) => setCategory(v === "all" ? "" : v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "sm:w-44",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All categories"
						}), WORK_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: c,
							children: c
						}, c))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: employmentType || "all",
						onValueChange: (v) => setEmploymentType(v === "all" ? "" : v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "sm:w-40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Type" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All types"
						}), JOB_EMPLOYMENT_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: t.value,
							children: t.label
						}, t.value))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Min DOT salary",
						type: "number",
						min: 0,
						value: minSalary,
						onChange: (e) => setMinSalary(e.target.value),
						className: "sm:w-36"
					}),
					isFounder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						onClick: () => setShowPostForm(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Post a Job"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/onboarding",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), " Upgrade to Post"]
						})
					})
				]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TransactionRows, { rows: 5 }) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Briefcase,
				title: "No jobs found",
				description: "No open positions match your filters.",
				action: isFounder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					onClick: () => setShowPostForm(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Post the first job"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Founders can post jobs.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/onboarding",
							className: "text-primary underline",
							children: "Become a Founder"
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-3",
				children: filtered.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobCard, {
					job: j,
					onView: () => setSelectedJob(j)
				}, j.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobDetailDialog, {
				job: selectedJob,
				onClose: () => setSelectedJob(null)
			}),
			showPostForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobFormDialog, { onClose: () => setShowPostForm(false) })
		]
	});
}
function JobCard({ job, onView }) {
	const typeLabel = JOB_EMPLOYMENT_TYPES.find((t) => t.value === job.employmentType)?.label ?? job.employmentType;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-base font-semibold",
							children: job.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: job.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							children: typeLabel
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 line-clamp-2 text-sm text-muted-foreground",
					children: job.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted-foreground",
					children: ["Posted ", new Date(job.createdAt).toLocaleDateString()]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex shrink-0 flex-col items-end gap-2 sm:items-end",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-lg font-bold text-primary",
					children: [formatDot(job.salaryDot), " DOT"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: formatNaira(dotToNaira(job.salaryDot))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "hero",
					size: "sm",
					onClick: onView,
					children: "View job"
				})
			]
		})]
	});
}
function JobDetailDialog({ job, onClose }) {
	const typeLabel = JOB_EMPLOYMENT_TYPES.find((t) => t.value === job?.employmentType)?.label ?? job?.employmentType;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!job,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: job?.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: job?.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							children: typeLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-semibold text-primary",
							children: [job ? formatDot(job.salaryDot) : "", " DOT / mo"]
						})
					]
				}) })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-foreground",
						children: "About this role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-wrap text-muted-foreground",
						children: job?.description
					})] }), job?.requirements && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-foreground",
						children: "Requirements"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-wrap text-muted-foreground",
						children: job.requirements
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "hero",
					onClick: onClose,
					children: "Apply via DOT (coming soon)"
				}) })
			]
		})
	});
}
function JobFormDialog({ job, onClose }) {
	const qc = useQueryClient();
	const [title, setTitle] = (0, import_react.useState)(job?.title ?? "");
	const [description, setDescription] = (0, import_react.useState)(job?.description ?? "");
	const [category, setCategory] = (0, import_react.useState)(job?.category ?? WORK_CATEGORIES[0]);
	const [salary, setSalary] = (0, import_react.useState)(job?.salaryDot ?? 5e3);
	const [empType, setEmpType] = (0, import_react.useState)(job?.employmentType ?? "full_time");
	const [requirements, setRequirements] = (0, import_react.useState)(job?.requirements ?? "");
	const [isOpen, setIsOpen] = (0, import_react.useState)(job?.isOpen ?? true);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function save() {
		if (!title.trim() || !description.trim()) {
			toast.error("Title and description are required.");
			return;
		}
		if (salary <= 0) {
			toast.error("Salary must be a positive number.");
			return;
		}
		setBusy(true);
		try {
			const payload = {
				title: title.trim(),
				description: description.trim(),
				category,
				salaryDot: Math.floor(salary),
				employmentType: empType,
				requirements: requirements.trim() || void 0,
				isOpen
			};
			if (job) await updateJob(job.id, payload);
			else await createJob(payload);
			qc.invalidateQueries({ queryKey: ["job_listings"] });
			qc.invalidateQueries({ queryKey: ["my_job_listings"] });
			toast.success(job ? "Job updated." : "Job posted.");
			onClose();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save job");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: job ? "Edit job" : "Post a job" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Only founders can post jobs. The listing will appear in the Jobs tab." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "j-title",
								children: "Job title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "j-title",
								value: title,
								onChange: (e) => setTitle(e.target.value),
								maxLength: 120
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "j-desc",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "j-desc",
								value: description,
								onChange: (e) => setDescription(e.target.value),
								maxLength: 5e3,
								rows: 4
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: category,
									onValueChange: setCategory,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: WORK_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: c,
										children: c
									}, c)) })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Employment type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: empType,
									onValueChange: setEmpType,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: JOB_EMPLOYMENT_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: t.value,
										children: t.label
									}, t.value)) })]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "j-salary",
								children: "Salary (DOT / month)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "j-salary",
								type: "number",
								min: 1,
								value: salary,
								onChange: (e) => setSalary(Number(e.target.value))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "j-req",
								children: "Requirements (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "j-req",
								value: requirements,
								onChange: (e) => setRequirements(e.target.value),
								maxLength: 2e3,
								rows: 3
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: isOpen,
								onChange: (e) => setIsOpen(e.target.checked),
								className: "size-4 accent-primary"
							}), "Listing is open / accepting applications"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					onClick: save,
					disabled: busy,
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), job ? "Save" : "Post job"]
				}) })
			]
		})
	});
}
function OrdersTab() {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const { data: orders = [], isLoading } = useQuery({
		queryKey: [
			"orders",
			"client",
			user?.id
		],
		enabled: !!user,
		queryFn: () => listOrders("client")
	});
	const [review, setReview] = (0, import_react.useState)(null);
	async function handleComplete(orderId) {
		try {
			await completeOrder(orderId);
			qc.invalidateQueries({ queryKey: ["orders", "client"] });
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transactions"] });
			toast.success("Order completed — builder paid.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Action failed");
		}
	}
	async function handleCancel(orderId) {
		try {
			await cancelOrder(orderId);
			qc.invalidateQueries({ queryKey: ["orders", "client"] });
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transactions"] });
			toast.success("Order cancelled — you were refunded.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Action failed");
		}
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TransactionRows, { rows: 4 });
	if (orders.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Package,
		title: "No orders yet",
		description: "You haven't ordered any services yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3",
		children: [orders.map((o) => {
			const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META.in_progress;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium",
								children: o.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									formatDot(Number(o.amountDot)),
									" DOT · ",
									new Date(o.createdAt).toLocaleDateString()
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							className: cn("shrink-0", meta.tone),
							children: meta.label
						})]
					}),
					o.deliveryNote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 rounded-lg bg-muted/50 p-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: "Delivery: "
						}), o.deliveryNote]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [(o.status === "in_progress" || o.status === "delivered") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "hero",
							size: "sm",
							onClick: () => handleComplete(o.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Confirm & pay"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => handleCancel(o.id),
							children: "Cancel"
						})] }), o.status === "completed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setReview({
								id: o.id,
								title: o.title
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-4" }), " Leave review"]
						})]
					})
				]
			}, o.id);
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewDialog, {
			order: review,
			onClose: () => setReview(null)
		})]
	});
}
function ReviewDialog({ order, onClose }) {
	const [rating, setRating] = (0, import_react.useState)(5);
	const [comment, setComment] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit() {
		if (!order) return;
		setBusy(true);
		try {
			const { error } = await supabase.rpc("review_service_order", {
				_order_id: order.id,
				_rating: rating,
				_comment: comment.trim() || void 0
			});
			if (error) throw error;
			toast.success("Thanks for your review!");
			onClose();
			setRating(5);
			setComment("");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not submit review");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!order,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Review: ", order?.title] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "How was the work?" })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setRating(n),
						"aria-label": `${n} stars`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-7", n <= rating ? "fill-gold text-gold" : "text-muted-foreground") })
					}, n))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: comment,
					onChange: (e) => setComment(e.target.value),
					placeholder: "Share details about your experience (optional)",
					maxLength: 1e3
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "hero",
				onClick: submit,
				disabled: busy,
				children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Submit review"]
			}) })
		] })
	});
}
function SellTab() {
	const { user, roles } = useDotAuth();
	const isFounder = roles.includes("founder");
	const { data: profile, isLoading: pLoading } = useMyBuilderProfile();
	const { data: services = [] } = useQuery({
		queryKey: ["my_services", user?.id],
		enabled: !!user,
		queryFn: () => listServices()
	});
	const { data: orders = [] } = useQuery({
		queryKey: [
			"orders",
			"builder",
			user?.id
		],
		enabled: !!user,
		queryFn: () => listOrders("builder")
	});
	const { data: myJobs = [] } = useQuery({
		queryKey: ["my_job_listings", user?.id],
		enabled: !!user,
		queryFn: () => listJobs()
	});
	const { data: stats } = useBuilderStats(user?.id);
	const qc = useQueryClient();
	const [editService, setEditService] = (0, import_react.useState)(null);
	const [editJob, setEditJob] = (0, import_react.useState)(null);
	const [deliveryOrder, setDeliveryOrder] = (0, import_react.useState)(null);
	async function handleDeliver(orderId, note) {
		try {
			await deliverOrder(orderId, note || void 0);
			qc.invalidateQueries({ queryKey: ["orders", "builder"] });
			toast.success("Marked as delivered.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not deliver");
		}
	}
	async function handleDeleteService(id) {
		try {
			await deleteService(id);
			qc.invalidateQueries({ queryKey: ["my_services"] });
			qc.invalidateQueries({ queryKey: ["services"] });
			toast.success("Service removed.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not remove");
		}
	}
	async function handleDeleteJob(id) {
		try {
			await deleteJob(id);
			qc.invalidateQueries({ queryKey: ["job_listings"] });
			qc.invalidateQueries({ queryKey: ["my_job_listings"] });
			toast.success("Job listing removed.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not remove");
		}
	}
	if (pLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.StatCards, { count: 3 });
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuilderProfileForm, {})
	});
	const myServices = services.filter((s) => s.builderId === user?.id);
	const myOwnJobs = myJobs.filter((j) => j.ventureId === user?.id);
	const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "delivered");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Earned",
						value: `${formatDot(Number(stats?.total_earned ?? 0))} DOT`,
						icon: Wallet,
						accent: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Completed",
						value: String(Number(stats?.orders_completed ?? 0)),
						icon: CircleCheck,
						accent: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Rating",
						value: Number(stats?.review_count ?? 0) > 0 ? String(Number(stats?.avg_rating)) : "—",
						sub: Number(stats?.review_count ?? 0) > 0 ? "★ avg" : "no reviews yet",
						icon: Star,
						accent: "gold"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuilderProfileForm, { existing: profile }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Your gig services"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					onClick: () => setEditService("new"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New service"]
				})]
			}), myServices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Store,
				title: "No services yet",
				description: "Create a service to start earning DOT.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					onClick: () => setEditService("new"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New service"]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				children: myServices.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between rounded-xl border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-medium",
							children: s.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								s.category,
								" · ",
								formatDot(s.priceDot),
								" DOT ",
								!s.isActive && "· hidden"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => setEditService(s),
							"aria-label": "Edit service",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => handleDeleteService(s.id),
							"aria-label": "Delete service",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-destructive" })
						})]
					})]
				}, s.id))
			})] }),
			isFounder && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Your job listings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					onClick: () => setEditJob("new"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Post a job"]
				})]
			}), myOwnJobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Briefcase,
				title: "No job listings yet",
				description: "Post a job to find full-time, part-time, or contract talent.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					size: "sm",
					onClick: () => setEditJob("new"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Post a job"]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: myOwnJobs.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between rounded-xl border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-medium",
							children: j.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								j.category,
								" · ",
								formatDot(j.salaryDot),
								" DOT ",
								!j.isOpen && "· closed"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => setEditJob(j),
							"aria-label": "Edit job",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => handleDeleteJob(j.id),
							"aria-label": "Delete job",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-destructive" })
						})]
					})]
				}, j.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Incoming orders"
			}), activeOrders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				variant: "inline",
				icon: Package,
				title: "No active orders",
				description: "No active orders right now."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: activeOrders.map((o) => {
					const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META.in_progress;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: o.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [formatDot(Number(o.amountDot)), " DOT"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: cn("shrink-0", meta.tone),
									children: meta.tone && meta.label
								})]
							}),
							o.requirements && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 rounded-lg bg-muted/50 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Brief: "
								}), o.requirements]
							}),
							o.status === "in_progress" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "hero",
								size: "sm",
								className: "mt-4",
								onClick: () => setDeliveryOrder({
									id: o.id,
									title: o.title
								}),
								children: "Mark delivered"
							})
						]
					}, o.id);
				})
			})] }),
			editService !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceFormDialog, {
				service: editService === "new" ? null : editService,
				onClose: () => setEditService(null)
			}),
			editJob !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobFormDialog, {
				job: editJob === "new" ? void 0 : editJob,
				onClose: () => setEditJob(null)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryDialog, {
				orderId: deliveryOrder?.id ?? null,
				orderTitle: deliveryOrder?.title ?? "",
				onClose: () => setDeliveryOrder(null),
				onDeliver: handleDeliver
			})
		]
	});
}
function BuilderProfileForm({ existing }) {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const [headline, setHeadline] = (0, import_react.useState)(existing?.headline ?? "");
	const [bio, setBio] = (0, import_react.useState)(existing?.bio ?? "");
	const [skills, setSkills] = (0, import_react.useState)((existing?.skills ?? []).join(", "));
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function save() {
		if (!user) return;
		if (!headline.trim()) {
			toast.error("Add a headline so clients know what you do.");
			return;
		}
		setBusy(true);
		try {
			const { error } = await supabase.from("builder_profiles").upsert({
				id: user.id,
				headline: headline.trim(),
				bio: bio.trim() || null,
				skills: skills.split(",").map((s) => s.trim()).filter(Boolean)
			});
			if (error) throw error;
			qc.invalidateQueries({ queryKey: ["builder_profile", user.id] });
			toast.success(existing ? "Profile updated." : "Builder profile created — start listing services!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: existing ? "Builder profile" : "Become a builder"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Tell clients what you do, then list services to earn DOT."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "headline",
							children: "Headline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "headline",
							value: headline,
							onChange: (e) => setHeadline(e.target.value),
							placeholder: "e.g. Brand & product designer for African startups",
							maxLength: 120
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "bio",
							children: "Bio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "bio",
							value: bio,
							onChange: (e) => setBio(e.target.value),
							maxLength: 1e3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "skills",
							children: "Skills (comma separated)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "skills",
							value: skills,
							onChange: (e) => setSkills(e.target.value),
							placeholder: "Figma, Branding, UI"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						onClick: save,
						disabled: busy,
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), existing ? "Save profile" : "Create profile"]
					})
				]
			})
		]
	});
}
function ServiceFormDialog({ service, onClose }) {
	const qc = useQueryClient();
	const [title, setTitle] = (0, import_react.useState)(service?.title ?? "");
	const [description, setDescription] = (0, import_react.useState)(service?.description ?? "");
	const [category, setCategory] = (0, import_react.useState)(service?.category ?? WORK_CATEGORIES[0]);
	const [price, setPrice] = (0, import_react.useState)(service?.priceDot ?? 1e3);
	const [days, setDays] = (0, import_react.useState)(service?.deliveryDays ?? 3);
	const [active, setActive] = (0, import_react.useState)(service?.isActive ?? true);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function save() {
		if (!title.trim() || !description.trim()) {
			toast.error("Title and description are required.");
			return;
		}
		if (price <= 0 || days <= 0) {
			toast.error("Price and delivery time must be positive.");
			return;
		}
		setBusy(true);
		try {
			const payload = {
				title: title.trim(),
				description: description.trim(),
				category,
				priceDot: Math.floor(price),
				deliveryDays: Math.floor(days),
				isActive: active
			};
			if (service) await updateService(service.id, payload);
			else await createService(payload);
			qc.invalidateQueries({ queryKey: ["my_services"] });
			qc.invalidateQueries({ queryKey: ["services"] });
			toast.success(service ? "Service updated." : "Service published.");
			onClose();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: service ? "Edit service" : "New service" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Clients pay in DOT and you're paid on completion." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "s-title",
							children: "Title"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "s-title",
							value: title,
							onChange: (e) => setTitle(e.target.value),
							maxLength: 120
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "s-desc",
							children: "Description"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "s-desc",
							value: description,
							onChange: (e) => setDescription(e.target.value),
							maxLength: 2e3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: category,
							onValueChange: setCategory,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: WORK_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c,
								children: c
							}, c)) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "s-price",
								children: "Price (DOT)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "s-price",
								type: "number",
								min: 1,
								value: price,
								onChange: (e) => setPrice(Number(e.target.value))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "s-days",
								children: "Delivery (days)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "s-days",
								type: "number",
								min: 1,
								value: days,
								onChange: (e) => setDays(Number(e.target.value))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: active,
							onChange: (e) => setActive(e.target.checked),
							className: "size-4 accent-primary"
						}), "Visible in marketplace"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "hero",
				onClick: save,
				disabled: busy,
				children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), service ? "Save" : "Publish"]
			}) })
		] })
	});
}
//#endregion
export { WorkPage as component };
