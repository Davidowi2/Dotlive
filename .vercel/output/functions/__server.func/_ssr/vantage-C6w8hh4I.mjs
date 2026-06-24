import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { Ft as ArrowRight, It as ArrowLeft, k as RefreshCw, l as TriangleAlert, nt as Gauge, p as Target, q as LoaderCircle, u as TrendingUp, v as Sparkles, vt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { l as formatDot } from "./constants-DV8g_Ppd.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as StatCard } from "./StatCard-Wbb7_aCv.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vantage-C6w8hh4I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
/**
* Vantage API — wraps the Fastify /api/vantage/* endpoints.
*/
async function submitAssessment(answers) {
	return (await dotApi.post("/api/vantage/submit", { answers })).assessment;
}
async function getVantageHistory() {
	return (await dotApi.get("/api/vantage/history")).assessments ?? [];
}
var VANTAGE_CATEGORIES = [
	{
		key: "founder",
		label: "Founder",
		weight: 15,
		questions: [
			{
				id: "founder_1",
				text: "How committed are you to building this venture full-time?"
			},
			{
				id: "founder_2",
				text: "How relevant is your experience to this problem space?"
			},
			{
				id: "founder_3",
				text: "How resilient have you been through past setbacks?"
			}
		]
	},
	{
		key: "problem",
		label: "Problem",
		weight: 15,
		questions: [
			{
				id: "problem_1",
				text: "How clearly can you articulate the problem you solve?"
			},
			{
				id: "problem_2",
				text: "How painful is this problem for your customers?"
			},
			{
				id: "problem_3",
				text: "How frequently do customers face this problem?"
			}
		]
	},
	{
		key: "market",
		label: "Market",
		weight: 15,
		questions: [
			{
				id: "market_1",
				text: "How large is your addressable market?"
			},
			{
				id: "market_2",
				text: "How fast is your market growing?"
			},
			{
				id: "market_3",
				text: "How well do you understand your competitive landscape?"
			}
		]
	},
	{
		key: "validation",
		label: "Validation",
		weight: 15,
		questions: [
			{
				id: "validation_1",
				text: "How much customer evidence supports your solution?"
			},
			{
				id: "validation_2",
				text: "How strong is your early traction (users/waitlist)?"
			},
			{
				id: "validation_3",
				text: "How much have customers paid or committed to pay?"
			}
		]
	},
	{
		key: "product",
		label: "Product",
		weight: 10,
		questions: [{
			id: "product_1",
			text: "How mature is your product (idea → MVP → live)?"
		}, {
			id: "product_2",
			text: "How well does your product solve the core problem?"
		}]
	},
	{
		key: "team",
		label: "Team",
		weight: 10,
		questions: [{
			id: "team_1",
			text: "How complete is your founding team for what you need now?"
		}, {
			id: "team_2",
			text: "How well does your team cover key skills (tech, business)?"
		}]
	},
	{
		key: "revenue",
		label: "Revenue",
		weight: 10,
		questions: [{
			id: "revenue_1",
			text: "How proven is your revenue model?"
		}, {
			id: "revenue_2",
			text: "How consistent is your revenue or sales pipeline?"
		}]
	},
	{
		key: "scalability",
		label: "Scalability",
		weight: 5,
		questions: [{
			id: "scalability_1",
			text: "How easily can your model scale across markets?"
		}]
	},
	{
		key: "investment_readiness",
		label: "Investment Readiness",
		weight: 5,
		questions: [{
			id: "investment_readiness_1",
			text: "How prepared are you to raise (deck, data room, metrics)?"
		}]
	}
];
var TOTAL_QUESTIONS = VANTAGE_CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0);
var SCALE = [
	{
		v: 1,
		label: "Very low"
	},
	{
		v: 2,
		label: "Low"
	},
	{
		v: 3,
		label: "Medium"
	},
	{
		v: 4,
		label: "High"
	},
	{
		v: 5,
		label: "Very high"
	}
];
var FLAT_QUESTIONS = VANTAGE_CATEGORIES.flatMap((c) => c.questions.map((q) => ({
	...q,
	category: c.label
})));
function VantagePage() {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const { data: assessments = [], isLoading } = useQuery({
		queryKey: ["assessments", user?.id],
		enabled: !!user,
		queryFn: getVantageHistory
	});
	const [taking, setTaking] = (0, import_react.useState)(false);
	const [idx, setIdx] = (0, import_react.useState)(0);
	const [answers, setAnswers] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const latest = assessments[assessments.length - 1];
	const history = (0, import_react.useMemo)(() => assessments.map((a) => ({
		date: new Date(a.createdAt).toLocaleDateString("en", {
			month: "short",
			day: "numeric"
		}),
		vantage: a.vantagePoint,
		fundability: a.fundability
	})), [assessments]);
	const current = FLAT_QUESTIONS[idx];
	const progress = (idx + (answers[current?.id] ? 1 : 0)) / TOTAL_QUESTIONS * 100;
	const answeredAll = FLAT_QUESTIONS.every((q) => answers[q.id]);
	function setAnswer(v) {
		setAnswers((a) => ({
			...a,
			[current.id]: v
		}));
		if (idx < FLAT_QUESTIONS.length - 1) setTimeout(() => setIdx((i) => i + 1), 150);
	}
	async function submit() {
		if (!user || !answeredAll) return;
		setBusy(true);
		try {
			const result = await submitAssessment(answers);
			toast.success(`Vantage complete! You scored ${result.vantagePoint} points.`);
			qc.invalidateQueries({ queryKey: ["assessments", user.id] });
			qc.invalidateQueries({ queryKey: ["founder_profile", user.id] });
			setTaking(false);
			setIdx(0);
			setAnswers({});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save assessment");
		} finally {
			setBusy(false);
		}
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.Header, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.StatCards, { count: 3 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CategoryBreakdown, {})
	] });
	if (taking) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: current.category }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					idx + 1,
					" / ",
					TOTAL_QUESTIONS
				] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: progress,
				className: "mt-2"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-6 sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: current.text
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 grid gap-2",
					children: SCALE.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setAnswer(s.v),
						className: cn("flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-primary/50", answers[current.id] === s.v ? "border-primary bg-primary/10" : "border-border"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: s.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-sm text-muted-foreground",
							children: s.v
						})]
					}, s.v))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						onClick: () => setIdx((i) => Math.max(0, i - 1)),
						disabled: idx === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back"]
					}), idx === FLAT_QUESTIONS.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "hero",
						onClick: submit,
						disabled: !answeredAll || busy,
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "See my results"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => setIdx((i) => Math.min(FLAT_QUESTIONS.length - 1, i + 1)),
						disabled: !answers[current.id],
						children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					})]
				})
			]
		})]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Vantage",
		subtitle: "Your measurable venture intelligence score.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "hero",
			onClick: () => setTaking(true),
			children: [latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4" }), latest ? "Retake assessment" : "Take assessment"]
		})
	}), !latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		variant: "full-page",
		icon: Gauge,
		title: "Take your first Vantage",
		description: `Answer ${TOTAL_QUESTIONS} quick questions across 9 categories. We'll generate your Vantage Point, Fundability and Investment Readiness, plus a venture report.`,
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "hero",
			onClick: () => setTaking(true),
			children: ["Start now ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
		})
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Vantage Point",
					value: formatDot(latest.vantagePoint),
					sub: "/ 1000",
					icon: Gauge,
					accent: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Fundability",
					value: `${latest.fundability}%`,
					icon: TrendingUp,
					accent: "gold"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Investment Ready",
					value: `${latest.investmentReadiness}%`,
					icon: Target,
					accent: "primary"
				})
			]
		}),
		history.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 rounded-2xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Progress over time"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-64",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: history,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								stroke: "var(--color-border)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "date",
								tick: {
									fontSize: 12,
									fill: "var(--color-muted-foreground)"
								},
								axisLine: false,
								tickLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: {
									fontSize: 12,
									fill: "var(--color-muted-foreground)"
								},
								axisLine: false,
								tickLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: {
									background: "var(--color-card)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.75rem",
									fontSize: "12px",
									color: "var(--color-foreground)"
								},
								cursor: {
									stroke: "var(--color-border)",
									strokeWidth: 1
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "vantage",
								name: "Vantage Point",
								stroke: "var(--color-primary)",
								strokeWidth: 2.5,
								dot: {
									fill: "var(--color-primary)",
									strokeWidth: 0,
									r: 4
								},
								activeDot: {
									r: 6,
									fill: "var(--color-primary)"
								}
							})
						]
					})
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 rounded-2xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Category breakdown"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-4 sm:grid-cols-2",
				children: VANTAGE_CATEGORIES.map((c) => {
					const score = latest.categoryScores?.[c.key] ?? 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: c.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [score, "%"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: score,
						className: "mt-1.5"
					})] }, c.key);
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
					title: "Strengths",
					icon: CircleCheck,
					tone: "text-primary",
					items: latest.report?.strengths?.map((s) => `${s.label} (${s.score}%)`) ?? []
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
					title: "Weaknesses",
					icon: TriangleAlert,
					tone: "text-gold",
					items: latest.report?.weaknesses?.map((s) => `${s.label} (${s.score}%)`) ?? []
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
					title: "Next actions",
					icon: Sparkles,
					tone: "text-primary",
					items: latest.report?.nextActions ?? []
				})
			]
		})
	] })] });
}
function ReportCard({ title, icon: Icon, tone, items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-5", tone) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display font-semibold",
				children: title
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-2.5 text-sm",
			children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-2 text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-foreground",
						children: "•"
					}),
					" ",
					it
				]
			}, i))
		})]
	});
}
//#endregion
export { VantagePage as component };
