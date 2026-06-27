/**
 * Email helper — sends transactional email via Resend (or logs to stdout in dev).
 *
 *   sendEmail({ to, subject, html, text? })
 *
 * Reads RESEND_API_KEY from env. If unset, falls back to console logging so
 * the API still works locally and during initial setup.
 *
 * Why: password resets, invitations, event RSVPs, deposit notifications,
 * builder grant confirmations — anything we want users to actually receive.
 */

type EmailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

const DEFAULT_FROM = "DOT OS <noreply@dotlive.cv>";

export async function sendEmail(args: EmailArgs): Promise<{ id?: string; delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = args.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  // Fallback: log only.
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] to=${Array.isArray(args.to) ? args.to.join(",") : args.to} from=${from} subject="${args.subject}"`);
    if (args.text) console.log(`  ${args.text.slice(0, 500)}`);
    else if (args.html) console.log(`  ${args.html.replace(/<[^>]+>/g, " ").slice(0, 500)}`);
    return { delivered: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { id?: string };
  return { id: data.id, delivered: true };
}

/* ── Common templates ── */

export const emailTemplates = {
  passwordReset: (args: { name: string; resetUrl: string }) => ({
    subject: "Reset your DOT password",
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="padding:32px 32px 16px">
    <h1 style="margin:0;font-size:20px;color:#0a0a0a">Reset your password</h1>
  </div>
  <div style="padding:0 32px 24px;color:#444;font-size:15px;line-height:1.6">
    <p>Hi ${args.name},</p>
    <p>We received a request to reset your DOT password. Click the button below to choose a new one.</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${args.resetUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500">Reset password</a>
    </p>
    <p style="font-size:13px;color:#888">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
</body></html>`,
  }),

  welcomeEmail: (args: { name: string; dashboardUrl: string }) => ({
    subject: "Welcome to DOT",
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="padding:32px 32px 16px">
    <h1 style="margin:0;font-size:20px;color:#0a0a0a">Welcome to DOT</h1>
  </div>
  <div style="padding:0 32px 24px;color:#444;font-size:15px;line-height:1.6">
    <p>Hi ${args.name},</p>
    <p>Your account is live. You have <strong>500 DOT</strong> in your wallet — enough to start exploring ventures, vote, and unlock your first Builder level.</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${args.dashboardUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500">Open dashboard</a>
    </p>
  </div>
</div>
</body></html>`,
  }),

  otpCode: (args: { name: string; code: string; purpose?: string }) => ({
    subject: `Your DOT verification code: ${args.code}`,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="padding:32px 32px 16px">
    <h1 style="margin:0;font-size:20px;color:#0a0a0a">Verification code</h1>
  </div>
  <div style="padding:0 32px 32px;color:#444;font-size:15px;line-height:1.6">
    <p>Hi ${args.name},</p>
    <p>Use this code to ${args.purpose ?? "verify your email"}:</p>
    <div style="margin:24px 0;padding:24px;background:#0a0a0a;color:#fff;border-radius:8px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${args.code}</div>
    <p style="font-size:13px;color:#888">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
</body></html>`,
  }),

  ventureSubmission: (args: { name: string; ventureName: string; statusUrl: string }) => ({
    subject: `We received your venture: ${args.ventureName}`,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="padding:32px 32px 16px">
    <h1 style="margin:0;font-size:20px;color:#0a0a0a">Got your venture</h1>
  </div>
  <div style="padding:0 32px 24px;color:#444;font-size:15px;line-height:1.6">
    <p>Hi ${args.name},</p>
    <p>We received your venture <strong>${args.ventureName}</strong>. A reviewer will look at it within 48 hours.</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${args.statusUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500">View status</a>
    </p>
  </div>
</div>
</body></html>`,
  }),
};
