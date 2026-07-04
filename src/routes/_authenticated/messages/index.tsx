/**
 * Messages — DEPRECATED. Redirects to /meetings.
 *
 * Meetings is now the single surface for both meeting requests
 * AND active chat threads. This route exists only to redirect
 * stale bookmarks / open tabs.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages/")({
  beforeLoad: () => {
    throw redirect({ to: "/meetings" });
  },
});
