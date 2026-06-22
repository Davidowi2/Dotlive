/**
 * CookieConsent — bottom banner with Accept/Reject/Customize options.
 * Stores user preference in localStorage under "dot-cookie-consent".
 * Shows only on first visit (or when cleared).
 */

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dot-cookie-consent";

type CookiePrefs = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

type ConsentValue = CookiePrefs & { decided: true };

export function useCookieConsent() {
  const [consented, setConsented] = useState<ConsentValue | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConsented(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  return consented;
}

function saveConsent(prefs: CookiePrefs) {
  const value: ConsentValue = { ...prefs, decided: true };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* ignore */ }
  return value;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) setShow(true);
    } catch { setShow(true); }
  }, []);

  function acceptAll() {
    saveConsent({ essential: true, analytics: true, marketing: true, preferences: true });
    setShow(false);
  }

  function rejectNonEssential() {
    saveConsent({ essential: true, analytics: false, marketing: false, preferences: false });
    setShow(false);
  }

  function saveCustom() {
    saveConsent(prefs);
    setShow(false);
    setShowCustomize(false);
  }

  if (!show) return null;

  return (
    <>
      {/* Main banner */}
      {!showCustomize && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/80 bg-card/95 shadow-elegant backdrop-blur-xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border"
          role="dialog"
          aria-modal="true"
          aria-label="Cookie consent"
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">We use cookies 🍪</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use cookies to make DOT work better for you. You choose what you're comfortable with.
                </p>
              </div>
              <button
                onClick={rejectNonEssential}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Reject non-essential and close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button size="sm" variant="hero" className="w-full" onClick={acceptAll}>
                Accept all
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={rejectNonEssential}>
                  Reject non-essential
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCustomize(true)}>
                  <Settings className="size-3.5" />
                  Customize
                </Button>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Read our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" "}for more details.
            </p>
          </div>
        </div>
      )}

      {/* Customize modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-[101] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Cookie preferences">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowCustomize(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold">Cookie preferences</h2>
              <button onClick={() => setShowCustomize(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {([
                {
                  key: "essential" as const,
                  label: "Essential",
                  desc: "Required for the site to work — authentication, session management. Cannot be disabled.",
                  locked: true,
                },
                {
                  key: "analytics" as const,
                  label: "Analytics",
                  desc: "Help us understand how people use DOT so we can improve it. No personal data is sold.",
                  locked: false,
                },
                {
                  key: "preferences" as const,
                  label: "Preferences",
                  desc: "Remember your settings like dark/light mode between visits.",
                  locked: false,
                },
                {
                  key: "marketing" as const,
                  label: "Marketing",
                  desc: "Used to show you relevant content on other platforms. Off by default.",
                  locked: false,
                },
              ] as const).map((cat) => (
                <div key={cat.key} className="flex items-start gap-4 rounded-xl border border-border p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</p>
                  </div>
                  <button
                    type="button"
                    disabled={cat.locked}
                    onClick={() => !cat.locked && setPrefs((p) => ({ ...p, [cat.key]: !p[cat.key] }))}
                    className={cn(
                      "relative shrink-0 h-5 w-9 rounded-full transition-all",
                      prefs[cat.key] ? "bg-primary" : "bg-muted",
                      cat.locked && "opacity-60 cursor-not-allowed"
                    )}
                    aria-pressed={prefs[cat.key]}
                    aria-label={`Toggle ${cat.label} cookies`}
                  >
                    <span className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                      prefs[cat.key] ? "left-4" : "left-0.5"
                    )} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={rejectNonEssential}>
                Reject all optional
              </Button>
              <Button variant="hero" className="flex-1" onClick={saveCustom}>
                <Check className="size-4" />
                Save preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Small link to re-open cookie preferences (use in footer) */
export function CookieSettingsLink({ className }: { className?: string }) {
  function open() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    window.location.reload();
  }
  return (
    <button onClick={open} className={className}>
      Cookie Settings
    </button>
  );
}
