/**
 * netWorth.ts — single source of truth for "online net worth".
 *
 * Per the locked product rules: one function, one number, one definition.
 * No placeholders, no "₦0.00" that lies.
 *
 *   onlineNetWorth = wallet.available
 *                  + wallet.staked
 *                  + wallet.locked
 *                  + sum(milestoneEscrowRemaining)
 *                  + sum(activeStakes × currentDotValue)   [if not already in wallet.staked]
 *
 * Use this EVERYWHERE — /dashboard, /ventures, /portfolio.
 * Don't recompute inline. Don't approximate.
 *
 * V1 note: `currentDotValue` defaults to 1.0 because DOT is priced in DOT
 * (1 DOT = 1 DOT). When the API has a real oracle, the stakes term will
 * diverge from `wallet.staked` and contribute separately. Today, in V1,
 * the wallet ledger already includes the active stakes, so we use the
 * MAX of `wallet.staked` and `activeStakes × currentDotValue` to avoid
 * double-counting. This is the honest single number.
 */
import type { WalletBalance } from "@/api/wallet";
import type { StakePosition } from "@/api/stakes";

export interface NetWorthInput {
  wallet: Pick<WalletBalance, "balance" | "stakedBalance" | "lockedBalance">;
  /** Remaining DOT locked in milestone escrows across all ventures. */
  milestoneEscrowRemaining?: number;
  /** All stake positions (active + unstaking). */
  stakes?: StakePosition[];
  /**
   * Current DOT price in DOT (default 1.0). Reserved for the future
   * "DOT priced in DOT" oracle — today this is always 1.
   */
  currentDotValue?: number;
}

export interface NetWorthBreakdown {
  total: number;
  available: number;
  staked: number;
  locked: number;
  escrow: number;
  activeStakes: number;
  currentDotValue: number;
}

export function computeNetWorth(input: NetWorthInput): NetWorthBreakdown {
  const { wallet, milestoneEscrowRemaining = 0, stakes = [], currentDotValue = 1 } = input;

  const available = Number(wallet.balance ?? 0);
  const staked = Number(wallet.stakedBalance ?? 0);
  const locked = Number(wallet.lockedBalance ?? 0);
  const escrow = Number(milestoneEscrowRemaining);

  // V1 (currentDotValue = 1): the wallet ledger already reflects active
  // stakes, so adding the stakes term again would double-count. We use
  // the MAX of the two values: when the oracle diverges (future), the
  // stakes term will exceed wallet.staked and contribute to the total.
  const stakesValue = stakes
    .filter((s) => s.status === "active" || s.status === "unstaking")
    .reduce((acc, s) => acc + Number(s.amount ?? 0), 0) * currentDotValue;
  const stakeContribution = Math.max(staked, stakesValue);

  const total = available + stakeContribution + locked + escrow;

  return {
    total,
    available,
    staked,
    locked,
    escrow,
    activeStakes: stakesValue,
    currentDotValue,
  };
}
