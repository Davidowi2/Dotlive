import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchRedirect,
});

function SearchRedirect() {
  const navigate = useNavigate();
  const q = useSearch({ from: "/_authenticated/search" }) as { q?: string } ?? {};
  const query = typeof q?.q === "string" ? q.q : "";

  useEffect(() => {
    if (query.trim().length > 0) {
      navigate({ to: "/discover", search: { q: query.trim() } });
    } else {
      navigate({ to: "/discover" });
    }
  }, [query, navigate]);

  return null;
}
