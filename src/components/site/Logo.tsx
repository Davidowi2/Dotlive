import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * DOT Logo — circular SVG mark with flowing lines.
 * Works on both light and dark backgrounds.
 * The mark uses currentColor tints so it inherits theme naturally.
 */
function DotMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="18" cy="18" r="17" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="dot-grad" x1="4" y1="18" x2="32" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-teal, #14B8A6)" />
        </linearGradient>
        {/* Clip to circle */}
        <clipPath id="dot-clip">
          <circle cx="18" cy="18" r="15.5" />
        </clipPath>
      </defs>

      {/* Flowing lines — bezier curves inside the circle */}
      <g clipPath="url(#dot-clip)" stroke="url(#dot-grad)" strokeWidth="1.8" strokeLinecap="round">
        {/* Line 1 — top curve */}
        <path d="M5 12 C9 11, 14 9.5, 18 11 C22 12.5, 26 11, 31 12" />
        {/* Line 2 — upper-mid curve */}
        <path d="M4 16 C8 14.5, 13 16.5, 18 15.5 C23 14.5, 27 16.5, 32 16" />
        {/* Line 3 — lower-mid curve (with right-side fade / negative space) */}
        <path d="M4 20 C9 21, 14 18.5, 18 20 C21 21, 24 20.5, 27.5 20.5" strokeOpacity="0.9" />
        {/* Line 4 — bottom curve */}
        <path d="M5 24 C10 25, 15 22.5, 19 24 C21.5 25, 23.5 24.5, 26 24" strokeOpacity="0.6" />
      </g>

      {/* Small filled circle — the "DOT" */}
      <circle cx="18" cy="18" r="2.5" fill="url(#dot-grad)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 font-display", className)}>
      <DotMark size={36} />
      <span className="text-xl font-bold tracking-tight">DOT</span>
    </Link>
  );
}

/** Standalone mark for favicons and tight spaces */
export function DotLogoMark({ size = 32 }: { size?: number }) {
  return <DotMark size={size} />;
}
