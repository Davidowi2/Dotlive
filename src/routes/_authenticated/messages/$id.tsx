/**
 * /messages/$id — DEPRECATED. Redirects to /meetings?thread=<id>.
 *
 * The meeting/chat flow is now consolidated under /meetings.
 * The thread id is passed as a query param so /meetings can
 * auto-open the inline chat.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/meetings", search: { thread: params.id } });
  },
});
