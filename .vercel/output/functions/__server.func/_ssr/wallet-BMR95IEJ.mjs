import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-CWBSyrer.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { It as ArrowDownToLine, K as LoaderCircle, R as Minus, T as Send, _t as CircleCheck, et as Gift, j as Plus, lt as Copy, r as Wallet, w as Settings2, wt as CalendarDays, xt as Check, y as ShoppingBag } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { c as dotToNaira, i as MIN_DEPOSIT_DOT, l as formatDot, u as formatNaira } from "./constants-DV8g_Ppd.mjs";
import { t as AppShell } from "./AppShell-DCJ29O8P.mjs";
import { t as PageHeader } from "./PageHeader-ZJ_eeVeU.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-CW9j8dJg.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.mjs";
import { t as Input } from "./input-C3saVQQz.mjs";
import { t as Label } from "./label-ZtC204j8.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-DBN5_Tb-.mjs";
import { i as stringType, n as numberType, r as objectType } from "../_libs/zod.mjs";
import { n as getTransactions, r as transfer, t as getBalance } from "./wallet-jd8p92Cg.mjs";
import { t as getByDotId } from "./users-BbtXgb_n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-BMR95IEJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var initInput = objectType({
	dotAmount: numberType().int().min(2e3),
	callbackUrl: stringType().url()
});
var verifyInput = objectType({ reference: stringType().min(6).max(120) });
/**
* Step 1 — create a pending payment record and a Paystack hosted-checkout
* session. The wallet is NOT credited here; crediting only happens after
* verification (verifyPaystackPayment or the webhook).
*/
var initPaystackPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => initInput.parse(data)).handler(createSsrRpc("fb4b0d429f7b0d28f5acc55e4b679b572e4013dc6f569af22815ce1027a1f030"));
/**
* Step 2 — verify a payment with Paystack and credit the wallet (idempotent).
* Safe to call multiple times; the DB function only credits once.
*/
var verifyPaystackPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => verifyInput.parse(data)).handler(createSsrRpc("96dad857295e20a210ef7c9272b0f4a9bfd1cf7ea85a7e8e43a094c4b30e83ef"));
var TYPE_META = {
	Deposit: {
		icon: ArrowDownToLine,
		tone: "text-primary"
	},
	Reward: {
		icon: Gift,
		tone: "text-gold"
	},
	"Academy Reward": {
		icon: Gift,
		tone: "text-gold"
	},
	Spend: {
		icon: Minus,
		tone: "text-destructive"
	},
	Transfer: {
		icon: Send,
		tone: "text-foreground"
	},
	"Marketplace Spend": {
		icon: ShoppingBag,
		tone: "text-destructive"
	},
	"Marketplace Earnings": {
		icon: Plus,
		tone: "text-primary"
	},
	"Event Payment": {
		icon: CalendarDays,
		tone: "text-destructive"
	},
	Refund: {
		icon: Plus,
		tone: "text-primary"
	},
	"Admin Adjustment": {
		icon: Settings2,
		tone: "text-muted-foreground"
	},
	"Admin Credit": {
		icon: Settings2,
		tone: "text-primary"
	}
};
function WalletPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const { user } = useDotAuth();
	const { data: walletData, isLoading: walletLoading } = useQuery({
		queryKey: ["wallet"],
		queryFn: getBalance,
		staleTime: 15e3
	});
	const balance = walletData?.balance ?? 0;
	const { data: transactions = [], isLoading: txLoading } = useQuery({
		queryKey: ["transactions"],
		queryFn: getTransactions,
		staleTime: 15e3
	});
	const dotId = user?.dotId ?? null;
	const [amount, setAmount] = (0, import_react.useState)(MIN_DEPOSIT_DOT);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [verifying, setVerifying] = (0, import_react.useState)(false);
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	const [transferOpen, setTransferOpen] = (0, import_react.useState)(false);
	function copyDotId() {
		if (!dotId) return;
		navigator.clipboard.writeText(dotId);
		setCopied(true);
		toast.success("DOT ID copied");
		setTimeout(() => setCopied(false), 1500);
	}
	const initFn = useServerFn(initPaystackPayment);
	const verifyFn = useServerFn(verifyPaystackPayment);
	const refresh = (0, import_react.useCallback)(() => {
		qc.invalidateQueries({ queryKey: ["wallet"] });
		qc.invalidateQueries({ queryKey: ["transactions"] });
	}, [qc]);
	(0, import_react.useEffect)(() => {
		const params = new URLSearchParams(window.location.search);
		const reference = params.get("reference") || params.get("trxref");
		if (!reference) return;
		setVerifying(true);
		verifyFn({ data: { reference } }).then((res) => {
			if (res.status === "success") {
				setReceipt({
					dot: res.dotAmount,
					naira: dotToNaira(res.dotAmount),
					reference
				});
				toast.success(`Wallet funded with ${formatDot(res.dotAmount)} DOT`);
				refresh();
			} else toast.error("Payment was not completed. You were not charged any DOT.");
		}).catch((e) => toast.error(e instanceof Error ? e.message : "Verification failed")).finally(() => {
			setVerifying(false);
			navigate({
				to: "/wallet",
				replace: true
			});
		});
	}, []);
	async function handleDeposit() {
		if (amount < 2e3) {
			toast.error(`Minimum deposit is ${formatDot(MIN_DEPOSIT_DOT)} DOT`);
			return;
		}
		setBusy(true);
		try {
			const { authorizationUrl } = await initFn({ data: {
				dotAmount: Math.floor(amount),
				callbackUrl: `${window.location.origin}/wallet`
			} });
			window.location.href = authorizationUrl;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not start payment");
			setBusy(false);
		}
	}
	if (walletLoading || txLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.Header, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.WalletHero, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-40 rounded-md bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.TransactionRows, { rows: 5 })]
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "DOT Wallet",
			subtitle: `Your internal ecosystem credits · 1 DOT = ${formatNaira(15)}`
		}),
		verifying && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-primary" }), " Verifying your payment…"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 sm:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6 sm:col-span-2 [background-image:var(--gradient-primary)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-primary-foreground/80",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: "Available balance"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 font-display text-5xl font-bold text-primary-foreground",
						children: [
							formatDot(balance),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl font-medium",
								children: "DOT"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-primary-foreground/80",
						children: ["≈ ", formatNaira(dotToNaira(balance))]
					}),
					dotId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: copyDotId,
						className: "mt-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary-foreground/70",
								children: "Your DOT ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono font-semibold",
								children: dotId
							}),
							copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" })
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col justify-center gap-3 rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
						open,
						onOpenChange: setOpen,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "hero",
								className: "w-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToLine, { className: "size-4" }), " Deposit DOT"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Deposit DOT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
								"Minimum ",
								formatDot(MIN_DEPOSIT_DOT),
								" DOT. 1 DOT = ",
								formatNaira(15),
								"."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "amount",
										children: "Amount (DOT)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "amount",
										type: "number",
										min: MIN_DEPOSIT_DOT,
										step: 100,
										value: amount,
										onChange: (e) => setAmount(Number(e.target.value))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground",
										children: ["You'll pay ", formatNaira(dotToNaira(amount || 0))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: [
											2e3,
											5e3,
											1e4,
											2e4
										].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setAmount(v),
											className: cn("rounded-full border px-3 py-1 text-sm", amount === v ? "border-primary bg-primary/10 text-primary" : "border-border"),
											children: formatDot(v)
										}, v))
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "hero",
								onClick: handleDeposit,
								disabled: busy,
								children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Pay with Paystack"]
							}) })
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "w-full",
						onClick: () => setTransferOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), " Transfer DOT"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-muted-foreground",
						children: "Send instantly by DOT ID · fund via Paystack"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 font-display text-lg font-semibold",
			children: "Transaction history"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 overflow-hidden rounded-2xl border border-border bg-card",
			children: transactions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "p-8 text-center text-sm text-muted-foreground",
				children: "No transactions yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border",
				children: transactions.map((t) => {
					const meta = TYPE_META[t.type] ?? TYPE_META["Admin Adjustment"];
					const positive = Number(t.amount) >= 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-4 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("flex size-9 items-center justify-center rounded-lg bg-muted", meta.tone),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(meta.icon, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-medium",
									children: t.description || t.type
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										t.type,
										" · ",
										new Date(t.createdAt).toLocaleString()
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("font-display text-sm font-semibold", positive ? "text-primary" : "text-destructive"),
								children: [
									positive ? "+" : "",
									formatDot(Number(t.amount)),
									" DOT"
								]
							})
						]
					}, t.id);
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: transferOpen,
			onOpenChange: setTransferOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineTransferForm, {
				balance,
				onSuccess: () => {
					qc.invalidateQueries({ queryKey: ["wallet"] });
					qc.invalidateQueries({ queryKey: ["transactions"] });
					setTransferOpen(false);
				},
				onClose: () => setTransferOpen(false)
			}) })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!receipt,
			onOpenChange: (o) => !o && setReceipt(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-6 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-center",
						children: "Payment receipt"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-center",
						children: "Your DOT wallet has been funded."
					})
				] }),
				receipt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "DOT credited",
							value: `${formatDot(receipt.dot)} DOT`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Amount paid",
							value: formatNaira(receipt.naira)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Reference",
							value: receipt.reference,
							mono: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Date",
							value: (/* @__PURE__ */ new Date()).toLocaleString()
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "hero",
					className: "w-full",
					onClick: () => setReceipt(null),
					children: "Done"
				}) })
			] })
		})
	] });
}
function Row({ label, value, mono }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("font-medium", mono && "font-mono text-xs"),
			children: value
		})]
	});
}
function InlineTransferForm({ balance, onSuccess, onClose }) {
	const [toDotId, setToDotId] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)(100);
	const [note, setNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [recipient, setRecipient] = (0, import_react.useState)(null);
	const [lookingUp, setLookingUp] = (0, import_react.useState)(false);
	async function lookupRecipient(dotId) {
		if (dotId.length < 3) {
			setRecipient(null);
			return;
		}
		setLookingUp(true);
		try {
			setRecipient({ name: (await getByDotId(dotId.trim())).name });
		} catch {
			setRecipient(null);
		} finally {
			setLookingUp(false);
		}
	}
	async function handleTransfer(e) {
		e.preventDefault();
		if (amount > balance) {
			toast.error("Insufficient balance.");
			return;
		}
		if (amount <= 0) {
			toast.error("Amount must be positive.");
			return;
		}
		setBusy(true);
		try {
			await transfer(toDotId.trim(), Math.floor(amount), note.trim() || void 0);
			toast.success(`${formatDot(amount)} DOT sent!`);
			onSuccess();
		} catch (err) {
			const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Transfer failed";
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Transfer DOT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
		"Send DOT to another user by their DOT ID. Your balance: ",
		formatDot(balance),
		" DOT"
	] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleTransfer,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "to-dot-id",
						children: "Recipient DOT ID"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "to-dot-id",
						value: toDotId,
						onChange: (e) => {
							setToDotId(e.target.value);
							lookupRecipient(e.target.value);
						},
						placeholder: "swift-founder-24abc1"
					}),
					lookingUp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Looking up…"
					}),
					!lookingUp && recipient && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-primary",
						children: [recipient.name ?? "Unknown user", " ✓"]
					}),
					!lookingUp && toDotId.length >= 3 && !recipient && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-destructive",
						children: "DOT ID not found"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "transfer-amount",
						children: "Amount (DOT)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "transfer-amount",
						type: "number",
						min: 1,
						max: balance,
						value: amount,
						onChange: (e) => setAmount(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: ["≈ ", formatNaira(dotToNaira(amount))]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "transfer-note",
					children: "Note (optional)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "transfer-note",
					value: note,
					onChange: (e) => setNote(e.target.value),
					placeholder: "For the logo design…",
					maxLength: 200
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				onClick: onClose,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				variant: "hero",
				disabled: busy || !toDotId.trim() || amount <= 0,
				children: [
					busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }),
					" Send ",
					amount > 0 ? formatDot(amount) : "",
					" DOT"
				]
			})] })
		]
	})] });
}
//#endregion
export { WalletPage as component };
