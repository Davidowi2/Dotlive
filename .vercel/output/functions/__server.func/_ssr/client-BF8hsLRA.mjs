import { createClient } from "@supabase/supabase-js";
//#region node_modules/.nitro/vite/services/ssr/assets/client-BF8hsLRA.js
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
//#endregion
export { supabase as t };
