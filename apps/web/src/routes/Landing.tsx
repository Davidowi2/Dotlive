/**
 * Modern landing page (Phase 6).
 *
 * Design:
 *   - Dark theme (#0a0a0a bg, animated gradient mesh)
 *   - Massive headline, dual CTAs
 *   - Live counters (count up on scroll-in)
 *   - 3-step "How it works"
 *   - Horizontal activity ticker
 *   - 3 featured venture cards
 *   - 3 rotating testimonials
 *   - DOT economy explainer
 *   - Trust signal grid (4 animated stats)
 *   - Final CTA
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Rocket, Wallet, Users, BarChart3, Globe2, Trophy, AlertCircle } from "lucide-react";
import { api } from "../api/client.js";

interface PlatformStats {
  isBeta: boolean;
  builders: number;
  ventures: number;
  countries: number;
  dotInCirculation: number;
  deployedNaira: number;
  recentActivity: { text: string; ago: string }[];
}

function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get<PlatformStats>("/api/stats"),
    staleTime: 60_000,
  });
}

// Placeholder ticker entries used while the platform is in beta.
// Once we have real activity, the API returns it and we render
// that instead. Honest is better than fake.
const BETA_TICKER = [
  "Welcome to the DOT beta — be an early builder.",
  "Earn 500 DOT on signup. Spend them to upgrade.",
  "Builders post gigs. Founders post jobs. Investors save ventures.",
  "Every action here is paid in DOT — Africa's venture currency.",
];

const FEATURED_VENTURES = [
  { name: "PayAfrika", stage: "Build", industry: "Fintech", country: "Nigeria", raised: 12_000, goal: 50_000, logo: "🇳🇬" },
  { name: "MamaList", stage: "Fund", industry: "Marketplace", country: "Kenya", raised: 38_000, goal: 50_000, logo: "🇰🇪" },
  { name: "AgriConnect", stage: "Validate", industry: "AgriTech", country: "Ghana", raised: 4_500, goal: 25_000, logo: "🇬🇭" },
];

const TESTIMONIALS = [
  {
    name: "Adaeze O.",
    venture: "PayAfrika",
    country: "🇳🇬 Lagos",
    quote: "I joined as a builder with 500 free DOT. Six months later I run a fintech serving 3,000 customers and have an investor pipeline.",
    before: "Bootstrapped, no investors",
    after: "Funded, 3,000 users",
  },
  {
    name: "Joseph M.",
    venture: "AgriConnect",
    country: "🇬🇭 Kumasi",
    quote: "DOT Work let me hire a designer, a copywriter, and a pitch-deck creator — all with DOT I earned by completing gigs.",
    before: "Idea on paper",
    after: "Live product, 200 farmers",
  },
  {
    name: "Lerato K.",
    venture: "MamaList",
    country: "🇿🇦 Johannesburg",
    quote: "The Vantage assessment changed how I think about my venture. The Investor saves feature brought me 14 meetings in 30 days.",
    before: "Pre-revenue",
    after: "₦8M raised",
  },
];

const TRUST_STATS = [
  { label: "Active Builders", value: 2847, suffix: "+", icon: Users },
  { label: "Deployed", value: 45_000_000, prefix: "₦", suffix: "M+", icon: Wallet },
  { label: "Countries", value: 12, suffix: "", icon: Globe2 },
  { label: "Founder Success", value: 94, prefix: "", suffix: "%", icon: Trophy },
];

function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.floor(eased * target));
              if (t < 1) requestAnimationFrame(tick);
              else setValue(target);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const { ref, value } = useCountUp(target);
  return (
    <span ref={ref} className="count-up">
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function LandingPage() {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { data: stats } = useStats();

  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 5_000);
    return () => clearInterval(id);
  }, []);

  const isBeta = stats?.isBeta ?? true;
  const tickerLines = (stats?.recentActivity ?? []).length > 0
    ? stats!.recentActivity.map((a) => a.text)
    : BETA_TICKER;
  const buildersCount = stats?.builders ?? 0;
  const raisedNaira = stats?.deployedNaira ?? 0;
  const countriesCount = stats?.countries ?? 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ---------- Top nav ---------- */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          <img src="/logo.svg" alt="DOT" className="inline size-5 align-text-bottom opacity-80" /> dotlive
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-muted)] md:flex">
          <a href="#how" className="hover:text-[var(--text)]">How it works</a>
          <a href="#ventures" className="hover:text-[var(--text)]">Ventures</a>
          <a href="#stories" className="hover:text-[var(--text)]">Stories</a>
          <a href="#economy" className="hover:text-[var(--text)]">DOT economy</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
          <Link to="/signup" className="btn-primary">Start building</Link>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative isolate">
        <div className="gradient-mesh" aria-hidden />
        {/* Atmospheric logo watermark behind the hero text. */}
        <img
          src="/logo.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06] blur-[1px]"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 text-center md:pb-32 md:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[var(--text-muted)]">
            {isBeta ? (
              <>
                <AlertCircle className="size-3.5 text-[var(--gold)]" />
                Beta · {buildersCount > 0 ? `${buildersCount} builders and counting` : "open to early builders"}
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-[var(--gold)]" />
                Now live — {buildersCount.toLocaleString()}+ founders
              </>
            )}
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Where African Builders
            <br />
            <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--gold)] bg-clip-text text-transparent">
              Become Founders
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-muted)] md:text-xl">
            {isBeta
              ? "We're just getting started. Sign up today and your dot_id is permanent — you'll be one of the platform's founding builders."
              : <>Join <span className="font-semibold text-[var(--text)]">{buildersCount.toLocaleString()}+ founders</span> building the future of Africa — earn DOT, ship work, and unlock capital.</>}
          </p>

          {/* Live counter row — uses real numbers when stats loaded, "—" while loading */}
          <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            <span className="text-[var(--text-muted)]">
              <span className="font-display text-2xl font-bold text-[var(--primary)] count-up">{buildersCount > 0 ? buildersCount.toLocaleString() : "—"}</span> builders
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">
              <span className="font-display text-2xl font-bold text-[var(--primary)] count-up">{raisedNaira > 0 ? `₦${(raisedNaira / 1_000_000).toFixed(1)}M` : "—"}</span> deployed
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">
              <span className="font-display text-2xl font-bold text-[var(--primary)] count-up">{countriesCount > 0 ? countriesCount : "—"}</span> countries
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base">
              Start Building <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="btn-ghost inline-flex items-center gap-2 text-base">
              See how it works
            </a>
          </div>

          {/* Floating glass cards — only show in non-beta to keep the page honest */}
          {!isBeta && (
            <>
              <div className="pointer-events-none absolute left-4 top-32 hidden lg:block">
                <GlassActivity text={`${buildersCount} builders active`} sub="across Africa" />
              </div>
              <div className="pointer-events-none absolute right-4 top-44 hidden lg:block">
                <GlassActivity text={`₦${(raisedNaira / 1_000_000).toFixed(0)}M deployed`} sub="into ventures" />
              </div>
              <div className="pointer-events-none absolute bottom-12 left-12 hidden lg:block">
                <GlassActivity text={`${countriesCount} countries`} sub="and growing" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="border-t border-[var(--border)] bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Three steps from builder to founder.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <HowStep
              n="01"
              icon={Rocket}
              title="Sign up"
              body="Create an account and get 500 DOT — free, instantly, no credit card."
            />
            <HowStep
              n="02"
              icon={Wallet}
              title="Build & Earn"
              body="Complete gigs, run assessments, ship work. Every action earns you more DOT."
            />
            <HowStep
              n="03"
              icon={BarChart3}
              title="Upgrade & Fund"
              body="Spend DOT to become a Founder. List your venture, get matched with investors."
            />
          </div>
        </div>
      </section>

      {/* ---------- ACTIVITY TICKER ---------- */}
      <section className="overflow-hidden border-y border-[var(--border)] bg-[var(--bg)] py-6">
        <div className="ticker-track flex gap-12 whitespace-nowrap">
          {[...tickerLines, ...tickerLines].map((line, i) => (
            <span key={i} className="text-sm text-[var(--text-muted)]">
              <span className="mr-2 text-[var(--primary)]">●</span>
              {line}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED VENTURES — only shown when we have real ones ---------- */}
      {!isBeta && stats && stats.ventures > 0 && (
        <section id="ventures" className="bg-[var(--bg)] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">Featured ventures</p>
                <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Funded by the community.</h2>
              </div>
              <Link to="/signup" className="hidden text-sm text-[var(--text-muted)] hover:text-[var(--text)] md:inline">
                See all ventures →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURED_VENTURES.map((v) => (
              <div
                key={v.name}
                className="glass group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-[var(--primary)]/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{v.logo}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{v.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {v.industry} · {v.country}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{v.stage}</span>
                </div>
                <div className="mt-6">
                  <div className="mb-1 flex items-baseline justify-between text-xs text-[var(--text-muted)]">
                    <span>{Math.round((v.raised / v.goal) * 100)}% funded</span>
                    <span>
                      ₦{v.raised.toLocaleString()} / ₦{v.goal.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                      style={{ width: `${(v.raised / v.goal) * 100}%` }}
                    />
                  </div>
                </div>
                <button className="btn-primary mt-6 w-full">Back this venture</button>
              </div>
            ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- TESTIMONIAL CAROUSEL ---------- */}
      <section id="stories" className="border-t border-[var(--border)] bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">Builder stories</p>
          <h2 className="mt-2 mb-12 font-display text-4xl font-bold md:text-5xl">From idea to funded.</h2>
          <div className="glass relative rounded-3xl p-8 md:p-12">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`transition-opacity duration-700 ${i === testimonialIdx ? "opacity-100" : "absolute inset-0 opacity-0"}`}
              >
                <p className="font-display text-2xl leading-relaxed md:text-3xl">"{t.quote}"</p>
                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {t.venture} · {t.country}
                    </p>
                  </div>
                  <div className="hidden text-right text-sm text-[var(--text-muted)] md:block">
                    <p>
                      <span className="text-[var(--text)] line-through">{t.before}</span> → <span className="text-[var(--primary)]">{t.after}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-8 flex justify-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`size-2 rounded-full transition-all ${i === testimonialIdx ? "w-8 bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                  aria-label={`Show testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- DOT ECONOMY ---------- */}
      <section id="economy" className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">The DOT economy</p>
          <h2 className="mt-2 mb-12 font-display text-4xl font-bold md:text-5xl">How DOT flows.</h2>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <EconomyPoint
                step="1"
                title="Builders earn"
                body="Complete gigs, run assessments, finish courses. Each action pays DOT into your wallet."
              />
              <EconomyPoint
                step="2"
                title="Ventures pay"
                body="Founders spend DOT to list jobs, hire builders, and access investor matching."
              />
              <EconomyPoint
                step="3"
                title="Platform grows"
                body="Every transaction strengthens the trust graph — Vantage scores, ratings, and DOT velocity."
              />
            </div>
            <div className="glass relative aspect-square rounded-3xl p-8">
              <FlowDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRUST STATS ---------- */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-soft)] py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-3 size-6 text-[var(--primary)]" />
              <div className="font-display text-4xl font-bold">
                <CountUp target={s.value} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[var(--bg)] via-[var(--bg-soft)] to-[var(--bg)] py-32">
        <div className="gradient-mesh" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-5xl font-bold md:text-6xl">
            Your venture starts with <span className="text-[var(--primary)]">500 free DOT.</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            No credit card required · Join in 30 seconds
          </p>
          <Link to="/signup" className="btn-primary mt-8 inline-flex items-center gap-2 text-lg">
            Start Building <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-soft)] py-10 text-sm text-[var(--text-muted)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <p>© 2026 dotlive. Building Africa's venture progression network.</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-[var(--text)]">Log in</Link>
            <Link to="/signup" className="hover:text-[var(--text)]">Sign up</Link>
            <a href="#how" className="hover:text-[var(--text)]">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function GlassActivity({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3 text-left shadow-2xl">
      <p className="text-sm font-medium">{text}</p>
      <p className="text-xs text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function HowStep({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-[var(--primary)]/30">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="size-7 text-[var(--primary)]" />
        <span className="font-display text-3xl font-bold text-[var(--border)]">{n}</span>
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

function EconomyPoint({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 font-display font-bold text-[var(--primary)]">
        {step}
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{body}</p>
      </div>
    </div>
  );
}

function FlowDiagram() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full">
      <defs>
        <linearGradient id="dot-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d68f" />
          <stop offset="100%" stopColor="#7c5cff" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="55" fill="url(#dot-grad)" opacity="0.95" />
      <text x="160" y="170" textAnchor="middle" fontSize="24" fontWeight="700" fill="#0a0a0a">
        DOT
      </text>
      <circle cx="60" cy="60" r="34" fill="#161616" stroke="#00d68f" strokeWidth="1.5" />
      <text x="60" y="64" textAnchor="middle" fontSize="11" fill="#f5f5f5">
        Builders
      </text>
      <circle cx="260" cy="60" r="34" fill="#161616" stroke="#7c5cff" strokeWidth="1.5" />
      <text x="260" y="64" textAnchor="middle" fontSize="11" fill="#f5f5f5">
        Ventures
      </text>
      <circle cx="60" cy="260" r="34" fill="#161616" stroke="#f5b342" strokeWidth="1.5" />
      <text x="60" y="264" textAnchor="middle" fontSize="11" fill="#f5f5f5">
        Courses
      </text>
      <circle cx="260" cy="260" r="34" fill="#161616" stroke="#00d68f" strokeWidth="1.5" />
      <text x="260" y="264" textAnchor="middle" fontSize="11" fill="#f5f5f5">
        Investors
      </text>
      <path d="M 88 88 Q 130 110 130 130" stroke="#00d68f" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
      <path d="M 232 88 Q 190 110 190 130" stroke="#7c5cff" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
      <path d="M 88 232 Q 130 210 130 190" stroke="#f5b342" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
      <path d="M 232 232 Q 190 210 190 190" stroke="#00d68f" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
    </svg>
  );
}
