import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Search, ArrowRight, Home, ArrowUpRight, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Page not found — DOT" },
      { name: "description", content: "The page you're looking for doesn't exist or has been moved." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});

/**
 * Suggested destinations — surfaced so a 404 isn't a dead end. The user
 * can always keep moving forward rather than hitting "back" in the browser.
 */
const SUGGESTIONS = [
  { label: "Home", to: "/", icon: Home, accent: "primary" as const },
  { label: "Platform", to: "/platform", icon: Compass, accent: "teal" as const },
  { label: "Journey", to: "/journey", icon: ArrowRight, accent: "gold" as const },
  { label: "Communities", to: "/communities", icon: ArrowUpRight, accent: "purple" as const },
];

function NotFoundPage() {
  const [query, setQuery] = useState("");
  const { user, isLoading } = useDotAuth();
  const isAuthed = !!user && !isLoading;

  /**
   * Decorative for now — search is wired visually but doesn't route.
   * Returning `false` keeps the page mounted.
   */
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire up search route when /search exists
  }

  /**
   * Authenticated users get the AppShell (no public "Get started / Login"
   * buttons leaking in) plus an explicit back button.
   */
  if (isAuthed) {
    return <NotFoundAuthed onSearch={handleSearch} query={query} setQuery={setQuery} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* ── HERO BLOCK ──────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            {/* Editorial eyebrow */}
            <span className="tracking-editorial text-muted-foreground">
              Error 404 · Off the progression
            </span>

            {/* Giant serif 404 — visual anchor */}
            <h1
              className="mt-4 font-display font-light leading-[0.85] tracking-[-0.04em] text-foreground select-none"
              style={{ fontSize: "clamp(6rem, 18vw, 12rem)" }}
              aria-hidden
            >
              404
            </h1>

            {/* Headline */}
            <h2 className="mt-2 max-w-xl font-display text-2xl font-light tracking-tight sm:text-3xl">
              This page hasn't been built yet.
            </h2>

            {/* Description */}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground font-light">
              The link you followed may be broken, or the page may have
              moved. Either way, here's a way back to something useful.
            </p>
          </div>

          {/* ── SEARCH BOX (decorative) ─────────────────────────── */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-soft focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            role="search"
            aria-label="Search DOT"
          >
            <div className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
              <Search className="size-4" />
            </div>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search founders, communities, courses…"
              className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search query"
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="h-8"
              disabled
            >
              Search
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] tracking-widest uppercase text-muted-foreground/70">
            Search coming soon
          </p>

          {/* ── TAKE ME HOME ────────────────────────────────────── */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                <Home className="size-4" />
                Take me home
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/help">
                Contact support
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* ── SUGGESTED DESTINATIONS ──────────────────────────── */}
          <div className="mt-16 border-t border-border/60 pt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-primary/50" />
              <span className="tracking-editorial text-muted-foreground">
                Or try one of these
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      s.accent === "primary" && "bg-primary/10 text-primary",
                      s.accent === "teal" && "bg-teal/10 text-teal",
                      s.accent === "gold" && "bg-gold/10 text-gold",
                      s.accent === "purple" && "bg-purple/10 text-purple",
                    )}
                  >
                    <s.icon className="size-4" />
                  </span>
                  <span className="text-xs tracking-widest uppercase font-medium">
                    {s.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Authenticated 404 — uses the AppShell so the workspace sidebar shows,
 * no public "Get started" or "Login" CTAs leak into the app, and there's
 * an explicit back button at the top.
 */
function NotFoundAuthed({
  onSearch, query, setQuery,
}: { onSearch: (e: FormEvent<HTMLFormElement>) => void; query: string; setQuery: (s: string) => void }) {
  return (
    <AppShell>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      <div className="flex flex-col items-center text-center pt-8">
        <span className="tracking-editorial text-muted-foreground">
          Error 404 · Off the progression
        </span>
        <h1
          className="mt-4 font-display font-light leading-[0.85] tracking-[-0.04em] text-foreground select-none"
          style={{ fontSize: "clamp(4rem, 12vw, 8rem)" }}
          aria-hidden
        >
          404
        </h1>
        <h2 className="mt-2 max-w-xl font-display text-2xl font-light tracking-tight sm:text-3xl">
          This page hasn't been built yet.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground font-light">
          The link you followed may be broken, or the page may have
          moved. Either way, here's a way back to something useful.
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="mx-auto mt-10 flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-soft focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        role="search"
        aria-label="Search DOT"
      >
        <div className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
          <Search className="size-4" />
        </div>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search founders, communities, courses…"
          className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Search query"
        />
        <Button type="submit" size="sm" variant="default" className="h-8" disabled>
          Search
        </Button>
      </form>
      <p className="mt-2 text-center text-[10px] tracking-widest uppercase text-muted-foreground/70">
        Search coming soon
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild variant="default" size="lg">
          <Link to="/dashboard">
            <Home className="size-4" />
            Take me to dashboard
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link to="/help">
            Contact support
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-16 border-t border-border/60 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-primary/50" />
          <span className="tracking-editorial text-muted-foreground">
            Or try one of these
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  s.accent === "primary" && "bg-primary/10 text-primary",
                  s.accent === "teal" && "bg-teal/10 text-teal",
                  s.accent === "gold" && "bg-gold/10 text-gold",
                  s.accent === "purple" && "bg-purple/10 text-purple",
                )}
              >
                <s.icon className="size-4" />
              </span>
              <span className="text-xs tracking-widest uppercase font-medium">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
