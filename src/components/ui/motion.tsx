/**
 * CSS-only motion primitives. ZERO JS on scroll, ZERO framer-motion
 * dependency for landing animations.
 *
 * Why: framer-motion's useInView hooks run IntersectionObservers on every
 * section. With 11 sections on the landing page, that creates scroll jank.
 * CSS animations on `view-timeline` (or simple @keyframes with delay) are
 * vastly faster — they run on the compositor thread.
 *
 * Each component still respects prefers-reduced-motion: when on, all
 * elements render at their final state immediately, no animation.
 */

import { type ReactNode } from "react";

/**
 * Hook to detect prefers-reduced-motion. Returns `true` when the user
 * has requested reduced motion. Synchronous on the client.
 */
function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * FadeIn — pure CSS view-transition fade-up.
 *
 * Uses CSS animation-delay so children cascade naturally without any JS.
 * The animation fires once when the page loads (we set animation-fill-mode:
 * both). When reduced motion is on, the wrapper renders with no
 * animation class, so the final state is instant.
 * ────────────────────────────────────────────────────────────────── */
type FadeInProps = {
  children: ReactNode;
  /** Delay in ms. Default 0. */
  delay?: number;
  /** Y offset in px to animate from. Default 16. */
  y?: number;
  /** Duration in ms. Default 600. */
  duration?: number;
  className?: string;
};

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  duration = 600,
  className,
}: FadeInProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const style = {
    animation: `dot-fadein ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
    // CSS custom property for y-offset
    ["--fadein-y" as any]: `${y}px`,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Lift — pure CSS hover lift.
 *
 * Uses CSS transform on hover. No JS event handlers needed.
 * ────────────────────────────────────────────────────────────────── */
type LiftProps = {
  children: ReactNode;
  className?: string;
  /** Pixels to lift on hover. Default 4. */
  y?: number;
};

export function Lift({ children, className, y = 4 }: LiftProps) {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div
      className={className}
      style={{
        transition: `transform 200ms ease-out`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = `translateY(-${y}px)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * CountUp — RAF-based number tween.
 *
 * Uses a single requestAnimationFrame loop on mount. Fires once.
 * No framer-motion `animate()` import, no observer setup.
 * Tabular numerals recommended on the consumer (add the `tabular` className).
 * ────────────────────────────────────────────────────────────────── */
type CountUpProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number; // seconds
  decimals?: number;
  className?: string;
};

function formatNum(n: number, decimals: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  suffix,
  prefix,
  duration = 1.4,
  decimals = 0,
  className,
}: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const final = `${prefix ?? ""}${formatNum(value, decimals)}${suffix ?? ""}`;

  // Server-render the final value so SSR shows the right number, then
  // animate from 0 on the client (only if not reduced-motion).
  if (typeof window === "undefined" || reduced) {
    return <span className={className}>{final}</span>;
  }

  // Client-side: animate from 0 → value on mount via a ref'd span
  return <CountUpClient value={value} suffix={suffix} prefix={prefix} duration={duration} decimals={decimals} className={className} />;
}

import { useEffect, useRef } from "react";

function CountUpClient({
  value,
  suffix,
  prefix,
  duration,
  decimals,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const node = ref.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = value * eased;
      node.textContent = `${prefix ?? ""}${formatNum(current, decimals)}${suffix ?? ""}`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix ?? ""}${formatNum(0, decimals)}${suffix ?? ""}`}
    </span>
  );
}