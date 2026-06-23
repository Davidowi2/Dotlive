import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.mjs";
import { i as stringType, r as objectType, t as enumType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-TAUNrjZd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-BICw_TQn.js
var adminRole = enumType(["admin", "super_admin"]);
var elevateInput = objectType({
	targetUserId: stringType().uuid(),
	newRole: adminRole.default("super_admin"),
	reason: stringType().trim().max(500).optional()
});
var revokeInput = objectType({
	targetUserId: stringType().uuid(),
	role: adminRole.default("admin"),
	reason: stringType().trim().max(500).optional()
});
/**
* Elevate a user to an admin role. Runs as the authenticated caller; the
* underlying SECURITY DEFINER function enforces that only super admins can
* call it and blocks self-assignment.
*/
var elevateUser_createServerFn_handler = createServerRpc({
	id: "f0f685d425ad065ab7fe05586b7cef58b92fb9afceadfb1eb734416b921dccbe",
	name: "elevateUser",
	filename: "src/lib/admin.functions.ts"
}, (opts) => elevateUser.__executeServer(opts));
var elevateUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => elevateInput.parse(data)).handler(elevateUser_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.rpc("elevate_user_to_admin", {
		_target_user_id: data.targetUserId,
		_new_role: data.newRole,
		_reason: data.reason ?? void 0
	});
	if (error) throw new Error(error.message);
	return { ok: true };
});
var revokeAdmin_createServerFn_handler = createServerRpc({
	id: "06e0572fac90316a37f1b88d6cb83786d8a44f92579a42e2a91a7f7f3f158af7",
	name: "revokeAdmin",
	filename: "src/lib/admin.functions.ts"
}, (opts) => revokeAdmin.__executeServer(opts));
var revokeAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => revokeInput.parse(data)).handler(revokeAdmin_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.rpc("revoke_admin_role", {
		_target_user_id: data.targetUserId,
		_role: data.role,
		_reason: data.reason ?? void 0
	});
	if (error) throw new Error(error.message);
	return { ok: true };
});
var claimSuperAdmin_createServerFn_handler = createServerRpc({
	id: "0521649be2cdd5136881072b44960ffa318666bfd4ffd15b2d336ba60e6d2239",
	name: "claimSuperAdmin",
	filename: "src/lib/admin.functions.ts"
}, (opts) => claimSuperAdmin.__executeServer(opts));
var claimSuperAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(claimSuperAdmin_createServerFn_handler, async ({ context }) => {
	const email = context.claims?.email;
	if (!email) throw new Error("No email on account");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	const { count, error: countErr } = await supabaseAdmin.from("user_roles").select("id", {
		count: "exact",
		head: true
	}).eq("role", "super_admin");
	if (countErr) throw new Error(countErr.message);
	if ((count ?? 0) > 0) throw new Error("A super admin already exists");
	const { error } = await supabaseAdmin.rpc("bootstrap_super_admin", { _email: email });
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { claimSuperAdmin_createServerFn_handler, elevateUser_createServerFn_handler, revokeAdmin_createServerFn_handler };
