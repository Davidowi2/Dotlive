import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Store, Briefcase } from "lucide-react";
import { marketplaceApi } from "../api/marketplace.js";
import { useAuth } from "../contexts/AuthContext.js";
import { AppShell } from "../components/AppShell.js";

export function WorkPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState<"gigs" | "jobs">("gigs");
  const [search, setSearch] = useState("");

  const services = useQuery({
    queryKey: ["services", search],
    queryFn: () => marketplaceApi.listServices({ search }),
    enabled: tab === "gigs",
  });
  const jobs = useQuery({
    queryKey: ["jobs", search],
    queryFn: () => marketplaceApi.listJobs({ search }),
    enabled: tab === "jobs",
  });

  return (
    <AppShell>
      <h1 className="font-display text-4xl font-bold">DOT Work</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Gigs (services) and Jobs (formal listings). Pay in DOT.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] py-2.5 pl-9 pr-3 outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] p-1">
            <button
              onClick={() => setTab("gigs")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${tab === "gigs" ? "bg-[var(--primary)] text-black" : "text-[var(--text-muted)]"}`}
            >
              <Store className="size-3.5" /> Gigs
            </button>
            <button
              onClick={() => setTab("jobs")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${tab === "jobs" ? "bg-[var(--primary)] text-black" : "text-[var(--text-muted)]"}`}
            >
              <Briefcase className="size-3.5" /> Jobs
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          {tab === "gigs" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
              {services.data?.services.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No gigs match your search.</p>
              )}
              {services.data?.services.map((s) => (
                <div key={s.id} className="glass rounded-2xl p-5">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{s.category}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--text-muted)]">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-[var(--primary)]">
                      {s.priceDot.toLocaleString()} DOT
                    </p>
                    <span className="text-xs text-[var(--text-muted)]">{s.deliveryDays}d delivery</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "jobs" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
              {jobs.data?.jobs.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No open jobs right now.</p>
              )}
              {jobs.data?.jobs.map((j) => (
                <div key={j.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{j.category}</span>
                    <span className="text-[10px] uppercase text-[var(--text-muted)]">
                      {j.employmentType.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">{j.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--text-muted)]">{j.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-[var(--primary)]">
                      {j.salaryDot.toLocaleString()} DOT
                    </p>
                    <button className="btn-ghost py-1.5 text-xs">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </AppShell>
  );
}
