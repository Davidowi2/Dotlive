import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { createClient } from "@supabase/supabase-js";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-BzqVsto_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
require_jsx_runtime();
function createSupabaseClient() {
	return createClient("https://uentjmbofqfqtkabzijj.supabase.co", "sb_publishable_fKEctBoM3MpcRLmuLImzWQ_9-C396dI", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
var AuthContext = (0, import_react.createContext)(void 0);
function useAuth() {
	const ctx = (0, import_react.useContext)(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
//#endregion
export { useAuth as n, supabase as t };
