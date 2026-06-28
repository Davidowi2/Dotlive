/**
 * BackButton — small reusable back link.
 *
 * Uses the browser's history back (preserving the previous route context).
 * Falls back to a target route if there's no history (first page load).
 *
 * Usage:
 *   <BackButton />                                       // browser back
 *   <BackButton fallback="/community" />                 // or go to /community
 *   <BackButton label="Back to communities" />
 */
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Optional fixed route to navigate to if browser history is empty */
  fallback?: string;
  /** Custom label */
  label?: string;
  className?: string;
}

export function BackButton({ fallback, label = "Back", className }: Props) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (fallback) {
      router.navigate({ to: fallback });
    } else {
      router.navigate({ to: "/dashboard" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </button>
  );
}