import { i as dotApi } from "./client-BT9fM0ow.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-jd8p92Cg.js
/**
* Wallet API — wraps the Fastify /api/wallet/* endpoints.
*/
/**
* Get the current user's wallet balance.
*/
async function getBalance() {
	return dotApi.get("/api/wallet");
}
/**
* Get the current user's transaction history.
*/
async function getTransactions() {
	return (await dotApi.get("/api/wallet/transactions")).transactions;
}
/**
* Transfer DOT to another user by their DOT ID.
*/
async function transfer(toDotId, amount, description) {
	return dotApi.post("/api/wallet/transfer", {
		toDotId,
		amount,
		description
	});
}
//#endregion
export { getTransactions as n, transfer as r, getBalance as t };
