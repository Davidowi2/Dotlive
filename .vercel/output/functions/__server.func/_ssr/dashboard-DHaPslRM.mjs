import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Ft as ArrowRight, K as Lock, Ot as Briefcase, Pt as ArrowUpRight, Q as Hammer, _ as Star, g as Store, gt as CircleUser, jt as BookOpen, mt as Circle, nt as Gauge, r as Wallet, u as TrendingUp, v as Sparkles, vt as CircleCheck } from "../_libs/lucide-react.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { c as dotToNaira, l as formatDot, r as JOURNEY_STAGES, u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { t as AppShell } from "./AppShell-C3C0RWJM.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as StatCard } from "./StatCard-Wbb7_aCv.mjs";
import { t as getBalance } from "./wallet-jd8p92Cg.mjs";
import { a as useMyEnrollments, i as useMyBuilderProfile, n as useBuilderStats, o as useMyMembership, r as useFounderProfile, t as useAssessments } from "./use-dot-data-DSqFe_0n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-DHaPslRM.js
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const { user, primaryRole, roles } = useDotAuth();
	const { data: walletData, isLoading: walletLoading } = useQuery({
		queryKey: ["wallet"],
		queryFn: getBalance,
		staleTime: 3e4
	});
	const balance = walletData?.balance ?? 0;
	const { data: founder, isLoading: founderLoading } = useFounderProfile();
	const { data: assessments = [], isLoading: assessLoading } = useAssessments();
	const { data: enrollments = [], isLoading: enrollLoading } = useMyEnrollments();
	const { data: membership } = useMyMembership();
	const { data: builderProfile } = useMyBuilderProfile();
	const { data: builderStats } = useBuilderStats(user?.id ?? void 0);
	const profile = user ? {
		name: user.name,
		id: user.id
	} : null;
	if (walletLoading || founderLoading || assessLoading || enrollLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.Header, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.StatCards, { count: 4 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.ProgressBar, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.ActionCards, {})
	] });
	const isFounder = roles.includes("founder");
	const isBuilderOnly = roles.length > 0 && !isFounder && !roles.some((r) => [
		"investor",
		"community_leader",
		"vendor",
		"capital_partner",
		"admin",
		"super_admin"
	].includes(r));
	const latest = assessments[assessments.length - 1];
	const prev = assessments.length >= 2 ? assessments[assessments.length - 2] : null;
	const vantagePoint = founder?.vantage_point ?? latest?.vantage_point ?? 0;
	const fundability = founder?.fundability ?? latest?.fundability ?? 0;
	const stage = founder?.stage ?? "Assess";
	const completed = enrollments.filter((e) => e.status === "completed").length;
	const currentStageIndex = JOURNEY_STAGES.indexOf(stage);
	const vantageTrend = prev ? {
		direction: vantagePoint > prev.vantage_point ? "up" : vantagePoint < prev.vantage_point ? "down" : "neutral",
		value: `${vantagePoint > prev.vantage_point ? "+" : ""}${vantagePoint - prev.vantage_point} pts`,
		label: "vs last assessment"
	} : void 0;
	const fundabilityTrend = prev ? {
		direction: fundability > prev.fundability ? "up" : fundability < prev.fundability ? "down" : "neutral",
		value: `${fundability > prev.fundability ? "+" : ""}${fundability - prev.fundability}%`,
		label: "vs last assessment"
	} : void 0;
	const subtitleParts = [
		founder?.venture_name,
		isFounder ? `Stage: ${stage}` : primaryRole,
		membership?.communities ? membership.communities.name : null
	].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Welcome back,",
			title: profile?.name || (isBuilderOnly ? "Builder" : "Founder"),
			subtitle: subtitleParts || void 0,
			action: isFounder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "hero",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/vantage",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), latest ? "Update Vantage" : "Take Vantage"]
				})
			}) : void 0
		}),
		isBuilderOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "DOT Balance",
					value: formatDot(balance),
					sub: `≈ ${formatNaira(dotToNaira(balance))}`,
					icon: Wallet,
					accent: "primary",
					href: "/wallet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Earned",
					value: `${formatDot(Number(builderStats?.total_earned ?? 0))} DOT`,
					sub: "from completed gigs",
					icon: Hammer,
					accent: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Gigs done",
					value: String(Number(builderStats?.orders_completed ?? 0)),
					icon: CircleCheck,
					accent: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Rating",
					value: Number(builderStats?.review_count ?? 0) > 0 ? String(Number(builderStats?.avg_rating)) : "—",
					sub: Number(builderStats?.review_count ?? 0) > 0 ? "★ avg" : "no reviews yet",
					icon: Star,
					accent: "gold"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Vantage Point",
					value: formatDot(vantagePoint),
					sub: "/ 1000",
					icon: Gauge,
					accent: "primary",
					trend: vantageTrend
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Fundability",
					value: `${fundability}%`,
					sub: "ready to raise",
					icon: TrendingUp,
					accent: "gold",
					trend: fundabilityTrend
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "DOT Balance",
					value: formatDot(balance),
					sub: `≈ ${formatNaira(dotToNaira(balance))}`,
					icon: Wallet,
					accent: "primary",
					href: "/wallet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Academy",
					value: `${completed}`,
					sub: "courses done",
					icon: BookOpen,
					accent: "gold",
					href: "/academy"
				})
			]
		}),
		isFounder && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 rounded-2xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Your progression"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted-foreground",
					children: [
						Math.max(currentStageIndex, 0),
						" of ",
						JOURNEY_STAGES.length,
						" stages"
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap items-center gap-2",
				children: JOURNEY_STAGES.map((label, i) => {
					const done = i < currentStageIndex;
					const current = i === currentStageIndex;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium", done && "border-primary/30 bg-primary/10 text-primary", current && "border-gold/40 bg-gold/10 text-gold", !done && !current && "border-border text-muted-foreground"),
							children: [done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-4" }), label]
						}), i < JOURNEY_STAGES.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden h-px w-4 bg-border sm:block" })]
					}, label);
				})
			})]
		}),
		isBuilderOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-2 rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Quick actions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Everything you can do as a Builder on DOT."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 grid gap-3 sm:grid-cols-2",
						children: [
							{
								label: "Browse gigs",
								desc: "Find work and earn DOT",
								to: "/work",
								icon: Store,
								cta: "Go to Gigs"
							},
							{
								label: "Browse jobs",
								desc: "Full-time & contract roles",
								to: "/work",
								icon: Briefcase,
								cta: "Go to Jobs"
							},
							{
								label: "Sell your skills",
								desc: "List a service",
								to: "/work",
								icon: Hammer,
								cta: "Start selling"
							},
							{
								label: "Academy",
								desc: "Learn and earn DOT rewards",
								to: "/academy",
								icon: BookOpen,
								cta: "Start learning"
							}
						].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: q.to,
							className: "flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(q.icon, { className: "size-5 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: q.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: q.desc
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-auto text-xs font-medium text-primary",
									children: [q.cta, " →"]
								})
							]
						}, q.label))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: builderProfile ? "Your builder profile is live." : "Complete your profile to attract clients."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/work",
							className: "flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUser, { className: "size-5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: builderProfile ? "Edit builder profile" : "Create builder profile" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-gold",
									children: "Become a Founder"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "Post jobs, take Vantage, raise funds. Costs 2,000 DOT."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									className: "mt-3 border-gold/40 text-gold hover:bg-gold/10",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/onboarding",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" }), " Upgrade (2,000 DOT)"]
									})
								})
							]
						})]
					})
				]
			})]
		}),
		!isBuilderOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-2 rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Recommended next actions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: latest ? "From your latest Vantage report" : "Take your Vantage assessment to unlock guidance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-3",
						children: [latest?.report && latest.report.nextActions?.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 rounded-xl border border-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary",
								children: i + 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 text-sm",
								children: a
							})]
						}, i)), !latest && isFounder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/vantage",
								children: ["Start your assessment ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Explore"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 grid grid-cols-2 gap-3",
					children: [
						{
							label: "Vantage",
							to: "/vantage",
							icon: Gauge
						},
						{
							label: "Academy",
							to: "/academy",
							icon: BookOpen
						},
						{
							label: "Sessions",
							to: "/sessions",
							icon: ArrowUpRight
						},
						{
							label: "Wallet",
							to: "/wallet",
							icon: Wallet
						}
					].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: q.to,
						className: "flex flex-col items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(q.icon, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: q.label
						})]
					}, q.label))
				})]
			})]
		})
	] });
}
//#endregion
export { Dashboard as component };
