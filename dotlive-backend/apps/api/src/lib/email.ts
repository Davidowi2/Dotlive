/**
 * Email helper — sends transactional email via Resend (or logs to stdout in dev).
 *
 *   sendEmail({ to, subject, html, text? })
 *
 * Reads RESEND_API_KEY from env. If unset, falls back to console logging so
 * the API still works locally and during initial setup.
 *
 * All email templates are designed in-house to match DOT's brand identity
 * (dark, editorial, premium — like Stripe/Linear emails).
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

/* ═══════════════════════ EMAIL DESIGN SYSTEM ═══════════════════════ */

/**
 * Shared design tokens for all transactional emails.
 * Matches DOT's brand: dark backgrounds, lime-green accent (#a3e635),
 * editorial serif headlines (Geist/Inter for body).
 */
const E = {
  bg: "#0a0a0a",
  card: "#111111",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#fafafa",
  muted: "#a1a1aa",
  faint: "#71717a",
  accent: "#a3e635", // DOT's signature lime-green
  accentDark: "#84cc16",
  danger: "#ef4444",
  success: "#22c55e",
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", monospace',
  radius: "12px",
};

const layout = (args: { preview: string; body: string; appUrl?: string }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${args.preview}</title>
</head>
<body style="margin:0;padding:0;background:${E.bg};color:${E.text};font-family:${E.font};-webkit-font-smoothing:antialiased">
  <span style="display:none;font-size:1px;color:${E.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${args.preview}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${E.bg};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px">
          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding:8px 0 24px">
              <a href="${args.appUrl ?? "https://dotlive.cv"}" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:${E.accent};color:${E.bg};text-align:center;line-height:28px;font-weight:700;font-family:${E.fontMono};font-size:14px">D</span>
                <span style="font-weight:600;font-size:16px;color:${E.text};letter-spacing:-0.01em">DOT</span>
              </a>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:${E.card};border:1px solid ${E.border};border-radius:${E.radius};overflow:hidden">
              ${args.body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 8px">
              <p style="margin:0 0 6px;font-size:11px;color:${E.faint};letter-spacing:0.04em;text-transform:uppercase">
                Africa's Venture Progression Network
              </p>
              <p style="margin:0;font-size:11px;color:${E.faint};line-height:1.6">
                You're receiving this because you have a DOT account.<br />
                <a href="${args.appUrl ?? "https://dotlive.cv"}/settings" style="color:${E.muted};text-decoration:underline">Manage email preferences</a>
                &nbsp;·&nbsp;
                <a href="${args.appUrl ?? "https://dotlive.cv"}/privacy" style="color:${E.muted};text-decoration:underline">Privacy</a>
              </p>
              <p style="margin:16px 0 0;font-size:10px;color:${E.faint}">
                © 2026 DOT Technologies Limited · Lagos, Nigeria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ═══════════════════════ EMAIL TEMPLATES ═══════════════════════ */

export const emailTemplates = {
  /* ── OTP code — for sign-in, sign-up, 2FA, email verification ── */
  otpCode: (args: { name: string; code: string; purpose?: string; expiresInMinutes?: number }) => {
    const purposeText =
      args.purpose === "signup"
        ? "finish creating your DOT account"
        : args.purpose === "2fa"
        ? "complete your two-factor authentication"
        : args.purpose === "verify"
        ? "verify your email address"
        : "sign in to DOT";

    const body = `
      <div style="padding:32px 32px 8px">
        <p style="margin:0 0 4px;font-size:11px;color:${E.accent};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
          ${args.purpose === "signup" ? "Welcome to DOT" : "Verification code"}
        </p>
        <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;color:${E.text}">
          ${args.purpose === "signup" ? `Hey ${args.name?.split(" ")[0] ?? "there"} — let's get you in.` : `Your verification code`}
        </h1>
      </div>

      <div style="padding:16px 32px 8px">
        <p style="margin:0;font-size:15px;color:${E.muted};line-height:1.6">
          Use the code below to ${purposeText}. It expires in ${args.expiresInMinutes ?? 10} minutes and can only be used once.
        </p>
      </div>

      <!-- OTP Code Block -->
      <div style="padding:24px 32px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${args.code.split("").map((digit) => `
              <td align="center" style="padding:0 4px">
                <div style="background:${E.bg};border:1px solid ${E.borderStrong};border-radius:10px;padding:14px 0;font-family:${E.fontMono};font-size:32px;font-weight:700;color:${E.text};letter-spacing:0;line-height:1;text-align:center;min-width:48px">
                  ${digit}
                </div>
              </td>
            `).join("")}
          </tr>
        </table>
      </div>

      <!-- Tip -->
      <div style="padding:8px 32px 24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${E.bg};border:1px solid ${E.border};border-radius:8px">
          <tr>
            <td style="padding:14px 16px">
              <p style="margin:0;font-size:12px;color:${E.muted};line-height:1.6">
                <strong style="color:${E.text}">Tip:</strong> Copy the digits exactly as shown — order matters.
                If the code doesn't work, request a new one from the sign-in screen.
              </p>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:0 32px 32px">
        <p style="margin:0;font-size:12px;color:${E.faint};line-height:1.6">
          If you didn't request this code, you can safely ignore this email.
          Someone may have entered your address by mistake.
        </p>
      </div>
    `;

    return {
      subject: `${args.code} — your DOT verification code`,
      html: layout({
        preview: `Your DOT verification code is ${args.code}`,
        body,
        appUrl: "https://dotlive.cv",
      }),
      text: `Your DOT verification code is: ${args.code}\n\nThis code expires in ${args.expiresInMinutes ?? 10} minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    };
  },

  /* ── Welcome — sent right after signup ── */
  welcome: (args: { name: string; dashboardUrl: string; dotId: string }) => ({
    subject: `Welcome to DOT — your account is live`,
    html: layout({
      preview: `Welcome to DOT, ${args.name?.split(" ")[0] ?? "founder"}. Your DOT ID is ${args.dotId}.`,
      body: `
        <div style="padding:32px 32px 8px">
          <p style="margin:0 0 4px;font-size:11px;color:${E.accent};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
            Welcome to DOT
          </p>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;color:${E.text}">
            Your venture progression starts here.
          </h1>
        </div>

        <div style="padding:16px 32px">
          <p style="margin:0;font-size:15px;color:${E.muted};line-height:1.65">
            Hey ${args.name?.split(" ")[0] ?? "founder"} — your DOT account is live. You've just joined Africa's network for measuring, learning, and progressing ventures from idea to funded.
          </p>
        </div>

        <!-- Wallet card -->
        <div style="padding:8px 32px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,${E.accent}15,${E.accent}05);border:1px solid ${E.accent}30;border-radius:10px">
            <tr>
              <td style="padding:20px">
                <p style="margin:0 0 4px;font-size:10px;color:${E.muted};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
                  Your DOT Wallet
                </p>
                <p style="margin:0;font-family:${E.fontMono};font-size:32px;font-weight:600;color:${E.text};letter-spacing:-0.02em">
                  500 <span style="font-size:14px;color:${E.muted};font-weight:500">DOT</span>
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:${E.muted}">
                  Starter grant · enough to run your first Vantage assessment + claim your Builder level.
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Next steps -->
        <div style="padding:24px 32px 16px">
          <p style="margin:0 0 12px;font-size:11px;color:${E.muted};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
            Your first 3 steps
          </p>
          ${[
            { n: "01", t: "Run Vantage", d: "Score your venture readiness in 7 minutes." },
            { n: "02", t: "Pick a Builder level", d: "Start a streak and unlock community access." },
            { n: "03", t: "Join a community", d: "Find your region's founder network." },
          ].map((s) => `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px">
              <tr>
                <td style="width:36px;vertical-align:top">
                  <div style="font-family:${E.fontMono};font-size:11px;font-weight:700;color:${E.accent};background:${E.bg};border:1px solid ${E.border};border-radius:6px;padding:4px 0;text-align:center">
                    ${s.n}
                  </div>
                </td>
                <td style="padding-left:12px;vertical-align:top">
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${E.text}">${s.t}</p>
                  <p style="margin:0;font-size:13px;color:${E.muted};line-height:1.5">${s.d}</p>
                </td>
              </tr>
            </table>
          `).join("")}
        </div>

        <!-- CTA -->
        <div style="padding:8px 32px 32px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <a href="${args.dashboardUrl}" style="display:inline-block;background:${E.accent};color:${E.bg};padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:-0.005em">
                  Open your dashboard →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:11px;color:${E.faint};text-align:center">
            Your DOT ID: <span style="font-family:${E.fontMono};color:${E.muted}">${args.dotId}</span>
          </p>
        </div>
      `,
      appUrl: "https://dotlive.cv",
    }),
    text: `Welcome to DOT!\n\nYour account is live. You've received 500 DOT in your wallet as a starter grant.\n\nNext steps:\n1. Run Vantage - score your venture in 7 minutes\n2. Pick a Builder level\n3. Join a community\n\nOpen your dashboard: ${args.dashboardUrl}\n\nYour DOT ID: ${args.dotId}`,
  }),

  /* ── Password reset ── */
  passwordReset: (args: { name: string; resetUrl: string }) => ({
    subject: "Reset your DOT password",
    html: layout({
      preview: `Reset your DOT password, ${args.name?.split(" ")[0] ?? "founder"}`,
      body: `
        <div style="padding:32px 32px 8px">
          <p style="margin:0 0 4px;font-size:11px;color:${E.accent};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
            Password reset
          </p>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;color:${E.text}">
            Reset your DOT password
          </h1>
        </div>

        <div style="padding:16px 32px">
          <p style="margin:0;font-size:15px;color:${E.muted};line-height:1.65">
            Hey ${args.name?.split(" ")[0] ?? "founder"} — we received a request to reset your DOT password. Click the button below to choose a new one.
          </p>
        </div>

        <div style="padding:16px 32px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <a href="${args.resetUrl}" style="display:inline-block;background:${E.accent};color:${E.bg};padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:-0.005em">
                  Reset password →
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:16px 32px 8px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${E.bg};border:1px solid ${E.border};border-radius:8px">
            <tr>
              <td style="padding:14px 16px">
                <p style="margin:0;font-size:12px;color:${E.muted};line-height:1.6">
                  <strong style="color:${E.text}">Or paste this link:</strong><br />
                  <span style="font-family:${E.fontMono};word-break:break-all;color:${E.muted}">${args.resetUrl}</span>
                </p>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:8px 32px 32px">
          <p style="margin:0;font-size:12px;color:${E.faint};line-height:1.6">
            This link expires in <strong style="color:${E.muted}">30 minutes</strong>.
            If you didn't request this, you can safely ignore this email — your password will stay the same.
          </p>
        </div>
      `,
      appUrl: "https://dotlive.cv",
    }),
    text: `Reset your DOT password\n\nHi ${args.name},\n\nClick this link to reset your password (expires in 30 minutes):\n${args.resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
  }),

  /* ── Venture submission confirmation ── */
  ventureSubmission: (args: { name: string; ventureName: string; statusUrl: string }) => ({
    subject: `Got your venture: ${args.ventureName}`,
    html: layout({
      preview: `We received your venture "${args.ventureName}"`,
      body: `
        <div style="padding:32px 32px 8px">
          <p style="margin:0 0 4px;font-size:11px;color:${E.accent};letter-spacing:0.12em;text-transform:uppercase;font-weight:600">
            Venture submitted
          </p>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;color:${E.text}">
            Got it, ${args.name?.split(" ")[0] ?? "founder"}.
          </h1>
        </div>
        <div style="padding:16px 32px">
          <p style="margin:0;font-size:15px;color:${E.muted};line-height:1.65">
            We received your venture <strong style="color:${E.text}">${args.ventureName}</strong>. A reviewer will look at it within 48 hours. You'll get a notification as soon as it's live.
          </p>
        </div>
        <div style="padding:8px 32px 32px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <a href="${args.statusUrl}" style="display:inline-block;background:${E.accent};color:${E.bg};padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
                  View submission status →
                </a>
              </td>
            </tr>
          </table>
        </div>
      `,
      appUrl: "https://dotlive.cv",
    }),
    text: `We received your venture "${args.ventureName}". A reviewer will look at it within 48 hours.\n\nView status: ${args.statusUrl}`,
  }),
};