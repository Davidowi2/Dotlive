import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { searchAll } from "@/api/search";
import { useNavigate } from "@tanstack/react-router";

type SearchResult = {
  posts: Array<{ id: string; type: string; title: string | null; body: string; authorName: string | null }>;
  people: Array<{ id: string; name: string | null; dotId: string | null }>;
  ventures: Array<{ id: string; name: string; industry: string | null; stage: string | null }>;
};

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ posts: [], people: [], ventures: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ posts: [], people: [], ventures: [] });
      setError(null);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults({ posts: [], people: [], ventures: [] });
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchAll(trimmed, 5);
        setResults(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const hasResults = results.posts.length + results.people.length + results.ventures.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col overflow-hidden border border-border bg-background shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, people, ventures..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button variant="ghost" size="icon" onClick={() => setQuery("")}>
              <X className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-xs text-muted-foreground">Searching...</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {!loading && !error && !query.trim() && (
            <p className="text-xs text-muted-foreground">Type something to search across posts, people, and ventures.</p>
          )}
          {!loading && !error && query.trim() && !hasResults && (
            <p className="text-xs text-muted-foreground">No results found.</p>
          )}

          {results.ventures.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Ventures</p>
              <div className="space-y-2">
                {results.ventures.map((v) => (
                  <button
                    key={v.id}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      navigate({ to: "/ventures/$id", params: { id: v.id } });
                      onClose();
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.industry ?? "—"} · {v.stage ?? ""}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {results.people.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">People</p>
              <div className="space-y-2">
                {results.people.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      navigate({ to: "/profile/$id", params: { id: p.id } });
                      onClose();
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">{p.dotId ?? ""}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {results.posts.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Posts</p>
              <div className="space-y-2">
                {results.posts.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      navigate({ to: "/discover/post/$id", params: { id: p.id } });
                      onClose();
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title ?? "Post"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.authorName ?? ""} · {p.type}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {hasResults && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate({ to: "/discover", search: { q: query.trim() } });
                  onClose();
                }}
              >
                See all results for “{query.trim()}”
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
