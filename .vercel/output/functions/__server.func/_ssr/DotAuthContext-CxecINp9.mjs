import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as getToken, o as setToken, r as clearToken } from "./client-BT9fM0ow.mjs";
import { a as signup, i as logout, n as getMe, r as login } from "./auth-YjkHUMR9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DotAuthContext-CxecINp9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* DotAuthContext — Authentication context backed by the Fastify API.
*
* Client-side only: all localStorage access and API calls are guarded
* behind useEffect so they never run during SSR.
*/
var DotAuthContext = (0, import_react.createContext)(void 0);
var ROLE_PRIORITY = [
	"admin",
	"super_admin",
	"community_leader",
	"investor",
	"founder",
	"vendor",
	"builder"
];
function DotAuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [token, setTokenState] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const loadUser = (0, import_react.useCallback)(async () => {
		if (typeof window === "undefined") {
			setIsLoading(false);
			return;
		}
		try {
			const stored = getToken();
			if (!stored) {
				setUser(null);
				setTokenState(null);
				setIsLoading(false);
				return;
			}
			const u = await getMe();
			if (u) {
				setUser(u);
				setTokenState(stored);
			} else {
				clearToken();
				setUser(null);
				setTokenState(null);
			}
		} catch {
			clearToken();
			setUser(null);
			setTokenState(null);
		} finally {
			setIsLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		loadUser();
	}, [loadUser]);
	const login$1 = (0, import_react.useCallback)(async (email, password) => {
		const res = await login(email, password);
		setToken(res.token);
		setTokenState(res.token);
		setUser(res.user);
	}, []);
	const signup$1 = (0, import_react.useCallback)(async (data) => {
		const res = await signup(data);
		setToken(res.token);
		setTokenState(res.token);
		setUser(res.user);
	}, []);
	const logout$1 = (0, import_react.useCallback)(() => {
		logout().catch(() => {});
		clearToken();
		setTokenState(null);
		setUser(null);
	}, []);
	const refresh = (0, import_react.useCallback)(async () => {
		await loadUser();
	}, [loadUser]);
	const roles = user?.roles ?? [];
	const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
	const hasRole = (role) => roles.includes(role);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DotAuthContext.Provider, {
		value: {
			user,
			token,
			login: login$1,
			signup: signup$1,
			logout: logout$1,
			isLoading,
			refresh,
			hasRole,
			primaryRole,
			roles
		},
		children
	});
}
function useDotAuth() {
	const ctx = (0, import_react.useContext)(DotAuthContext);
	if (!ctx) throw new Error("useDotAuth must be used within DotAuthProvider");
	return ctx;
}
//#endregion
export { useDotAuth as n, DotAuthProvider as t };
