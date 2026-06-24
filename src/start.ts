import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

// NOTE: attachSupabaseAuth is intentionally removed from the server entry.
// It pulled in the entire @supabase/supabase-js tree at the SSR entry point,
// causing "Cannot find package 'tslib'" on Vercel.
// Server functions that need auth now use the JWT-based requireSupabaseAuth
// middleware directly in each function file.

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  // No global functionMiddleware — server fns attach auth individually
  requestMiddleware: [errorMiddleware],
}));
