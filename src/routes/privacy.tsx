import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — DOT" },
      { name: "description", content: "How DOT collects, uses, and protects your personal data." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "22 June 2026";

const TOC = [
  { id: "overview", label: "1. Overview" },
  { id: "data-collected", label: "2. Data We Collect" },
  { id: "how-we-use", label: "3. How We Use Your Data" },
  { id: "sharing", label: "4. Data Sharing" },
  { id: "cookies", label: "5. Cookies & Tracking" },
  { id: "retention", label: "6. Data Retention" },
  { id: "security", label: "7. Security" },
  { id: "your-rights", label: "8. Your Rights" },
  { id: "children", label: "9. Children's Privacy" },
  { id: "international", label: "10. International Transfers" },
  { id: "changes", label: "11. Changes to This Policy" },
  { id: "contact", label: "12. Contact Us" },
];

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-semibold text-primary">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Privacy Policy</h1>
            <p className="mt-3 text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              DOT Africa Ltd ("DOT", "we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it.
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

            <section id="overview">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">1. Overview</h2>
              <p>This policy applies to all personal data collected through the DOT platform, including our website, mobile-responsive web app, and any associated services. By using DOT, you consent to the data practices described here.</p>
              <p className="mt-3">We process data as a data controller under applicable Nigerian data protection law (NDPA 2023) and, where relevant, the EU General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).</p>
            </section>

            <section id="data-collected">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">2. Data We Collect</h2>
              <p>We collect the following categories of personal data:</p>

              <h3 className="mt-4 font-semibold text-foreground">Data you provide directly:</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Name and email address (account registration)</li>
                <li>Password (stored as a secure hash — we never see your plain-text password)</li>
                <li>Profile information: venture name, industry, country, bio</li>
                <li>Onboarding intent (e.g., "I want to earn money")</li>
                <li>Content you post: service listings, job listings, pitch applications, community posts</li>
                <li>Payment information (processed by Paystack — we do not store card details)</li>
              </ul>

              <h3 className="mt-4 font-semibold text-foreground">Data collected automatically:</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>IP address and approximate location (country/city level)</li>
                <li>Browser type and device information</li>
                <li>Pages visited and features used (usage analytics)</li>
                <li>Session duration and interaction patterns</li>
                <li>Error and crash reports</li>
              </ul>

              <h3 className="mt-4 font-semibold text-foreground">Data from third parties:</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Google: name, email, and profile picture (if you sign in with Google)</li>
                <li>Paystack: payment confirmation and reference numbers</li>
              </ul>
            </section>

            <section id="how-we-use">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">3. How We Use Your Data</h2>
              <p>We use your personal data to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-foreground">Provide the service:</strong> Create and manage your account, process transactions, manage your DOT wallet, and enable platform features.</li>
                <li><strong className="text-foreground">Personalise your experience:</strong> Use your stated intent and preferences to show relevant content, recommendations, and onboarding steps.</li>
                <li><strong className="text-foreground">Communicate with you:</strong> Send account notifications, transaction confirmations, and important platform updates.</li>
                <li><strong className="text-foreground">Improve the platform:</strong> Analyse usage patterns to fix bugs, optimise features, and develop new functionality.</li>
                <li><strong className="text-foreground">Safety and security:</strong> Detect and prevent fraud, abuse, and violations of our Terms of Service.</li>
                <li><strong className="text-foreground">Legal compliance:</strong> Meet our obligations under applicable law.</li>
              </ul>
              <p className="mt-3">We do <strong className="text-foreground">not</strong> sell your personal data to third parties.</p>
            </section>

            <section id="sharing">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">4. Data Sharing</h2>
              <p>We share your data only in the following circumstances:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-foreground">Service providers:</strong> We use Neon (database and auth), Cloudinary (media storage), and Paystack (payments). These providers are contractually bound to protect your data.</li>
                <li><strong className="text-foreground">Other platform users:</strong> Your public profile information (name, DOT ID, venture name, bio) is visible to other authenticated users. You control what you share in your profile settings.</li>
                <li><strong className="text-foreground">Legal requirements:</strong> If required by law, court order, or regulatory authority, we may disclose your data.</li>
                <li><strong className="text-foreground">Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before this happens.</li>
              </ul>
            </section>

            <section id="cookies">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">5. Cookies & Tracking</h2>
              <p>We use cookies and similar technologies to keep you signed in and remember your preferences. Categories:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-foreground">Essential cookies:</strong> Required for the platform to function (e.g., session management, authentication). Cannot be disabled.</li>
                <li><strong className="text-foreground">Analytics cookies:</strong> Help us understand how the platform is used. You may opt out.</li>
                <li><strong className="text-foreground">Preference cookies:</strong> Remember your settings, such as dark/light mode. You may opt out.</li>
                <li><strong className="text-foreground">Marketing cookies:</strong> Used to show relevant content off-platform. Disabled by default.</li>
              </ul>
              <p className="mt-3">You can manage your cookie preferences at any time via the Cookie Settings in the footer. Your choice is stored locally and respected on every visit.</p>
            </section>

            <section id="retention">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">6. Data Retention</h2>
              <p>We retain your personal data for as long as your account is active. If you delete your account:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Profile and venture data is deleted within 30 days</li>
                <li>Transaction records are retained for 7 years for legal and financial compliance purposes</li>
                <li>Anonymised analytics data may be retained indefinitely</li>
              </ul>
            </section>

            <section id="security">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">7. Security</h2>
              <p>We take security seriously. Our measures include:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>All data in transit is encrypted using TLS 1.2+</li>
                <li>Passwords are hashed with Argon2id (a best-in-class algorithm)</li>
                <li>Database access is restricted and monitored</li>
                <li>Admin actions are audited and logged</li>
                <li>Regular security reviews</li>
              </ul>
              <p className="mt-3">No system is 100% secure. If you discover a vulnerability, please report it responsibly to <a href="mailto:security@dot.africa" className="text-primary hover:underline">security@dot.africa</a>.</p>
            </section>

            <section id="your-rights">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">8. Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
                <li><strong className="text-foreground">Portability:</strong> Request your data in a machine-readable format.</li>
                <li><strong className="text-foreground">Objection:</strong> Object to processing of your data for marketing purposes.</li>
                <li><strong className="text-foreground">Opt out of sale (CCPA):</strong> We do not sell your data, but you may still submit a formal opt-out request.</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@dot.africa" className="text-primary hover:underline">privacy@dot.africa</a>. We will respond within 30 days.</p>
            </section>

            <section id="children">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">9. Children's Privacy</h2>
              <p>The Platform is not directed at children under the age of 16. We do not knowingly collect personal data from children. If you believe a child has provided us with their data, please contact us and we will delete it promptly.</p>
            </section>

            <section id="international">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">10. International Data Transfers</h2>
              <p>Your data may be processed in countries outside Nigeria, including by our service providers (Neon servers in the US, Cloudinary in the US). We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses where required.</p>
            </section>

            <section id="changes">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. The "Last updated" date at the top of this page reflects when it was last revised.</p>
            </section>

            <section id="contact">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">12. Contact Us</h2>
              <p>For privacy-related enquiries, please contact:</p>
              <div className="mt-3 rounded-xl border border-border bg-card p-5">
                <p><strong className="text-foreground">DOT Africa Ltd — Data Privacy</strong></p>
                <p className="mt-1">Email: <a href="mailto:privacy@dot.africa" className="text-primary hover:underline">privacy@dot.africa</a></p>
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
