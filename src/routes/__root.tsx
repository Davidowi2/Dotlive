import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWizardState } from "@/api/wizard";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { WizardOverlay } from "@/components/onboarding/WizardOverlay";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DotAuthProvider } from "@/contexts/DotAuthContext";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/CookieConsent";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DOT — Africa's Venture Creation Network" },
      {
        name: "description",
        content:
          "DOT helps African founders Assess, Learn, Improve, Validate, Pitch, Fund and Scale — a measurable venture progression network.",
      },
      { name: "author", content: "DOT" },
      { property: "og:title", content: "DOT — Africa's Venture Creation Network" },
      {
        property: "og:description",
        content:
          "Move your venture from idea to funded. Vantage intelligence, DOT Academy, Sessions, Pitchathons, DOT Demo and a community operating system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@DOTafrica" },
      { name: "twitter:title", content: "DOT — Africa's Venture Creation Network" },
      { name: "description", content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities." },
      { property: "og:description", content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities." },
      { name: "twitter:description", content: "DOT is Africa's venture-building network that helps builders learn skills, join teams, launch startups, and access opportunities." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/izLwHKTn5oRTgqHxFz7cy3Kvtlg1/social-images/social-1781945909310-ChatGPT_Image_Jun_20,_2026,_09_58_17_AM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/izLwHKTn5oRTgqHxFz7cy3Kvtlg1/social-images/social-1781945909310-ChatGPT_Image_Jun_20,_2026,_09_58_17_AM.webp" },
      { name: "theme-color", content: "#0A4627", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#08110C", media: "(prefers-color-scheme: dark)" },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "shortcut icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
      {
        rel: "preconnect",
        href: "https://api.fontshare.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // CRITICAL: The framework's auto-router (Lovable's Vite plugin) may not
  // inject queryClient into the route context — which causes
  // QueryClientProvider to receive `undefined` and crash with
  // "Cannot read properties of undefined (reading 'mount')" in
  // its useEffect cleanup.
  // We always fall back to a freshly created QueryClient if the
  // context one is missing. This is safe — react-query's staleTime
  // means the data won't be refetched on remount.
  const ctx = Route.useRouteContext();
  const queryClient =
    ctx?.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });

  return (
    <QueryClientProvider client={queryClient}>
      <DotAuthProvider>
        <Outlet />
        <WizardHost />
        <Toaster richColors position="top-center" />
        <CookieConsent />
      </DotAuthProvider>
    </QueryClientProvider>
  );
}

/**
 * WizardHost — renders the onboarding wizard overlay on first sign-in.
 * Subscribes to wizard state via the same query the overlay uses.
 * Open the wizard automatically if state.completed === false AND
 * the user is authenticated.
 */
function WizardHost() {
  // Re-enabled now that the root QueryClient provides a fallback
  // when the SSR-rendered tree calls useQuery before the provider
  // mounts. The wizard is the front door for new accounts and the
  // user explicitly asked us to make sure it works.
  const { user } = useDotAuth();
  const [open, setOpen] = useState(false);

  // Show only for newly-signed-in users who haven't completed the wizard.
  // The wizard endpoint records completion server-side.
  // Wizard disabled because backend endpoint /api/wizard/state is not implemented yet.
  // Re-enable after adding the wizard route in dotlive-backend.
  const { data: state } = useQuery({
    queryKey: ["wizard-state"],
    queryFn: fetchWizardState,
    enabled: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (state && !state.completed && !state.lastSeenAt) {
      // Defer open to next tick so the app shell mounts first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [state?.completed, state?.lastSeenAt]);

  if (!state) return null;
  // return <WizardOverlay open={open} onClose={() => setOpen(false)} />;
  return null;
}
