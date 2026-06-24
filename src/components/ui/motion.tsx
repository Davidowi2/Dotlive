import { type ReactNode, useEffect, useRef } from "react";
import { animate, motion, useInView, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ─────────────────────────── FadeIn ─────────────────────────── */

/**
 * <FadeIn delay={0} y={20}>
 *   Fades up into place when it scrolls into view. Once-only by default.
 *
 * Respects prefers-reduced-motion — when on, renders plain children with
 * no animation wrapper, no transforms, no opacity gating.
 */
type FadeInProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  /** If true, replays every time it re-enters the viewport. Default false. */
  repeat?: boolean;
  className?: string;
};

export function FadeIn({
  children,
  delay = 0,
  y = 20,
  duration = 0.6,
  repeat = false,
  className,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: !repeat, amount: 0.15 });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── Lift ─────────────────────────── */

/**
 * <Lift>
 *   Hover lift wrapper for cards. Translates up 4px on hover with a soft
 *   shadow transition. Pointer-events:pass-through; keeps any onClick the
 *   child declares.
 *
 *   Respects prefers-reduced-motion — when on, renders plain div, no hover
 *   transform applied.
 */
type LiftProps = {
  children: ReactNode;
  className?: string;
  /** Pixels to lift on hover. Default 4. */
  y?: number;
};

export function Lift({ children, className, y = 4 }: LiftProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -y, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ y: 0, transition: { duration: 0.1 } }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── CountUp ─────────────────────────── */

/**
 * <CountUp value={642} suffix="/ 1000" duration={1.6} />
 *
 * Eases from 0 → value on first viewport entry. Uses framer-motion's
 * imperative `animate()` so the digits tween smoothly without re-rendering
 * the parent on every frame. Tabular numerals recommended on the consumer
 * (add the `tabular` className).
 *
 * Respects prefers-reduced-motion — when on, renders the final value
 * immediately, no animation.
 */
type CountUpProps = {
  value: number;
  /** Text appended after the number. e.g. "/ 1000" or "DOT". */
  suffix?: string;
  /** Text prepended before the number. e.g. "$". */
  prefix?: string;
  /** Animation duration in seconds. Default 1.6. */
  duration?: number;
  /** Decimal places to show. Default 0. */
  decimals?: number;
  /** Optional className applied to the wrapping span. */
  className?: string;
};

function formatNum(n: number, decimals: number): string {
  // Locale-grouped thousands; respects user locale for separators.
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  suffix,
  prefix,
  duration = 1.6,
  decimals = 0,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduced) return; // No-op: render final value below.
    if (!inView) return;
    if (hasAnimated.current) return;
    if (!ref.current) return;

    hasAnimated.current = true;
    const node = ref.current;

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        node.textContent = `${prefix ?? ""}${formatNum(latest, decimals)}${suffix ?? ""}`;
      },
    });

    return () => controls.stop();
  }, [inView, value, duration, decimals, prefix, suffix, reduced]);

  const final = `${prefix ?? ""}${formatNum(value, decimals)}${suffix ?? ""}`;
  // Before inView OR when reduced motion is on, just show the final value.
  // (Once animated, framer-motion's onUpdate keeps the DOM in sync.)
  return (
    <span ref={ref} className={className}>
      {reduced ? final : `${prefix ?? ""}${formatNum(0, decimals)}${suffix ?? ""}`}
    </span>
  );
}

/* ─────────────────────── re-export helpers ──────────────────── */

export type { Variants };
