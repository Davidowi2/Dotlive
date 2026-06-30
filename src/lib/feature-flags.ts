/**
 * Feature Flags — Client-side toggles for progressive rollout.
 * 
 * In production, these should come from your database (feature_flags table)
 * or a service like LaunchDarkly. For now, this is a simple static config.
 * 
 * Usage:
 *   if (isFeatureEnabled('challenges_v2')) {
 *     // show new challenge UI
 *   }
 */

export const FEATURE_FLAGS = {
  // Arena features
  challenges_v2: true,
  builder_leaderboard: true,
  auto_certificate_minting: true,
  
  // Messaging
  chat_threads: true,
  video_calls: false, // not yet implemented
  
  // Payments
  paystack_deposits: true,
  bank_withdrawals: false, // paused per your code
  crypto_withdrawals: false,
  
  // Admin
  admin_impersonation: true,
  bulk_operations: false,
  
  // Experimental
  ai_advisor: true,
  reputation_v2: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled.
 * In the future, this can check user roles, A/B test buckets, etc.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

/**
 * For admin panel: list all flags with their current state
 */
export function getAllFlags(): Array<{ key: FeatureFlag; enabled: boolean }> {
  return Object.entries(FEATURE_FLAGS).map(([key, enabled]) => ({
    key: key as FeatureFlag,
    enabled,
  }));
}
