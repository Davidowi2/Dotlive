import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom CTA bar — mobile only (lg:hidden).
 *
 * Behaviour: the CTA is visible while the hero section is in view
 * (any part of it intersects the viewport). Once the user scrolls
 * past the hero, the CTA slides off-screen so it doesn't compete
 * with the page content.
 *
 * Setup: place an element with `id="hero"` on the hero section. The
 * component observes that target with IntersectionObserver and toggles
 * visibility based on whether the hero is currently intersecting.
 *
 * If the target is not found (e.g. component rendered on a page
 * without a hero) the CTA is hidden by default.
 */
export function MobileCta({
  to = "/auth",
  search,
  label = "Start free — get 500 DOT",
  targetId = "hero",
}: {
  to?: string;
  search?: { mode?: "signup" | "signin" };
  label?: string;
  targetId?: string;
}) {
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) {
      setHeroInView(false);
      return;
    }

    // Initial state — if the hero is already off-screen on first
    // render (e.g. user landed deep-linked), don't flash the CTA.
    const rect = target.getBoundingClientRect();
    setHeroInView(rect.bottom > 0 && rect.top < window.innerHeight);

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const hidden = !heroInView;

  return (
    <div
      className={cn(
        "lg:hidden fixed inset-x-0 bottom-0 z-40",
        "transition-transform duration-300 ease-out will-change-transform",
        hidden && "pointer-events-none translate-y-full"
      )}
      aria-hidden={hidden}
    >
      <div
        className={cn(
          "border-t border-border/60 bg-background/95 backdrop-blur-xl",
          "px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          "shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]"
        )}
      >
        <Link
          to={to}
          search={search}
          className={cn(
            "group flex w-full items-center justify-center gap-2",
            "bg-primary text-primary-foreground",
            "px-6 py-3.5 text-xs font-semibold uppercase tracking-widest",
            "hover:bg-primary/90 transition-colors shadow-glow"
          )}
        >
          {label}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
