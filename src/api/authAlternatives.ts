/**
 * Auth Alternatives API client — magic links, password reset, email verification
 */

import { dotApi } from "./client";

export interface MagicLinkResponse {
  token?: string;
  signupToken?: string;
  user?: any;
}

export interface PasswordResetRequest {
  email: string;
  sentAt: string;
}

export interface PasswordResetVerify {
  valid: boolean;
  expiresAt?: string;
}

export interface PasswordResetComplete {
  ok: boolean;
  message: string;
}

/**
 * Send a magic link to an email for signup, signin, or email verification
 */
export async function sendMagicLink(
  email: string,
  purpose: "signup" | "verify-email" | "signin" = "signup"
): Promise<{ ok: boolean }> {
  return dotApi.post("/api/auth/send-magic-link", { email, purpose });
}

/**
 * Verify a magic link token and return session/user
 */
export async function verifyMagicLink(token: string): Promise<MagicLinkResponse> {
  return dotApi.post("/api/auth/verify-magic-link", { token });
}

/**
 * Request a password reset email
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetRequest> {
  const res = await dotApi.post<PasswordResetRequest>("/api/auth/request-password-reset", {
    email,
  });
  return res;
}

/**
 * Verify that a password reset token is valid
 */
export async function verifyResetToken(token: string): Promise<PasswordResetVerify> {
  return dotApi.post("/api/auth/verify-reset-token", { token });
}

/**
 * Complete password reset with new password
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetComplete> {
  return dotApi.post("/api/auth/reset-password", { token, newPassword });
}
