import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { CookieSettingsLink } from "@/components/CookieConsent";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Vantage", to: "/platform" },
      { label: "DOT Academy", to: "/platform" },
      { label: "Sessions", to: "/platform" },
      { label: "Pitchathons", to: "/platform" },
      { label: "DOT Demo", to: "/platform" },
    ],
  },
  {
    title: "For",
    links: [
      { label: "Founders", to: "/journey" },
      { label: "Communities", to: "/communities" },
      { label: "Investors", to: "/investors" },
      { label: "Capital Partners", to: "/investors" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Pilot Program", to: "/" },
      { label: "Contact", to: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground font-light">
              Africa's Venture Progression Network. Helping founders move from idea to funded —
              measurably.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="tracking-editorial text-foreground/70">{col.title}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} DOT Africa Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground hover:underline underline-offset-4 transition-colors">Terms</Link>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="hover:text-foreground hover:underline underline-offset-4 transition-colors">Privacy</Link>
            <span aria-hidden>·</span>
            <CookieSettingsLink className="hover:text-foreground hover:underline underline-offset-4 transition-colors cursor-pointer" />
            <span aria-hidden>·</span>
            <span>Built for African founders.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
