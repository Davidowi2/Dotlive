/**
 * Tier API client — pricing, current tier, upgrade, renew, history.
 *
 * Endpoints (all in /api/tiers/*):
 *   GET    /pricing   — public, no auth needed
 *   GET    /me        — authed
 *   POST   /upgrade   — authed, body { tier }
 *   POST   /renew     — authed, body { upgradeId }
 *   GET    /history   — authed
 */

import { dotApi } from "./client";

export type PurchasableTier = "founder" | "capital_partner";
export type TierName = "builder" | PurchasableTier | "operator";

export interface TierInfo {
  key: PurchasableTier;
  dot: number;
  label: string;
  durationDays: number;
  description: string;
  features: string[];
}

export interface PricingResponse {
  tiers: TierInfo[];
  currentTier: PurchasableTier | null;
  currentTierExpiresAt: string | null;
}

export interface MyTierResponse {
  tier: TierName;
  expiresAt: string | null;
  daysRemaining: number | null;
  canRenew: boolean;
}

export interface TierUpgrade {
  id: string;
  tier: PurchasableTier;
  costDot: number;
  purchasedAt: string;
  expiresAt: string;
  renewedFrom: string | null;
  status: string;
  createdAt: string;
}

export interface UpgradeResponse {
  upgrade: TierUpgrade;
  newBalance: number;
}

export interface HistoryResponse {
  upgrades: TierUpgrade[];
}

export const getTierPricing = (): Promise<PricingResponse> =>
  dotApi.get<PricingResponse>("/tiers/pricing");

export const getMyTier = (): Promise<MyTierResponse> =>
  dotApi.get<MyTierResponse>("/tiers/me");

export const upgradeTier = (tier: PurchasableTier): Promise<UpgradeResponse> =>
  dotApi.post<UpgradeResponse>("/tiers/upgrade", { tier });

export const renewTier = (upgradeId: string): Promise<UpgradeResponse> =>
  dotApi.post<UpgradeResponse>("/tiers/renew", { upgradeId });

export const getTierHistory = (): Promise<HistoryResponse> =>
  dotApi.get<HistoryResponse>("/tiers/history");
