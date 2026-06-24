import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { It as ArrowLeft, J as Lightbulb, St as Check, W as Mail, X as KeyRound, at as Eye, bt as ChevronRight, dt as Compass, ft as Coins, i as Users, jt as BookOpen, ot as EyeOff, q as LoaderCircle, u as TrendingUp, z as Minus } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-C-2KEfEk.mjs";
import { t as ApiError } from "./client-BT9fM0ow.mjs";
import { t as getGoogleAuthUrl } from "./auth-YjkHUMR9.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { t as Route } from "./auth-Bs523zR1.mjs";
import { n as jt, t as Lt } from "../_libs/input-otp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-D42jFI-m.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var InputOTP = import_react.forwardRef(({ className, containerClassName, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lt, {
	ref,
	containerClassName: cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName),
	className: cn("disabled:cursor-not-allowed", className),
	...props
}));
InputOTP.displayName = "InputOTP";
var InputOTPGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center", className),
	...props
}));
InputOTPGroup.displayName = "InputOTPGroup";
var InputOTPSlot = import_react.forwardRef(({ index, className, ...props }, ref) => {
	const { char, hasFakeCaret, isActive } = import_react.useContext(jt).slots[index];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: cn("relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md", isActive && "z-10 ring-1 ring-ring", className),
		...props,
		children: [char, hasFakeCaret && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000" })
		})]
	});
});
InputOTPSlot.displayName = "InputOTPSlot";
var InputOTPSeparator = import_react.forwardRef(({ ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	role: "separator",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
}));
InputOTPSeparator.displayName = "InputOTPSeparator";
var INTENT_OPTIONS = [
	{
		id: "earn",
		label: "I want to earn money doing tasks",
		sub: "Pick up gigs, get paid in DOT.",
		icon: Coins,
		accentClass: "text-primary border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
	},
	{
		id: "learn",
		label: "I want to learn new skills",
		sub: "Courses, tutorials, and real projects.",
		icon: BookOpen,
		accentClass: "text-teal border-teal/40 bg-teal/5 hover:bg-teal/10 hover:border-teal/60"
	},
	{
		id: "business",
		label: "I have a business idea or venture",
		sub: "Build, validate, pitch, and raise.",
		icon: Lightbulb,
		accentClass: "text-gold border-gold/40 bg-gold/5 hover:bg-gold/10 hover:border-gold/60"
	},
	{
		id: "invest",
		label: "I want to invest in African businesses",
		sub: "Discover and back founders.",
		icon: TrendingUp,
		accentClass: "text-purple border-purple/40 bg-purple/5 hover:bg-purple/10 hover:border-purple/60"
	},
	{
		id: "community",
		label: "I'm here for a community",
		sub: "Find your people, grow together.",
		icon: Users,
		accentClass: "text-teal border-teal/40 bg-teal/5 hover:bg-teal/10 hover:border-teal/60"
	},
	{
		id: "explore",
		label: "I'm not sure yet, just exploring",
		sub: "That's okay — we'll figure it out together.",
		icon: Compass,
		accentClass: "text-muted-foreground border-border bg-card hover:border-border/80"
	}
];
var TOPIC_CHIPS = [
	"Business basics",
	"Tech skills",
	"Design",
	"Marketing",
	"Finance",
	"Leadership",
	"Communication",
	"Sales",
	"Coding"
];
var BUSINESS_STAGES = [
	{
		id: "idea",
		label: "Just thinking about it"
	},
	{
		id: "building",
		label: "Started building something"
	},
	{
		id: "customers",
		label: "Already have customers"
	}
];
var INVEST_RANGES = [
	{
		id: "under1m",
		label: "Under ₦1M"
	},
	{
		id: "1m_10m",
		label: "₦1M – ₦10M"
	},
	{
		id: "10m_100m",
		label: "₦10M – ₦100M"
	},
	{
		id: "over100m",
		label: "Over ₦100M"
	},
	{
		id: "exploring",
		label: "Still figuring it out"
	}
];
var AFRICAN_COUNTRIES_SHORT = [
	"Nigeria",
	"Ghana",
	"Kenya",
	"South Africa",
	"Egypt",
	"Rwanda",
	"Tanzania",
	"Uganda",
	"Senegal",
	"Ethiopia",
	"Côte d'Ivoire",
	"Other"
];
function AuthPage() {
	const navigate = useNavigate();
	const { user, isLoading } = useDotAuth();
	const [mode, setMode] = (0, import_react.useState)(Route.useSearch().mode === "signup" ? "signup" : "signin");
	(0, import_react.useEffect)(() => {
		if (!isLoading && user) navigate({ to: "/dashboard" });
	}, [
		user,
		isLoading,
		navigate
	]);
	if (mode === "signup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignupFlow, { onSwitchToSignin: () => setMode("signin") });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mb-8 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SigninForm, {
					mode,
					setMode: (m) => setMode(m),
					onSignup: () => setMode("signup")
				})
			})]
		})
	});
}
function SigninForm({ mode, setMode, onSignup }) {
	const navigate = useNavigate();
	const { login } = useDotAuth();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPw, setShowPw] = (0, import_react.useState)(false);
	const [otp, setOtp] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	function handleGoogle() {
		window.location.href = getGoogleAuthUrl();
	}
	async function handleSignin(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await login(email, password);
			toast.success("Welcome back!");
			navigate({ to: "/dashboard" });
		} catch (err) {
			const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Sign-in failed";
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	}
	async function handleForgot(e) {
		e.preventDefault();
		setBusy(true);
		toast.info("Password reset is coming soon. Contact support@dot.africa for help.");
		setBusy(false);
		setMode("signin");
	}
	async function handleSendOtp(e) {
		e.preventDefault();
		toast.info("Magic link sign-in is coming soon. Use email + password for now.");
	}
	async function handleVerifyOtp(_value) {
		toast.info("Magic link sign-in is coming soon.");
	}
	if (mode === "otp-verify") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setMode("otp"),
				className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-bold",
				children: "Enter your code"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: ["We sent a 6-digit code to ", email]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTP, {
					maxLength: 6,
					value: otp,
					onChange: (v) => {
						setOtp(v);
						if (v.length === 6) handleVerifyOtp(v);
					},
					disabled: busy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPGroup, { children: [
						0,
						1,
						2,
						3,
						4,
						5
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, {
						index: i,
						className: "size-12 text-lg"
					}, i)) })
				})
			}),
			busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto size-5 animate-spin text-muted-foreground" })
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-bold",
				children: mode === "forgot" ? "Reset your password" : mode === "otp" ? "Sign in with a code" : "Welcome back"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: mode === "forgot" ? "We'll send a reset link to your email." : mode === "otp" ? "No password? No problem." : "Africa's Venture Progression Network"
			})]
		}),
		mode === "signin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: "w-full",
			onClick: handleGoogle,
			disabled: busy,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleIcon, {}), " Continue with Google"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "my-5 flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: "or"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
			]
		})] }),
		mode === "forgot" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleForgot,
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "email",
					children: "Email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "email",
					type: "email",
					required: true,
					value: email,
					onChange: (e) => setEmail(e.target.value),
					placeholder: "you@example.com"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				variant: "hero",
				className: "w-full",
				disabled: busy,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-4" }), "Send reset link"]
			})]
		}) : mode === "otp" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSendOtp,
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "email",
					children: "Email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "email",
					type: "email",
					required: true,
					value: email,
					onChange: (e) => setEmail(e.target.value),
					placeholder: "you@example.com"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				variant: "hero",
				className: "w-full",
				disabled: busy,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "size-4" }), "Send code"]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSignin,
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "si-email",
						children: "Email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "si-email",
						type: "email",
						required: true,
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "you@example.com"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "si-password",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode("forgot"),
							className: "text-xs text-primary hover:underline",
							children: "Forgot password?"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "si-password",
							type: showPw ? "text" : "password",
							required: true,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "••••••••",
							className: "pr-10"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowPw((v) => !v),
							className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
							"aria-label": showPw ? "Hide password" : "Show password",
							children: showPw ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "submit",
					variant: "hero",
					className: "w-full",
					disabled: busy,
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Sign in"]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 space-y-2 text-center text-sm",
			children: [mode === "signin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setMode("otp"),
				className: "text-muted-foreground hover:text-foreground",
				children: "Sign in with a one-time code instead"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted-foreground",
				children: [
					"New to DOT?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onSignup,
						className: "font-medium text-primary hover:underline",
						children: "Create a free account"
					})
				]
			})] }), (mode === "forgot" || mode === "otp") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setMode("signin"),
				className: "text-muted-foreground hover:text-foreground",
				children: "Back to sign in"
			})]
		})
	] });
}
function SignupFlow({ onSwitchToSignin }) {
	const navigate = useNavigate();
	const { signup } = useDotAuth();
	const [step, setStep] = (0, import_react.useState)(1);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPw, setShowPw] = (0, import_react.useState)(false);
	const [agreed, setAgreed] = (0, import_react.useState)(false);
	const [intent, setIntent] = (0, import_react.useState)(null);
	const [selectedChips, setSelectedChips] = (0, import_react.useState)([]);
	const [businessStage, setBusinessStage] = (0, import_react.useState)("");
	const [investRange, setInvestRange] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("");
	const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
	const pwColors = [
		"",
		"bg-destructive",
		"bg-warning",
		"bg-gold",
		"bg-primary"
	];
	const pwLabels = [
		"",
		"Too short",
		"Weak",
		"Good",
		"Strong"
	];
	function toggleChip(chip) {
		setSelectedChips((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]);
	}
	async function handleStep1(e) {
		e.preventDefault();
		if (!agreed) {
			toast.error("Please agree to the Terms and Privacy Policy to continue.");
			return;
		}
		if (password.length < 6) {
			toast.error("Password must be at least 6 characters.");
			return;
		}
		setStep(2);
	}
	function handleStep2(chosen) {
		setIntent(chosen);
		if (chosen === "explore" || chosen === "earn") submitSignup(chosen, []);
		else {
			setSelectedChips([]);
			setBusinessStage("");
			setInvestRange("");
			setCountry("");
			setStep(3);
		}
	}
	async function handleStep3(e) {
		e.preventDefault();
		await submitSignup(intent, selectedChips);
	}
	async function submitSignup(chosenIntent, chips) {
		setBusy(true);
		try {
			await signup({
				email,
				password,
				name: name.trim(),
				intent: chosenIntent,
				metadata: {
					skills: chips,
					business_stage: businessStage || null,
					invest_range: investRange || null,
					country: country || null
				}
			});
			toast.success("Account created! Welcome to DOT.");
			navigate({ to: "/onboarding" });
		} catch (err) {
			const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not create account";
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	}
	const totalSteps = intent === null ? 3 : intent === "explore" || intent === "earn" ? 2 : 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mb-8 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center gap-3",
						children: [
							step > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStep((s) => s - 1),
								className: "text-muted-foreground hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-1 gap-1.5",
								children: [
									1,
									2,
									3
								].slice(0, totalSteps).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1 flex-1 rounded-full transition-all", s <= step ? "bg-primary" : "bg-border") }, s))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [
									"Step ",
									step,
									" of ",
									totalSteps
								]
							})
						]
					}),
					step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl font-bold",
								children: "Create your account"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: "Free to join. No credit card needed."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "w-full",
							onClick: () => {
								window.location.href = getGoogleAuthUrl();
							},
							disabled: busy,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleIcon, {}), " Continue with Google"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "my-5 flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "or with email"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleStep1,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "su-name",
											children: "What's your first name?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "su-name",
											required: true,
											value: name,
											onChange: (e) => setName(e.target.value),
											placeholder: "Amara"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "This is how we'll greet you. You can change it later."
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "su-email",
										children: "Your email address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "su-email",
										type: "email",
										required: true,
										value: email,
										onChange: (e) => setEmail(e.target.value),
										placeholder: "you@example.com"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "su-pw",
											children: "Choose a password"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "su-pw",
												type: showPw ? "text" : "password",
												required: true,
												minLength: 6,
												value: password,
												onChange: (e) => setPassword(e.target.value),
												placeholder: "At least 6 characters",
												className: "pr-10"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setShowPw((v) => !v),
												className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
												"aria-label": showPw ? "Hide password" : "Show password",
												children: showPw ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
											})]
										}),
										password.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-1 gap-1",
												children: [
													1,
													2,
													3,
													4
												].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1 flex-1 rounded-full transition-all", n <= pwStrength ? pwColors[pwStrength] : "bg-border") }, n))
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: pwLabels[pwStrength]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex cursor-pointer items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-all", agreed ? "border-primary bg-primary" : "border-border bg-card"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "sr-only",
											checked: agreed,
											onChange: (e) => setAgreed(e.target.checked)
										}), agreed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-primary-foreground" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm text-muted-foreground",
										children: [
											"I agree to the",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/terms",
												target: "_blank",
												className: "text-primary hover:underline",
												children: "Terms of Service"
											}),
											" ",
											"and",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/privacy",
												target: "_blank",
												className: "text-primary hover:underline",
												children: "Privacy Policy"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									variant: "hero",
									className: "w-full",
									disabled: busy || !agreed,
									children: [
										busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }),
										"Continue",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-5 text-center text-sm text-muted-foreground",
							children: [
								"Already have an account?",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: onSwitchToSignin,
									className: "font-medium text-primary hover:underline",
									children: "Sign in"
								})
							]
						})
					] }),
					step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl font-bold",
							children: "What brings you to DOT?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Pick what fits you best right now. You can always change this later."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: INTENT_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => handleStep2(opt.id),
							disabled: busy,
							className: cn("flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all disabled:opacity-60", opt.accentClass),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-10 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-current/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(opt.icon, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block font-semibold text-sm",
										children: opt.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs opacity-70 mt-0.5",
										children: opt.sub
									})]
								}),
								busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin shrink-0" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 opacity-50" })
							]
						}, opt.id))
					})] }),
					step === 3 && intent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleStep3,
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "font-display text-2xl font-bold",
									children: [
										intent === "learn" && "What do you want to learn?",
										intent === "business" && "Where are you with your idea?",
										intent === "invest" && "How much are you thinking of investing?",
										intent === "community" && "Where are you based?"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: "This helps us personalise your first experience. You can skip any question."
								})]
							}),
							intent === "learn" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Pick topics you're interested in (choose any)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2 pt-1",
									children: TOPIC_CHIPS.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => toggleChip(chip),
										className: cn("rounded-full border px-3 py-1 text-sm transition-all", selectedChips.includes(chip) ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground hover:border-teal/40"),
										children: chip
									}, chip))
								})]
							}),
							intent === "business" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Where are you with your idea?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2 pt-1",
									children: BUSINESS_STAGES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setBusinessStage(s.id),
										className: cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all", businessStage === s.id ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("flex size-5 shrink-0 items-center justify-center rounded-full border", businessStage === s.id ? "border-gold bg-gold" : "border-muted-foreground"),
											children: businessStage === s.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-gold-foreground" })
										}), s.label]
									}, s.id))
								})]
							}),
							intent === "invest" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "How much are you thinking of investing?" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Ballpark is fine — this helps us match you with the right founders."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2 pt-1",
										children: INVEST_RANGES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setInvestRange(r.id),
											className: cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all", investRange === r.id ? "border-purple bg-purple/10 text-purple" : "border-border hover:border-purple/40"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("flex size-5 shrink-0 items-center justify-center rounded-full border", investRange === r.id ? "border-purple bg-purple" : "border-muted-foreground"),
												children: investRange === r.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-purple-foreground" })
											}), r.label]
										}, r.id))
									})
								]
							}),
							intent === "community" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "country",
									children: "Where are you based?"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: "country",
									value: country,
									onChange: (e) => setCountry(e.target.value),
									className: "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select a country"
									}), AFRICAN_COUNTRIES_SHORT.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: c,
										children: c
									}, c))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setStep(2),
									children: "Back"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									variant: "hero",
									className: "flex-1",
									disabled: busy,
									children: [
										busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }),
										"Create my account",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-xs text-muted-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									onClick: () => {
										setSelectedChips([]);
										setBusinessStage("");
										setInvestRange("");
										setCountry("");
									},
									className: "hover:text-foreground",
									children: "Skip for now →"
								})
							})
						]
					})
				]
			})]
		})
	});
}
function GoogleIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "size-4",
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#4285F4",
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#34A853",
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#FBBC05",
				d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#EA4335",
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			})
		]
	});
}
//#endregion
export { AuthPage as component };
