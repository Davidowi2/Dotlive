import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.mjs";
import { i as stringType, n as numberType, r as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-TAUNrjZd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/paystack.functions-B0ABWjvV.js
var DOT_RATE_NGN = 15;
var MIN_DEPOSIT_DOT = 2e3;
var PAYSTACK_BASE = "https://api.paystack.co";
var initInput = objectType({
	dotAmount: numberType().int().min(MIN_DEPOSIT_DOT),
	callbackUrl: stringType().url()
});
var verifyInput = objectType({ reference: stringType().min(6).max(120) });
function makeReference(userId) {
	const rand = Math.random().toString(36).slice(2, 10);
	return `dot_${userId.slice(0, 8)}_${Date.now()}_${rand}`;
}
/**
* Step 1 — create a pending payment record and a Paystack hosted-checkout
* session. The wallet is NOT credited here; crediting only happens after
* verification (verifyPaystackPayment or the webhook).
*/
var initPaystackPayment_createServerFn_handler = createServerRpc({
	id: "fb4b0d429f7b0d28f5acc55e4b679b572e4013dc6f569af22815ce1027a1f030",
	name: "initPaystackPayment",
	filename: "src/lib/paystack.functions.ts"
}, (opts) => initPaystackPayment.__executeServer(opts));
var initPaystackPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => initInput.parse(data)).handler(initPaystackPayment_createServerFn_handler, async ({ data, context }) => {
	const { userId, claims } = context;
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) throw new Error("Payment provider is not configured");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	let email = claims.email;
	if (!email) {
		const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).maybeSingle();
		email = profile?.email ?? void 0;
	}
	if (!email) throw new Error("No email on file for this account");
	const dotAmount = data.dotAmount;
	const nairaAmount = dotAmount * DOT_RATE_NGN;
	const reference = makeReference(userId);
	const { error: insertErr } = await supabaseAdmin.from("payments").insert({
		user_id: userId,
		reference,
		dot_amount: dotAmount,
		naira_amount: nairaAmount,
		status: "pending"
	});
	if (insertErr) throw new Error(insertErr.message);
	const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${secret}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email,
			amount: nairaAmount * 100,
			reference,
			callback_url: data.callbackUrl,
			metadata: {
				user_id: userId,
				dot_amount: dotAmount
			}
		})
	});
	const body = await res.json();
	if (!res.ok || !body.status || !body.data?.authorization_url) {
		await supabaseAdmin.from("payments").update({
			status: "failed",
			metadata: { error: body.message }
		}).eq("reference", reference);
		throw new Error(body.message || "Could not start payment");
	}
	return {
		authorizationUrl: body.data.authorization_url,
		reference
	};
});
var verifyPaystackPayment_createServerFn_handler = createServerRpc({
	id: "96dad857295e20a210ef7c9272b0f4a9bfd1cf7ea85a7e8e43a094c4b30e83ef",
	name: "verifyPaystackPayment",
	filename: "src/lib/paystack.functions.ts"
}, (opts) => verifyPaystackPayment.__executeServer(opts));
var verifyPaystackPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => verifyInput.parse(data)).handler(verifyPaystackPayment_createServerFn_handler, async ({ data, context }) => {
	const { userId } = context;
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) throw new Error("Payment provider is not configured");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	const { data: payment, error: pErr } = await supabaseAdmin.from("payments").select("*").eq("reference", data.reference).maybeSingle();
	if (pErr) throw new Error(pErr.message);
	if (!payment) throw new Error("Payment not found");
	if (payment.user_id !== userId) throw new Error("Not your payment");
	if (payment.credited_at) {
		const { data: w } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
		return {
			status: "success",
			balance: Number(w?.balance ?? 0),
			dotAmount: Number(payment.dot_amount)
		};
	}
	const body = await (await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(data.reference)}`, { headers: { Authorization: `Bearer ${secret}` } })).json();
	const tx = body.data;
	const expectedKobo = Number(payment.naira_amount) * 100;
	if (!body.status || !tx || tx.status !== "success" || tx.amount !== expectedKobo) {
		await supabaseAdmin.from("payments").update({ status: tx?.status === "success" ? "amount_mismatch" : "failed" }).eq("reference", data.reference);
		return {
			status: "failed",
			balance: 0,
			dotAmount: Number(payment.dot_amount)
		};
	}
	await supabaseAdmin.from("payments").update({
		status: "success",
		paystack_reference: tx.reference,
		channel: tx.channel,
		paid_at: tx.paid_at
	}).eq("reference", data.reference);
	const { data: balance, error: cErr } = await supabaseAdmin.rpc("credit_paystack_payment", { _reference: data.reference });
	if (cErr) throw new Error(cErr.message);
	return {
		status: "success",
		balance: Number(balance ?? 0),
		dotAmount: Number(payment.dot_amount)
	};
});
//#endregion
export { initPaystackPayment_createServerFn_handler, verifyPaystackPayment_createServerFn_handler };
