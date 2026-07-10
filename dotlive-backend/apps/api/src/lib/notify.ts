/**
 * Notifications helper.
 *
 *   await notify({
 *     userId: 'abc...',
 *     type: 'transfer_received',
 *     title: 'You received 100 DOT',
 *     body: 'From brave-... — your new balance is 600 DOT',
 *     link: '/wallet',
 *     sendEmail: true,
 *   })
 *
 * - Always inserts into the `notifications` table (in-app feed)
 * - Optionally sends email via Resend (default: false)
 * - Returns the inserted row id + email delivery status
 *
 * Resilient: if email fails, the in-app notification still saves.
 */
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { notifications, users } from "../db/schema.js";
import { sendEmail } from "./email.js";

export type NotificationType =
  | "transfer_received"
  | "transfer_sent"
  | "deposit_confirmed"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "meeting_requested"
  | "meeting_accepted"
  | "meeting_reminder"
  | "role_granted"
  | "job_posted"
  | "job_application_received"
  | "service_purchased"
  | "order_disputed"
  | "community_invite"
  | "community_post"
  | "community_member_joined"
  | "community_challenge_won"
  | "certificate_issued"
  | "message_received"
  | "venture_published"
  | "venture_followed"
  | "pitchathon_judge_assigned"
  | "pitchathon_submission_received"
  | "mention"
  | "stake_created"
  | "unstaked"
  | "reward_claimed"
  | "escrow_funded"
  | "escrow_released"
  | "system";

export interface NotifyArgs {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  icon?: string | null;
  /** Send email to the user too. Default false. */
  sendEmail?: boolean;
}

export interface NotifyResult {
  notificationId: string;
  emailDelivered: boolean;
  emailError?: string;
}

export async function notify(args: NotifyArgs): Promise<NotifyResult> {
  // 1. Always insert the in-app notification
  const [row] = await db
    .insert(notifications)
    .values({
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link ?? null,
      icon: args.icon ?? null,
    } as any)
    .returning();

  const notificationId = row?.id ?? "";

  // 2. Optionally email — but don't fail if it errors
  let emailDelivered = false;
  let emailError: string | undefined;
  if (args.sendEmail) {
    try {
      // Look up the user's email
      const [u] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, args.userId))
        .limit(1);
      if (u?.email) {
        const subject = `[DOT] ${args.title}`;
        const html = emailWrap(args.title, args.body, args.link ?? null);
        const text = `${args.title}\n\n${args.body}${args.link ? `\n\nView in DOT: ${args.link}` : ""}`;
        const res = await sendEmail({ to: u.email, subject, html, text });
        emailDelivered = res.delivered;
        // Stamp emailed_at
        if (emailDelivered && notificationId) {
          await db
            .update(notifications)
            .set({ emailedAt: new Date() } as any)
            .where(eq(notifications.id, notificationId));
        }
      }
    } catch (e) {
      emailError = (e as Error).message;
      // Swallow — in-app notification already saved
    }
  }

  return { notificationId, emailDelivered, emailError };
}

/* ============================== Templates ============================== */

function emailWrap(title: string, body: string, link: string | null): string {
  const cta = link
    ? `<a href="${process.env.FRONTEND_URL ?? "https://dotlive.cv"}${link}"
        style="display:inline-block;background:#10b981;color:#000;font-weight:600;
               padding:12px 20px;border-radius:8px;text-decoration:none;margin-top:18px">
        View in DOT →
       </a>`
    : "";
  return `
  <!doctype html><html><body style="margin:0;background:#0a0a0a;color:#e5e5e5;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#161616;border:1px solid #262626;
                border-radius:16px;padding:32px">
      <div style="font-size:11px;letter-spacing:0.18em;color:#10b981;margin-bottom:12px">DOT NOTIFICATION</div>
      <h1 style="margin:0 0 12px;font-size:22px;color:#fff">${escape(title)}</h1>
      <p style="margin:0 0 16px;line-height:1.6;color:#a3a3a3">${escape(body)}</p>
      ${cta}
      <hr style="border:none;border-top:1px solid #262626;margin:28px 0 14px">
      <p style="font-size:11px;color:#525252;margin:0">
        You're getting this because of activity on your DOT account.
        Manage notifications in <a href="${process.env.FRONTEND_URL ?? "https://dotlive.cv"}/settings"
        style="color:#10b981;text-decoration:none">Settings</a>.
      </p>
    </div>
  </body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email sender wrapper that uses the email helper but knows about notifications.
 * Exported separately so /api/notifications routes can expose "email me this" actions.
 */
export async function sendNotificationEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return sendEmail(args);
}
