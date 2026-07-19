import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  requestUrl?: string
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const capturedError = consumeLastCapturedError();
  
  // Verbose error logging for Vercel debugging
  console.error("=== SSR ERROR CAUGHT ===");
  console.error("URL:", requestUrl || "unknown");
  console.error("Response status:", response.status);
  console.error("Response body:", body);
  console.error("Captured error:", capturedError);
  
  if (capturedError instanceof Error) {
    console.error("Error name:", capturedError.name);
    console.error("Error message:", capturedError.message);
    console.error("Error stack:", capturedError.stack);
  }
  
  console.error("=== END SSR ERROR ===");
  
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = request.url;
    
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response, url);
    } catch (error) {
      // Verbose error logging for outer catch
      console.error("=== OUTER SSR ERROR ===");
      console.error("URL:", url);
      console.error("Error:", error);
      
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      console.error("=== END OUTER SSR ERROR ===");
      
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
