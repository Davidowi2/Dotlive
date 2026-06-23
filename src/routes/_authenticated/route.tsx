import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/api/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    // Check for JWT token in localStorage.
    // DotAuthProvider handles loading the actual user — this guard just
    // ensures unauthenticated visitors can't reach protected routes.
    const token = getToken();
    if (!token) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
