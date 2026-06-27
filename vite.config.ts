// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Supabase packages and tslib must not be inlined into the SSR bundle.
// They rely on runtime module resolution and tslib in particular is missing
// from Nitro's bundled output, causing "Cannot find package 'tslib'" on Vercel.
const SUPABASE_EXTERNALS = [
  "tslib",
  "@supabase/supabase-js",
  "@supabase/auth-js",
  "@supabase/functions-js",
  "@supabase/storage-js",
  "@supabase/realtime-js",
  "@supabase/postgrest-js",
];

export default defineConfig({
  nitro: {
    preset: "vercel",

  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
// Build trigger 1782525254
