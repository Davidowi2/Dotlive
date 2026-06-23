import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { _ as useNavigate, g as Link, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Users, q as LoaderCircle, vt as CircleCheck } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as useAuth } from "./use-auth-DnlQb86O.mjs";
import { t as AppShell } from "./AppShell-C3C0RWJM.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/join._code-BtFqOlDu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function JoinPage() {
	const { code } = useParams({ from: "/_authenticated/join/$code" });
	const { user } = useAuth();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [status, setStatus] = (0, import_react.useState)("loading");
	const [community, setCommunity] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		(async () => {
			const { data, error } = await supabase.rpc("find_community_by_referral_code", { _code: code });
			const match = Array.isArray(data) ? data[0] : data;
			if (error || !match) {
				setStatus("error");
				return;
			}
			setCommunity(match);
			setStatus("found");
		})();
	}, [code]);
	async function join() {
		if (!user || !community) return;
		setBusy(true);
		try {
			const { error } = await supabase.from("community_members").upsert({
				community_id: community.id,
				founder_id: user.id,
				status: "active"
			}, { onConflict: "community_id,founder_id" });
			if (error) throw error;
			await supabase.from("founder_profiles").update({ community_id: community.id }).eq("user_id", user.id);
			qc.invalidateQueries({ queryKey: ["membership", user.id] });
			setStatus("joined");
			toast.success(`Joined ${community.name}!`);
			setTimeout(() => navigate({ to: "/dashboard" }), 1500);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not join");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md py-10 text-center",
		children: [
			status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto size-8 animate-spin text-primary" }),
			status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-bold",
					children: "Invalid invite"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "This referral code doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "mt-6",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard",
						children: "Go to dashboard"
					})
				})
			] }),
			status === "found" && community && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-4 font-display text-2xl font-bold",
					children: ["Join ", community.name]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: community.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "hero",
					className: "mt-6",
					onClick: join,
					disabled: busy,
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Join community"]
				})
			] }),
			status === "joined" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mx-auto size-12 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-2xl font-bold",
					children: "You're in!"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Taking you to your dashboard…"
				})
			] })
		]
	}) });
}
//#endregion
export { JoinPage as component };
