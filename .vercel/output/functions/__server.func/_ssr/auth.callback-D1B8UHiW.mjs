import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { q as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as setToken } from "./client-BT9fM0ow.mjs";
import { n as getMe } from "./auth-YjkHUMR9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.callback-D1B8UHiW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function AuthCallback() {
	const navigate = useNavigate();
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		async function handle() {
			const params = new URLSearchParams(window.location.search);
			const token = params.get("token");
			const errorParam = params.get("error");
			if (errorParam) {
				const msg = decodeURIComponent(errorParam);
				setError(msg);
				toast.error(msg);
				setTimeout(() => navigate({ to: "/auth" }), 2500);
				return;
			}
			if (!token) {
				const msg = "No authentication token received.";
				setError(msg);
				toast.error(msg);
				setTimeout(() => navigate({ to: "/auth" }), 2500);
				return;
			}
			try {
				setToken(token);
				const user = await getMe();
				if (!user) throw new Error("Could not load user profile.");
				const isNewUser = user.roles.length === 1 && user.roles[0] === "builder";
				toast.success(`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}!`);
				navigate({ to: isNewUser ? "/onboarding" : "/dashboard" });
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Sign-in failed.";
				setError(msg);
				toast.error(msg);
				setTimeout(() => navigate({ to: "/auth" }), 2500);
			}
		}
		handle();
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium text-destructive",
			children: error
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Redirecting you back to sign in…"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center gap-4 bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-8 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Completing sign in…"
		})]
	});
}
//#endregion
export { AuthCallback as component };
