import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { M as redirect, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as CookieConsent } from "./CookieConsent-DMlM79zY.mjs";
import { a as getToken } from "./client-BT9fM0ow.mjs";
import { t as DotAuthProvider } from "./DotAuthContext-CxecINp9.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$35 } from "./auth-BJlJMpq9.mjs";
import { n as Route$36 } from "./demo-BJjQgLip.mjs";
import { t as hero_dot_default } from "./hero-dot-B1xFGgsE.mjs";
import { createHmac, timingSafeEqual } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router--CPBWphq.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DNhIth7d.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$34 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "DOT — Africa's Venture Creation Network" },
			{
				name: "description",
				content: "DOT helps African founders Assess, Learn, Improve, Validate, Pitch, Fund and Scale — a measurable venture progression network."
			},
			{
				name: "author",
				content: "DOT"
			},
			{
				property: "og:title",
				content: "DOT — Africa's Venture Creation Network"
			},
			{
				property: "og:description",
				content: "Move your venture from idea to funded. Vantage intelligence, DOT Academy, Sessions, Pitchathons, DOT Demo and a community operating system."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@DOTafrica"
			},
			{
				name: "twitter:title",
				content: "DOT — Africa's Venture Creation Network"
			},
			{
				name: "description",
				content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities."
			},
			{
				property: "og:description",
				content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities."
			},
			{
				name: "twitter:description",
				content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities."
			},
			{
				property: "og:image",
				content: "https://storage.googleapis.com/gpt-engineer-file-uploads/izLwHKTn5oRTgqHxFz7cy3Kvtlg1/social-images/social-1781945909310-ChatGPT_Image_Jun_20,_2026,_09_58_17_AM.webp"
			},
			{
				name: "twitter:image",
				content: "https://storage.googleapis.com/gpt-engineer-file-uploads/izLwHKTn5oRTgqHxFz7cy3Kvtlg1/social-images/social-1781945909310-ChatGPT_Image_Jun_20,_2026,_09_58_17_AM.webp"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico"
			},
			{
				rel: "preconnect",
				href: "https://api.fontshare.com"
			},
			{
				rel: "stylesheet",
				href: "https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `(function(){try{var t=localStorage.getItem('dot-theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();` } }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$34.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DotAuthProvider, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
				richColors: true,
				position: "top-center"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookieConsent, {})
		] })
	});
}
var $$splitComponentImporter$31 = () => import("./terms-BC9XStDt.mjs");
var Route$33 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "Terms of Service — DOT" },
		{
			name: "description",
			content: "Terms of Service for the DOT platform."
		},
		{
			name: "robots",
			content: "index, follow"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var BASE_URL = "";
var Route$32 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const xml = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		...[
			{
				path: "/",
				changefreq: "weekly",
				priority: "1.0"
			},
			{
				path: "/platform",
				changefreq: "monthly",
				priority: "0.8"
			},
			{
				path: "/journey",
				changefreq: "monthly",
				priority: "0.8"
			},
			{
				path: "/communities",
				changefreq: "monthly",
				priority: "0.7"
			},
			{
				path: "/investors",
				changefreq: "monthly",
				priority: "0.7"
			}
		].map((e) => [
			`  <url>`,
			`    <loc>${BASE_URL}${e.path}</loc>`,
			e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
			e.priority ? `    <priority>${e.priority}</priority>` : null,
			`  </url>`
		].filter(Boolean).join("\n")),
		`</urlset>`
	].join("\n");
	return new Response(xml, { headers: {
		"Content-Type": "application/xml",
		"Cache-Control": "public, max-age=3600"
	} });
} } } });
var $$splitComponentImporter$30 = () => import("./reset-password-BRhp4rAh.mjs");
var Route$31 = createFileRoute("/reset-password")({
	head: () => ({ meta: [{ title: "Reset password — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./privacy-LhL-P3rf.mjs");
var Route$30 = createFileRoute("/privacy")({
	head: () => ({ meta: [
		{ title: "Privacy Policy — DOT" },
		{
			name: "description",
			content: "How DOT collects, uses, and protects your personal data."
		},
		{
			name: "robots",
			content: "index, follow"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./platform-Di7PdFVB.mjs");
var Route$29 = createFileRoute("/platform")({
	head: () => ({ meta: [
		{ title: "Platform — DOT" },
		{
			name: "description",
			content: "The six pillars of DOT: Vantage, DOT Academy, Founder Sessions, Pitchathons, DOT Demo and the Community Operating System."
		},
		{
			property: "og:title",
			content: "The DOT Platform"
		},
		{
			property: "og:description",
			content: "Six pillars. One venture progression network."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./journey-SIB46M4n.mjs");
var Route$28 = createFileRoute("/journey")({
	head: () => ({ meta: [
		{ title: "The Founder Journey — DOT" },
		{
			name: "description",
			content: "Assess, Learn, Improve, Validate, Pitch, Fund, Scale — the seven measurable stages every DOT founder moves through."
		},
		{
			property: "og:title",
			content: "The DOT Founder Journey"
		},
		{
			property: "og:description",
			content: "Seven measurable stages from idea to funded."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./investors-CpdohQvs.mjs");
var Route$27 = createFileRoute("/investors")({
	head: () => ({ meta: [
		{ title: "Investors & Capital Partners — DOT" },
		{
			name: "description",
			content: "Discover fundable African ventures on DOT Demo. Filter by Vantage Point, review reports, request meetings and track your pipeline."
		},
		{
			property: "og:title",
			content: "DOT for Investors"
		},
		{
			property: "og:description",
			content: "Discover and fund Africa's best ventures."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./help-3fMMB4aq.mjs");
var Route$26 = createFileRoute("/help")({
	head: () => ({ meta: [{ title: "Help & Support — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./communities-CNwFJVEs.mjs");
var Route$25 = createFileRoute("/communities")({
	head: () => ({ meta: [
		{ title: "Communities — DOT" },
		{
			name: "description",
			content: "The Community Operating System powers community-led founder acquisition with referral links, dashboards, community Vantage and DOT leader rewards."
		},
		{
			property: "og:title",
			content: "DOT Communities"
		},
		{
			property: "og:description",
			content: "Community-led growth for African ventures."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./about-Kt2u3RTZ.mjs");
var Route$24 = createFileRoute("/about")({
	head: () => ({ meta: [{ title: "About DOT — Africa's Venture Progression Network" }, {
		name: "description",
		content: "DOT is building Africa's venture progression infrastructure — measurable, scalable, community-led."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./route-Di7iQBCH.mjs");
var Route$23 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: () => {
		if (!getToken()) throw redirect({ to: "/auth" });
	},
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./routes--h1E52Dc.mjs");
var Route$22 = createFileRoute("/")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "DOT — Africa's Venture Progression Network" },
		{
			name: "description",
			content: "DOT helps African founders Assess, Learn, Improve, Validate, Pitch, Fund and Scale. Venture intelligence, education, sessions, pitchathons and capital — in one network."
		},
		{
			property: "og:title",
			content: "DOT — Africa's Venture Progression Network"
		},
		{
			property: "og:description",
			content: "Move your venture from idea to funded — measurably."
		},
		{
			property: "og:image",
			content: hero_dot_default
		},
		{
			name: "twitter:image",
			content: hero_dot_default
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./founder._id-sDr1fcQf.mjs");
var Route$21 = createFileRoute("/founder/$id")({
	head: () => ({ meta: [{ title: "Founder Profile — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
/**
* /auth/callback — handles the redirect from the Fastify backend
* after Google OAuth completes.
*
* The backend redirects to:
*   /auth/callback?token=<jwt>
*
* This page:
*   1. Reads ?token from the URL
*   2. Stores it via setToken()
*   3. Calls getMe() to confirm it works
*   4. Sends new users to /onboarding, existing users to /dashboard
*   5. On any error, redirects to /auth with a toast
*/
var $$splitComponentImporter$19 = () => import("./auth.callback-D1B8UHiW.mjs");
var Route$20 = createFileRoute("/auth/callback")({
	head: () => ({ meta: [{ title: "Signing in — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./work-CQlBa2zV.mjs");
var Route$19 = createFileRoute("/_authenticated/work")({
	head: () => ({ meta: [{ title: "DOT Work — Earn DOT" }, {
		name: "description",
		content: "Hire builders, browse jobs, or sell your skills and earn DOT."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./wallet-BMR95IEJ.mjs");
var Route$18 = createFileRoute("/_authenticated/wallet")({
	head: () => ({ meta: [{ title: "DOT Wallet — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./vantage-r5puw20h.mjs");
var Route$17 = createFileRoute("/_authenticated/vantage")({
	head: () => ({ meta: [{ title: "Vantage — DOT" }, {
		name: "description",
		content: "Measure your venture with the Vantage assessment."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./settings-BzEkdsDd.mjs");
var Route$16 = createFileRoute("/_authenticated/settings")({
	head: () => ({ meta: [{ title: "Settings — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./sessions-8OYFf12H.mjs");
var Route$15 = createFileRoute("/_authenticated/sessions")({
	head: () => ({ meta: [{ title: "Founder Sessions — DOT" }, {
		name: "description",
		content: "Register for live founder sessions with operators and investors."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./profile-CGpHJics.mjs");
var Route$14 = createFileRoute("/_authenticated/profile")({
	head: () => ({ meta: [{ title: "Edit Profile — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./pitchathons-BKDuFuun.mjs");
var Route$13 = createFileRoute("/_authenticated/pitchathons")({
	head: () => ({ meta: [{ title: "Pitchathons — DOT" }, {
		name: "description",
		content: "Compete in DOT Pitchathons and get in front of investors."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./onboarding-DXIXJI3-.mjs");
var Route$12 = createFileRoute("/_authenticated/onboarding")({
	head: () => ({ meta: [{ title: "Get started — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./notifications-JbWpoiXb.mjs");
var Route$11 = createFileRoute("/_authenticated/notifications")({
	head: () => ({ meta: [{ title: "Notifications — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./meetings-Bp-m1fOZ.mjs");
var Route$10 = createFileRoute("/_authenticated/meetings")({
	head: () => ({ meta: [{ title: "Meeting Requests — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./judge-HaA3ahVv.mjs");
var Route$9 = createFileRoute("/_authenticated/judge")({
	head: () => ({ meta: [{ title: "Judge Portal — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./investor-1SXWC8RF.mjs");
var Route$8 = createFileRoute("/_authenticated/investor")({
	head: () => ({ meta: [{ title: "Investor Portal — DOT" }, {
		name: "description",
		content: "Browse, filter and connect with African ventures."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./discover-72vDAI0A.mjs");
var Route$7 = createFileRoute("/_authenticated/discover")({
	head: () => ({ meta: [{ title: "Discover — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./dashboard-vmvhFh0O.mjs");
var Route$6 = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [{ title: "Dashboard — DOT" }, {
		name: "description",
		content: "Your DOT dashboard — wallet, stats, and next actions."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./community-Rerpyigf.mjs");
var Route$5 = createFileRoute("/_authenticated/community")({
	head: () => ({ meta: [{ title: "Community OS — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./certificates-BiO-c9W9.mjs");
var Route$4 = createFileRoute("/_authenticated/certificates")({
	head: () => ({ meta: [{ title: "Certificates — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./admin-DJrJmGtM.mjs");
var Route$3 = createFileRoute("/_authenticated/admin")({
	head: () => ({ meta: [{ title: "Admin — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./academy-VwuYSEil.mjs");
var Route$2 = createFileRoute("/_authenticated/academy")({
	head: () => ({ meta: [{ title: "DOT Academy — DOT" }, {
		name: "description",
		content: "Founder education powered by DOT Academy."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./join._code-B44vpILi.mjs");
var Route$1 = createFileRoute("/_authenticated/join/$code")({
	head: () => ({ meta: [{ title: "Join a community — DOT" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/**
* Paystack webhook — the authoritative, server-to-server credit path.
* Verifies the HMAC-SHA512 signature, then credits the wallet idempotently.
* Lives under /api/public so it bypasses app auth; security is the signature.
*/
var Route = createFileRoute("/api/public/webhooks/paystack")({ server: { handlers: { POST: async ({ request }) => {
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) return new Response("Not configured", { status: 500 });
	const raw = await request.text();
	const signature = request.headers.get("x-paystack-signature") ?? "";
	const expected = createHmac("sha512", secret).update(raw).digest("hex");
	const sigBuf = Buffer.from(signature);
	const expBuf = Buffer.from(expected);
	if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return new Response("Invalid signature", { status: 401 });
	let event;
	try {
		event = JSON.parse(raw);
	} catch {
		return new Response("Bad payload", { status: 400 });
	}
	if (event.event !== "charge.success" || !event.data?.reference) return new Response("Ignored", { status: 200 });
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	const reference = event.data.reference;
	const { data: payment } = await supabaseAdmin.from("payments").select("*").eq("reference", reference).maybeSingle();
	if (!payment || payment.credited_at) return new Response("OK", { status: 200 });
	const expectedKobo = Number(payment.naira_amount) * 100;
	if (event.data.status !== "success" || event.data.amount !== expectedKobo) {
		await supabaseAdmin.from("payments").update({ status: "amount_mismatch" }).eq("reference", reference);
		return new Response("OK", { status: 200 });
	}
	await supabaseAdmin.from("payments").update({
		status: "success",
		paystack_reference: reference,
		channel: event.data.channel,
		paid_at: event.data.paid_at
	}).eq("reference", reference);
	await supabaseAdmin.rpc("credit_paystack_payment", { _reference: reference });
	return new Response("OK", { status: 200 });
} } } });
var TermsRoute = Route$33.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$34
});
var SitemapDotxmlRoute = Route$32.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$34
});
var ResetPasswordRoute = Route$31.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$34
});
var PrivacyRoute = Route$30.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$34
});
var PlatformRoute = Route$29.update({
	id: "/platform",
	path: "/platform",
	getParentRoute: () => Route$34
});
var JourneyRoute = Route$28.update({
	id: "/journey",
	path: "/journey",
	getParentRoute: () => Route$34
});
var InvestorsRoute = Route$27.update({
	id: "/investors",
	path: "/investors",
	getParentRoute: () => Route$34
});
var HelpRoute = Route$26.update({
	id: "/help",
	path: "/help",
	getParentRoute: () => Route$34
});
var CommunitiesRoute = Route$25.update({
	id: "/communities",
	path: "/communities",
	getParentRoute: () => Route$34
});
var AuthRoute = Route$35.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$34
});
var AboutRoute = Route$24.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$34
});
var AuthenticatedRouteRoute = Route$23.update({
	id: "/_authenticated",
	getParentRoute: () => Route$34
});
var IndexRoute = Route$22.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$34
});
var FounderIdRoute = Route$21.update({
	id: "/founder/$id",
	path: "/founder/$id",
	getParentRoute: () => Route$34
});
var AuthCallbackRoute = Route$20.update({
	id: "/callback",
	path: "/callback",
	getParentRoute: () => AuthRoute
});
var AuthenticatedWorkRoute = Route$19.update({
	id: "/work",
	path: "/work",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedWalletRoute = Route$18.update({
	id: "/wallet",
	path: "/wallet",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedVantageRoute = Route$17.update({
	id: "/vantage",
	path: "/vantage",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSettingsRoute = Route$16.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSessionsRoute = Route$15.update({
	id: "/sessions",
	path: "/sessions",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedProfileRoute = Route$14.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPitchathonsRoute = Route$13.update({
	id: "/pitchathons",
	path: "/pitchathons",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOnboardingRoute = Route$12.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedNotificationsRoute = Route$11.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMeetingsRoute = Route$10.update({
	id: "/meetings",
	path: "/meetings",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedJudgeRoute = Route$9.update({
	id: "/judge",
	path: "/judge",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedInvestorRoute = Route$8.update({
	id: "/investor",
	path: "/investor",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedDiscoverRoute = Route$7.update({
	id: "/discover",
	path: "/discover",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedDemoRoute = Route$36.update({
	id: "/demo",
	path: "/demo",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedDashboardRoute = Route$6.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedCommunityRoute = Route$5.update({
	id: "/community",
	path: "/community",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedCertificatesRoute = Route$4.update({
	id: "/certificates",
	path: "/certificates",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdminRoute = Route$3.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAcademyRoute = Route$2.update({
	id: "/academy",
	path: "/academy",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedJoinCodeRoute = Route$1.update({
	id: "/join/$code",
	path: "/join/$code",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ApiPublicWebhooksPaystackRoute = Route.update({
	id: "/api/public/webhooks/paystack",
	path: "/api/public/webhooks/paystack",
	getParentRoute: () => Route$34
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAcademyRoute,
	AuthenticatedAdminRoute,
	AuthenticatedCertificatesRoute,
	AuthenticatedCommunityRoute,
	AuthenticatedDashboardRoute,
	AuthenticatedDemoRoute,
	AuthenticatedDiscoverRoute,
	AuthenticatedInvestorRoute,
	AuthenticatedJudgeRoute,
	AuthenticatedMeetingsRoute,
	AuthenticatedNotificationsRoute,
	AuthenticatedOnboardingRoute,
	AuthenticatedPitchathonsRoute,
	AuthenticatedProfileRoute,
	AuthenticatedSessionsRoute,
	AuthenticatedSettingsRoute,
	AuthenticatedVantageRoute,
	AuthenticatedWalletRoute,
	AuthenticatedWorkRoute,
	AuthenticatedJoinCodeRoute
};
var AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
var AuthRouteChildren = { AuthCallbackRoute };
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
	AboutRoute,
	AuthRoute: AuthRoute._addFileChildren(AuthRouteChildren),
	CommunitiesRoute,
	HelpRoute,
	InvestorsRoute,
	JourneyRoute,
	PlatformRoute,
	PrivacyRoute,
	ResetPasswordRoute,
	SitemapDotxmlRoute,
	TermsRoute,
	FounderIdRoute,
	ApiPublicWebhooksPaystackRoute
};
var routeTree = Route$34._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
