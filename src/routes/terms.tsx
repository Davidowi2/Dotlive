import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — DOT" },
      { name: "description", content: "Terms of Service for the DOT platform." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "22 June 2026";

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "account", label: "2. Account Registration" },
  { id: "dot-tokens", label: "3. DOT Tokens" },
  { id: "acceptable-use", label: "4. Acceptable Use" },
  { id: "marketplace", label: "5. Marketplace & Gigs" },
  { id: "ip", label: "6. Intellectual Property" },
  { id: "privacy", label: "7. Privacy" },
  { id: "disclaimers", label: "8. Disclaimers" },
  { id: "liability", label: "9. Limitation of Liability" },
  { id: "termination", label: "10. Termination" },
  { id: "governing-law", label: "11. Governing Law" },
  { id: "changes", label: "12. Changes to These Terms" },
  { id: "contact", label: "13. Contact Us" },
];

function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-semibold text-primary">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Terms of Service</h1>
            <p className="mt-3 text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Please read these Terms of Service carefully before using the DOT platform. By creating an account or using our services, you agree to be bound by these terms.
            </p>
          </div>

          {/* Table of contents */}
          <nav className="mb-12 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Contents</h2>
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-sm text-primary hover:underline">{item.label}</a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-12 text-sm leading-relaxed text-muted-foreground">

            <section id="acceptance">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using DOT ("the Platform", "we", "us", "our"), operated by DOT Africa Ltd, you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform.</p>
              <p className="mt-3">These Terms apply to all users of the Platform, including builders, founders, investors, community leaders, and administrators.</p>
            </section>

            <section id="account">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">2. Account Registration</h2>
              <p>To access most features of the Platform, you must create an account. You agree to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 16 years of age (or the age of digital consent in your jurisdiction)</li>
                <li>Not create multiple accounts for the same person or entity</li>
              </ul>
              <p className="mt-3">You are responsible for all activities that occur under your account. DOT reserves the right to suspend or terminate accounts that violate these Terms.</p>
            </section>

            <section id="dot-tokens">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">3. DOT Tokens</h2>
              <p>DOT tokens ("DOT") are the platform's internal accounting units used to reward activity, unlock features, and facilitate transactions within the Platform. DOT is <strong className="text-foreground">not a cryptocurrency</strong>, is not traded on any exchange, and has no guaranteed monetary value outside the Platform.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-foreground">Earning:</strong> Users earn DOT by completing gigs, finishing Academy courses, and participating in platform activities.</li>
                <li><strong className="text-foreground">Spending:</strong> DOT may be spent to upgrade your role (e.g., from Builder to Founder), register for events, or access premium features.</li>
                <li><strong className="text-foreground">Transfers:</strong> DOT may be transferred between users subject to platform rate limits and daily caps.</li>
                <li><strong className="text-foreground">No cash value:</strong> DOT cannot be redeemed for cash except where explicitly supported through a Paystack or similar payment integration.</li>
                <li><strong className="text-foreground">Starter grant:</strong> New users receive a 500 DOT starter grant upon account creation. This grant is non-transferable for 30 days.</li>
                <li><strong className="text-foreground">Forfeiture:</strong> DOT balances may be forfeited if your account is terminated for violation of these Terms.</li>
              </ul>
              <p className="mt-3">DOT Africa Ltd reserves the right to modify the DOT economy, including rates, rewards, and spending mechanisms, with reasonable notice.</p>
            </section>

            <section id="acceptable-use">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to use the Platform to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Violate any applicable laws or regulations</li>
                <li>Impersonate any person or entity</li>
                <li>Upload or transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to any part of the Platform</li>
                <li>Engage in fraudulent activity, including fake reviews or manufactured activity</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use automated bots or scripts to interact with the Platform without written consent</li>
                <li>Attempt to manipulate DOT token balances through exploits or bugs (which must be reported to us)</li>
                <li>Post misleading or false information about your ventures, qualifications, or identity</li>
              </ul>
            </section>

            <section id="marketplace">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">5. Marketplace & Gigs</h2>
              <p>The DOT Marketplace allows builders to offer services ("gigs") and founders to post job listings. By participating in the Marketplace:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Builders warrant they have the skills and capacity to deliver listed services</li>
                <li>Clients acknowledge that DOT acts as an intermediary and is not liable for the quality of third-party services</li>
                <li>DOT tokens held in escrow are released upon client confirmation of delivery</li>
                <li>Disputes must be raised within 14 days of delivery confirmation</li>
                <li>DOT reserves the right to arbitrate disputes and make final decisions on escrow release</li>
                <li>Fees or platform cuts (if any) will be disclosed clearly at the time of transaction</li>
              </ul>
            </section>

            <section id="ip">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">6. Intellectual Property</h2>
              <p>The Platform, including its design, software, and content created by DOT Africa Ltd, is protected by copyright and other intellectual property laws. You may not copy, reproduce, or distribute our proprietary content without written permission.</p>
              <p className="mt-3">Content you post on the Platform remains yours. By posting, you grant DOT Africa Ltd a non-exclusive, royalty-free license to display and use your content to operate and promote the Platform. You retain all ownership rights.</p>
            </section>

            <section id="privacy">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">7. Privacy</h2>
              <p>Your use of the Platform is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
            </section>

            <section id="disclaimers">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">8. Disclaimers</h2>
              <p>The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>The Platform will be uninterrupted, error-free, or secure</li>
                <li>Any Vantage scores or assessments constitute professional financial or investment advice</li>
                <li>Any venture listed on DOT Demo will receive funding</li>
                <li>DOT tokens will have any particular value</li>
              </ul>
            </section>

            <section id="liability">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, DOT Africa Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform.</p>
              <p className="mt-3">Our total liability to you for any claims arising under these Terms shall not exceed the amount you paid to us in the twelve months preceding the claim, or ₦50,000, whichever is greater.</p>
            </section>

            <section id="termination">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">10. Termination</h2>
              <p>You may terminate your account at any time by contacting us. We reserve the right to suspend or terminate your access to the Platform for violations of these Terms, with or without notice, at our sole discretion.</p>
              <p className="mt-3">Upon termination, your DOT balance and any associated data may be deleted in accordance with our data retention policy.</p>
            </section>

            <section id="governing-law">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">11. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</p>
            </section>

            <section id="changes">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">12. Changes to These Terms</h2>
              <p>We reserve the right to update these Terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
            </section>

            <section id="contact">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">13. Contact Us</h2>
              <p>If you have questions about these Terms, please contact us:</p>
              <div className="mt-3 rounded-xl border border-border bg-card p-5">
                <p><strong className="text-foreground">DOT Africa Ltd</strong></p>
                <p className="mt-1">Email: <a href="mailto:legal@dot.africa" className="text-primary hover:underline">legal@dot.africa</a></p>
                <p>Address: Lagos, Nigeria</p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
