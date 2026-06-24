import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Quote, At as BookOpen, Et as Building2, I as Network, Mt as Award, O as Rocket, Pt as ArrowRight, Q as GraduationCap, S as ShieldCheck, St as ChartColumn, Tt as CalendarCheck, Z as Hammer, c as Trophy, dt as Coins, i as Users, o as UserPlus, r as Wallet, tt as Gauge, u as TrendingUp, v as Sparkles, yt as ChevronRight } from "../_libs/lucide-react.mjs";
import { n as SiteHeader, t as SiteFooter } from "./SiteFooter-D7ueBtYj.mjs";
import { t as hero_dot_default } from "./hero-dot-B1xFGgsE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes--h1E52Dc.js
var import_jsx_runtime = require_jsx_runtime();
var journey = [
	{
		label: "Assess",
		icon: Gauge,
		desc: "Measure venture readiness with Vantage."
	},
	{
		label: "Learn",
		icon: BookOpen,
		desc: "Founder education via DOT Academy."
	},
	{
		label: "Improve",
		icon: TrendingUp,
		desc: "Act on AI-driven recommendations."
	},
	{
		label: "Validate",
		icon: ShieldCheck,
		desc: "Prove the market and traction."
	},
	{
		label: "Pitch",
		icon: Trophy,
		desc: "Compete and earn selection."
	},
	{
		label: "Fund",
		icon: Wallet,
		desc: "Discover capital on DOT Demo."
	},
	{
		label: "Scale",
		icon: TrendingUp,
		desc: "Grow with community distribution."
	}
];
var pillars = [
	{
		name: "Vantage",
		tagline: "Venture intelligence engine",
		desc: "A 0–1000 Vantage Point measuring quality, founder readiness, market strength and fundability.",
		icon: ChartColumn,
		accent: "primary"
	},
	{
		name: "DOT Academy",
		tagline: "Founder education",
		desc: "Progression-based learning paths — powered by Whop, tracked and scored by DOT.",
		icon: GraduationCap,
		accent: "teal"
	},
	{
		name: "Founder Sessions",
		tagline: "Live access",
		desc: "Sessions with entrepreneurs, investors, operators and industry experts.",
		icon: CalendarCheck,
		accent: "primary"
	},
	{
		name: "Pitchathons",
		tagline: "Selection & evaluation",
		desc: "Applications, judge portals, scoring and leaderboards to surface the best.",
		icon: Trophy,
		accent: "gold"
	},
	{
		name: "DOT Demo",
		tagline: "Capital discovery",
		desc: "An investor marketplace connecting fundable ventures with capital partners.",
		icon: Building2,
		accent: "gold"
	},
	{
		name: "Community OS",
		tagline: "Community-led growth",
		desc: "Referral links, dashboards and DOT rewards that power founder acquisition.",
		icon: Network,
		accent: "purple"
	}
];
var pilotStats = [
	{
		value: "10,000",
		label: "Founders",
		accent: "primary"
	},
	{
		value: "100",
		label: "Communities",
		accent: "teal"
	},
	{
		value: "100",
		label: "Community Leaders",
		accent: "gold"
	},
	{
		value: "$200K",
		label: "Capital Target",
		accent: "purple"
	}
];
var builderJourney = [
	{
		icon: UserPlus,
		label: "Sign up",
		sub: "Join free in 2 min",
		step: 1
	},
	{
		icon: Coins,
		label: "Get 500 DOT",
		sub: "Instant starter grant",
		step: 2
	},
	{
		icon: Hammer,
		label: "Build & Earn",
		sub: "Gigs, Academy, community",
		step: 3
	},
	{
		icon: Sparkles,
		label: "Upgrade",
		sub: "Become a Founder (2,000 DOT)",
		step: 4
	},
	{
		icon: Rocket,
		label: "Access Capital",
		sub: "DOT Demo, investors, pitches",
		step: 5
	}
];
var testimonials = [
	{
		quote: "DOT gave me a way to prove my venture was fundable. I raised ₦2M within 3 months of completing my Vantage assessment.",
		name: "Amara Okafor",
		venture: "PayAfrika",
		location: "Lagos",
		initials: "AO",
		accentClass: "bg-primary/20 text-primary"
	},
	{
		quote: "The Vantage score helped me understand exactly what investors look for. Before DOT I was just guessing.",
		name: "Kwame Asante",
		venture: "AgriConnect",
		location: "Accra",
		initials: "KA",
		accentClass: "bg-teal/20 text-teal"
	},
	{
		quote: "I earned my first 1,000 DOT doing gigs, then upgraded to Founder. The structure made all the difference.",
		name: "Fatima Bello",
		venture: "MamaList",
		location: "Abuja",
		initials: "FB",
		accentClass: "bg-gold/20 text-gold"
	}
];
var trustedBy = [
	"TechCrunch Africa",
	"Disrupt Africa",
	"Future Africa",
	"Microtraction",
	"Ventures Platform"
];
var byTheNumbers = [
	{
		value: "12,000+",
		label: "Active Founders",
		accentFrom: "from-primary/20",
		accentTo: "to-primary/5",
		textClass: "text-primary"
	},
	{
		value: "₦45M+",
		label: "Capital Deployed",
		accentFrom: "from-gold/20",
		accentTo: "to-gold/5",
		textClass: "text-gold"
	},
	{
		value: "47",
		label: "Countries",
		accentFrom: "from-teal/20",
		accentTo: "to-teal/5",
		textClass: "text-teal"
	},
	{
		value: "94%",
		label: "Founder Success Rate",
		accentFrom: "from-purple/20",
		accentTo: "to-purple/5",
		textClass: "text-purple"
	}
];
var accentIcon = {
	primary: "from-primary/20 to-primary/5 text-primary",
	teal: "from-teal/20 to-teal/5 text-teal",
	gold: "from-gold/20 to-gold/5 text-gold",
	purple: "from-purple/20 to-purple/5 text-purple"
};
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustedBySection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ByTheNumbersSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuilderValueSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorksSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuilderJourneySection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneySection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillarsSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PilotStatsSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestimonialsSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudiencesSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCtaSection, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
function HeroSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative min-h-[90vh] overflow-hidden bg-background flex items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl w-full px-6 py-24 lg:px-12 lg:py-32",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 mb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-10 bg-primary/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tracking-editorial text-primary",
						children: "Africa's Venture Network"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display font-light leading-[0.92] tracking-[-0.04em] text-foreground max-w-5xl",
					style: { fontSize: "clamp(3rem, 9vw, 7.5rem)" },
					children: [
						"From idea",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"to funded.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "italic text-primary",
							children: "Measurably."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-10 max-w-md text-lg text-muted-foreground leading-relaxed font-light",
					children: "DOT moves founders through a single, measurable journey — combining venture intelligence, education and capital access."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 flex flex-col gap-4 sm:flex-row sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/auth",
						search: { mode: "signup" },
						className: "inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200",
						children: ["Begin your journey ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/platform",
						className: "inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors",
						children: "Explore the platform"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-16 text-[10px] tracking-widest uppercase text-muted-foreground/60",
					children: "Trusted by 12,000+ founders across 47 countries"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 -z-10 pointer-events-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: hero_dot_default,
				alt: "",
				className: "absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 dark:opacity-5"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" })]
		})]
	});
}
function TrustedBySection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-12 lg:px-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-8 bg-border" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground/60",
					children: "As seen in"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center gap-8 lg:gap-14",
				children: trustedBy.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] tracking-widest uppercase font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors",
					children: name
				}, name))
			})]
		})
	});
}
function ByTheNumbersSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-8 mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-7xl font-light text-muted-foreground/15 leading-none select-none",
					children: "05"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground",
					children: "Traction"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl font-light tracking-tight",
					children: "By the numbers"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-0 border border-border sm:grid-cols-2 lg:grid-cols-4",
				children: byTheNumbers.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `p-10 ${i < byTheNumbers.length - 1 ? "border-r border-border" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `font-display text-6xl font-light tracking-tight tabular ${s.textClass}`,
						children: s.value
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs tracking-widest uppercase text-muted-foreground font-medium",
						children: s.label
					})]
				}, s.label))
			})]
		})
	});
}
function BuilderValueSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border/40 bg-card/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-primary",
						children: "For builders"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-3xl font-bold sm:text-4xl",
						children: "What you get as a Builder"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-muted-foreground",
						children: "Start free. Earn your way to Founder status. Everything you need in one place."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 grid gap-6 md:grid-cols-3",
				children: [
					{
						icon: Coins,
						title: "Earn DOT",
						desc: "Complete tasks, get paid in DOT. Build your wallet from day one.",
						accent: "primary"
					},
					{
						icon: BookOpen,
						title: "Learn Skills",
						desc: "Access courses, earn DOT rewards, build your founder knowledge.",
						accent: "teal"
					},
					{
						icon: Award,
						title: "Build Portfolio",
						desc: "Track your work history, reviews, and Vantage score over time.",
						accent: "gold"
					}
				].map((c) => {
					const iconCls = accentIcon[c.accent];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-border hover:shadow-soft",
						style: { backdropFilter: "blur(8px)" },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${iconCls.replace("text-primary", "").replace("text-teal", "").replace("text-gold", "")} border border-border/40`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c.icon, { className: `size-7 ${iconCls.split(" ").find((x) => x.startsWith("text-"))}` })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-5 font-display text-xl font-semibold",
								children: c.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: c.desc
							})
						]
					}, c.title);
				})
			})]
		})
	});
}
function HowItWorksSection() {
	const steps = [
		{
			number: "01",
			icon: Hammer,
			title: "Build",
			desc: "Start as a Builder. Get 500 DOT instantly. Pick up gigs, learn skills, earn more.",
			accent: "text-primary",
			borderAccent: "border-primary/30",
			bgAccent: "from-primary/15 to-primary/5"
		},
		{
			number: "02",
			icon: Coins,
			title: "Earn",
			desc: "Complete tasks, finish Academy courses, earn DOT. Your wallet grows with your skills.",
			accent: "text-teal",
			borderAccent: "border-teal/30",
			bgAccent: "from-teal/15 to-teal/5"
		},
		{
			number: "03",
			icon: Rocket,
			title: "Upgrade",
			desc: "Use your DOT to upgrade to Founder. Access capital, Pitchathons, and investor meetings.",
			accent: "text-gold",
			borderAccent: "border-gold/30",
			bgAccent: "from-gold/15 to-gold/5"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "bg-grid border-y border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-primary",
						children: "Simple by design"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-3xl font-bold sm:text-4xl",
						children: "How DOT works"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-4 max-w-xl text-muted-foreground",
						children: "Three steps from zero to fundable."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-16 grid gap-0 md:grid-cols-3",
				children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex flex-col items-center text-center px-6 md:px-8",
					children: [
						i < steps.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute right-0 top-10 hidden h-px w-1/2 bg-gradient-to-r from-border to-transparent md:block" }),
						i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-0 top-10 hidden h-px w-1/2 bg-gradient-to-l from-border to-transparent md:block" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `relative flex size-20 items-center justify-center rounded-2xl border ${s.borderAccent} bg-gradient-to-br ${s.bgAccent} shadow-soft`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: `size-8 ${s.accent}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold ${s.accent}`,
								children: s.number
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: `mt-5 font-display text-xl font-semibold ${s.accent}`,
							children: s.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground",
							children: s.desc
						}),
						i < steps.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "mt-6 size-5 rotate-90 text-border md:hidden" })
					]
				}, s.title))
			})]
		})
	});
}
function BuilderJourneySection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-primary",
						children: "The progression"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-3xl font-bold sm:text-4xl",
						children: "Your Builder journey"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-muted-foreground",
						children: "Every DOT member follows the same path. There are no shortcuts — just progress."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-14 relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-10 right-10 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-8 lg:grid-cols-5",
					children: builderJourney.map((stage, i) => {
						const isFirst = i === 0;
						const iconBg = i === 0 ? "from-primary/25 to-primary/10 border-primary/40 shadow-glow" : i === 1 ? "from-gold/20 to-gold/5 border-gold/30" : i === 2 ? "from-teal/20 to-teal/5 border-teal/30" : i === 3 ? "from-purple/20 to-purple/5 border-purple/30" : "from-gold/25 to-gold/10 border-gold/40";
						const iconColor = i === 0 ? "text-primary" : i === 1 ? "text-gold" : i === 2 ? "text-teal" : i === 3 ? "text-purple" : "text-gold";
						const numColor = i === 0 ? "text-primary" : "text-muted-foreground";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `relative flex size-20 items-center justify-center rounded-2xl border bg-gradient-to-br ${iconBg}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(stage.icon, { className: `size-8 ${iconColor}` }), isFirst && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground",
										children: "✓"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `mt-3 font-display text-xs font-bold uppercase tracking-widest ${numColor}`,
									children: ["Step ", stage.step]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 font-display text-base font-semibold",
									children: stage.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: stage.sub
								})
							]
						}, stage.label);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-14 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/auth",
					search: { mode: "signup" },
					className: "inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200",
					children: ["Start at Step 1 — it's free ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
				})
			})
		]
	});
}
function JourneySection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-8 mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-7xl font-light text-muted-foreground/15 leading-none select-none",
					children: "01"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground",
					children: "The Platform"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl font-light tracking-tight",
					children: "One progression. Seven stages."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-7",
				children: journey.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-card p-6 hover:bg-accent/30 transition-colors",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] tracking-widest uppercase text-muted-foreground/50",
							children: String(i + 1).padStart(2, "0")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-3 font-display text-base font-light",
							children: step.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs leading-relaxed text-muted-foreground/70",
							children: step.desc
						})
					]
				}, step.label))
			})]
		})
	});
}
function PillarsSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-8 mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-7xl font-light text-muted-foreground/15 leading-none select-none",
					children: "02"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground",
					children: "Six pillars"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl font-light tracking-tight",
					children: "Everything a venture needs"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3",
				children: pillars.map((p) => {
					const textCls = accentIcon[p.accent].split(" ").find((x) => x.startsWith("text-")) ?? "text-primary";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-card p-8 hover:bg-accent/20 transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(p.icon, { className: `size-5 ${textCls} mb-5` }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-lg font-light",
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `mt-1 text-xs tracking-widest uppercase ${textCls} opacity-70`,
								children: p.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-muted-foreground font-light",
								children: p.desc
							})
						]
					}, p.name);
				})
			})]
		})
	});
}
function PilotStatsSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border bg-primary text-primary-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial opacity-60",
					children: "Pilot program"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-4xl font-light tracking-tight",
					children: "Built to scale from 10K to 10M founders"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-0 border border-primary-foreground/20 lg:grid-cols-4",
				children: pilotStats.map((s, i) => {
					accentIcon[s.accent].split(" ").find((x) => x.startsWith("text-"));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `p-8 ${i < pilotStats.length - 1 ? "border-r border-primary-foreground/20" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-5xl font-light tracking-tight tabular text-primary-foreground",
							children: s.value
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[10px] tracking-widest uppercase text-primary-foreground/60",
							children: s.label
						})]
					}, s.label);
				})
			})]
		})
	});
}
function TestimonialsSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-8 mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-7xl font-light text-muted-foreground/15 leading-none select-none",
					children: "06"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground",
					children: "Voices"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl font-light tracking-tight",
					children: "Why builders love DOT"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-px bg-border md:grid-cols-3",
				children: testimonials.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-card p-8 flex flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quote, {
							className: "size-6 text-border mb-6",
							"aria-hidden": true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex-1 text-sm leading-relaxed text-muted-foreground font-light",
							children: [
								"\"",
								t.quote,
								"\""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 pt-6 border-t border-border flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${t.accentClass}`,
								children: t.initials
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-sm",
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										t.venture,
										" · ",
										t.location
									]
								})]
							})]
						})
					]
				}, t.name))
			})]
		})
	});
}
var audiences = [
	{
		title: "Founders",
		points: [
			"Complete Vantage",
			"Access Academy",
			"Enter Pitchathons",
			"Reach capital"
		],
		icon: Sparkles,
		accent: "primary"
	},
	{
		title: "Community Leaders",
		points: [
			"Build communities",
			"Recruit founders",
			"Track progress",
			"Earn DOT rewards"
		],
		icon: Users,
		accent: "teal"
	},
	{
		title: "Investors",
		points: [
			"Browse ventures",
			"Filter by Vantage",
			"Request meetings",
			"Join DOT Demo"
		],
		icon: Building2,
		accent: "gold"
	}
];
function AudiencesSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-8 mb-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-7xl font-light text-muted-foreground/15 leading-none select-none",
					children: "07"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tracking-editorial text-muted-foreground",
					children: "The network"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl font-light tracking-tight",
					children: "Built for the whole network"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-px bg-border md:grid-cols-3",
				children: audiences.map((a) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-card p-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: `font-display text-xl font-light ${accentIcon[a.accent].split(" ").find((x) => x.startsWith("text-")) ?? "text-primary"}`,
							children: a.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-5 space-y-2.5",
							children: a.points.map((pt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 text-sm text-muted-foreground font-light",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px w-4 bg-border shrink-0" }), pt]
							}, pt))
						})]
					}, a.title);
				})
			})]
		})
	});
}
function FinalCtaSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-7xl px-6 py-28 lg:px-12 lg:py-36",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4 mb-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-10 bg-primary/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tracking-editorial text-primary",
							children: "Begin"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display font-light tracking-[-0.04em] text-foreground",
						style: {
							fontSize: "clamp(2.5rem, 7vw, 6rem)",
							lineHeight: "0.95"
						},
						children: [
							"Move your",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"venture",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "italic text-primary",
								children: "forward."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-12 flex flex-col gap-4 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/auth",
							search: { mode: "signup" },
							className: "inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200",
							children: ["Get started free ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/platform",
							className: "text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors",
							children: "See the platform"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-8 text-[10px] tracking-widest uppercase text-muted-foreground/50",
						children: "Free to start. No credit card needed."
					})
				]
			})
		})
	});
}
//#endregion
export { LandingPage as component };
