import { useEffect, useState } from "react";

/**
 * useReducedMotion — SSR-safe reactive hook for `prefers-reduced-motion`.
 *
 * Returns `true` when the user has requested reduced motion at the OS level.
 * All motion primitives in this project should early-return (skip the
 * motion.div wrapper) when this returns true.
 *
 * Falls back to `false` during SSR so initial paint matches the no-motion
 * path; updates after hydration via `matchMedia` change listener.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    // `addEventListener` is the modern API; older Safari needs addListener.
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  return reduced;
}
