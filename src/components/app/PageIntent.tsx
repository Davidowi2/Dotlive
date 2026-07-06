import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageIntentProps {
  /**
   * The single question this page answers. One line. Plain language.
   * Example: "Where is your DOT and what can you do with it?"
   */
  intent: string;
  /**
   * Optional short context — rendered below the intent in muted text.
   */
  context?: string;
  /**
   * Optional icon rendered to the left.
   */
  icon?: ReactNode;
  /**
   * Optional right-side slot — typically the primary CTA for this page.
   */
  action?: ReactNode;
  className?: string;
}

/**
 * PageIntent
 *
 * Renders the one-question-per-page discipline. Sits at the top of every
 * authenticated page, immediately under the page title, and tells the user
 * in plain language what the page is for and what they can do here.
 *
 * Usage:
 *   <PageIntent
 *     intent="Where is your DOT and what can you do with it?"
 *     context="Deposit, transfer, stake, or track every movement."
 *     action={<Button>Deposit DOT</Button>}
 *   />
 */
export function PageIntent({
  intent,
  context,
  icon,
  action,
  className,
}: PageIntentProps) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
        <div>
          <p className="font-display text-base font-light leading-snug text-foreground">
            {intent}
          </p>
          {context ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{context}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
