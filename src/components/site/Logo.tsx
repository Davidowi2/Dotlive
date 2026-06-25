import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * DOT Logo — primary brand mark using the official PNG.
 *
 * The official DOT mark is a circular monogram with green-to-gold
 * gradient. It works at all sizes from 16px favicon to 200px hero.
 * Source: /public/logo.png (1080x1080, transparent background).
 * ────────────────────────────────────────────────────────────────── */
function LogoImage({
  size = 32,
  alt = "DOT",
  className,
}: {
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Logo Lockup — image mark + Fraunces wordmark.
 * Use in headers, footers, sign-in screens.
 * ────────────────────────────────────────────────────────────────── */
interface LogoProps {
  className?: string;
  /** Show a small tagline below the wordmark */
  tagline?: boolean;
  /** Mark size in px */
  markSize?: number;
}

export function Logo({ className, tagline, markSize = 32 }: LogoProps) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <LogoImage size={markSize} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          DOT
        </span>
        {tagline && (
          <span className="text-[9px] tracking-widest uppercase text-muted-foreground font-medium mt-0.5">
            Africa
          </span>
        )}
      </div>
    </Link>
  );
}

/** Standalone mark for favicons, OG images, and tight spaces */
export function DotLogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return <LogoImage size={size} className={className} />;
}

/* ──────────────────────────────────────────────────────────────────
 * PROPOSED ALTERNATIVES — kept as fallback / for icon contexts.
 *
 * These hand-drawn marks (Ripple, Stack, Continent) live alongside
 * the primary PNG logo. The PNG is the brand mark — these are
 * alternative interpretations if you want to explore later.
 * ────────────────────────────────────────────────────────────────── */

/* ALT 1 — Ripple */
function DotMarkRipple({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" fill="none" />
      <circle cx="18" cy="18" r="11" stroke="var(--color-primary)" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      <circle cx="18" cy="18" r="6" stroke="var(--color-primary)" strokeOpacity="0.65" strokeWidth="1.4" fill="none" />
      <circle cx="18" cy="18" r="3" fill="var(--color-primary)" />
    </svg>
  );
}

/* ALT 2 — Stack (rising bars + dot) */
function DotMarkStack({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="9"  y="20" width="5" height="10" rx="1" fill="var(--color-gold)" />
      <rect x="15.5" y="14" width="5" height="16" rx="1" fill="var(--color-primary)" />
      <rect x="22" y="8"  width="5" height="22" rx="1" fill="var(--color-forest)" />
      <circle cx="24.5" cy="5" r="3" fill="var(--color-primary)" />
    </svg>
  );
}

/* ALT 3 — Continent (abstracted Africa in a circle) */
function DotMarkContinent({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="africa-clip">
          <circle cx="18" cy="18" r="15.5" />
        </clipPath>
      </defs>
      <circle cx="18" cy="18" r="16" stroke="currentColor" strokeOpacity="0.20" strokeWidth="1" fill="none" />
      <g clipPath="url(#africa-clip)">
        <path
          d="M14 6 C16 6.5, 18 7, 19 8 C20.5 9, 21.5 10, 21 11.5 C22 12, 23 13, 22.5 14 C24 15, 24.5 17, 23.5 18.5 C25 19, 26 20.5, 25 22 C24.5 24, 23 25.5, 21 26 C20 27.5, 18.5 28.5, 17 28 C15.5 28.5, 14 28, 13 27 C11.5 26, 10.5 24.5, 11 23 C9.5 22, 9 20.5, 9.5 19 C8 18, 8 16.5, 9 15.5 C8.5 14, 9 12.5, 10 11.5 C10 9.5, 11 7.5, 12.5 6.5 Z"
          fill="var(--color-primary)"
          fillOpacity="0.85"
        />
        <circle cx="18" cy="17" r="2.5" fill="var(--color-gold)" />
      </g>
    </svg>
  );
}

/** Preview all 3 SVG alternatives side-by-side. Useful for design review. */
export function LogoAlternatives() {
  return (
    <div className="inline-flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <DotMarkRipple size={48} />
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Ripple</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DotMarkStack size={48} />
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Stack</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DotMarkContinent size={48} />
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Continent</span>
      </div>
    </div>
  );
}

/* Export alternative variants for review tooling */
export { DotMarkRipple, DotMarkStack, DotMarkContinent };