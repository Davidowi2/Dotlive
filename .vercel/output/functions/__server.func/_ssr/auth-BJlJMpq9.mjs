import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-BJlJMpq9.js
var $$splitComponentImporter = () => import("./auth-B98NIKC4.mjs");
var Route = createFileRoute("/auth")({
	validateSearch: (search) => ({ mode: search.mode ?? "signin" }),
	head: () => ({ meta: [{ title: "Sign in — DOT" }, {
		name: "description",
		content: "Sign in or create your DOT account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
