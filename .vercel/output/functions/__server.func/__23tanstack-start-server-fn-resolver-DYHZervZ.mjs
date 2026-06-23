//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-DYHZervZ.js
var manifest = {
	"0521649be2cdd5136881072b44960ffa318666bfd4ffd15b2d336ba60e6d2239": {
		functionName: "claimSuperAdmin_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-BICw_TQn.mjs")
	},
	"06e0572fac90316a37f1b88d6cb83786d8a44f92579a42e2a91a7f7f3f158af7": {
		functionName: "revokeAdmin_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-BICw_TQn.mjs")
	},
	"96dad857295e20a210ef7c9272b0f4a9bfd1cf7ea85a7e8e43a094c4b30e83ef": {
		functionName: "verifyPaystackPayment_createServerFn_handler",
		importer: () => import("./_ssr/paystack.functions-B0ABWjvV.mjs")
	},
	"f0f685d425ad065ab7fe05586b7cef58b92fb9afceadfb1eb734416b921dccbe": {
		functionName: "elevateUser_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-BICw_TQn.mjs")
	},
	"fb4b0d429f7b0d28f5acc55e4b679b572e4013dc6f569af22815ce1027a1f030": {
		functionName: "initPaystackPayment_createServerFn_handler",
		importer: () => import("./_ssr/paystack.functions-B0ABWjvV.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
