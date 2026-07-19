import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Heart, TrendingUp, Wallet, Briefcase, Loader, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsOverview, usePageViews, useActivity, useTrends } from "@/hooks/use-analytics";
import { formatDot, formatNaira } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DOT" },
      { name: "description", content: "View your profile analytics, activity, and insights." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const { overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { views, isLoading: viewsLoading } = usePageViews(period);
  const { activities, isLoading: activitiesLoading } = useActivity(period, 10);
  const { trends, isLoading: trendsLoading } = useTrends(period);

  const isLoading = overviewLoading || viewsLoading || activitiesLoading || trendsLoading;

  // Calculate total views for the period
  const totalViewsInPeriod = views.reduce((sum, v) => sum + v.count, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        subtitle="Track your profile activity, growth, and engagement metrics."
      />

      {/* Period selector */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        {(["7d", "30d", "90d"] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Profile Views"
              value={overview?.totalViews?.toLocaleString() || "0"}
              icon={Eye}
              trend={{ label: `+${totalViewsInPeriod} this period`, value: `${totalViewsInPeriod}`, direction: "neutral" }}
              accent="primary"
            />
            <StatCard
              label="Vouches Received"
              value={overview?.totalVouches?.toLocaleString() || "0"}
              icon={Heart}
              trend={{ label: `${overview?.totalVouches || 0 > 0 ? "+" : ""}${overview?.totalVouches || 0}`, value: `${overview?.totalVouches || 0}`, direction: (overview?.totalVouches || 0) > 0 ? "up" : "neutral" }}
              accent="primary"
            />
            <StatCard
              label="Investment Interest"
              value={overview?.totalInvestments?.toLocaleString() || "0"}
              icon={TrendingUp}
              trend={{ label: "interest signals", value: `${overview?.totalInvestments || 0}`, direction: "neutral" }}
              accent="primary"
            />
            <StatCard
              label="Wallet Balance"
              value={formatDot(Number(overview?.walletBalance ?? 0))}
              icon={Wallet}
              trend={{ label: "available DOT", value: "", direction: "neutral" }}
              accent="primary"
            />
            <StatCard
              label="Ventures"
              value={overview?.venturesCount?.toString() || "0"}
              icon={Briefcase}
              trend={{ label: "active ventures", value: `${overview?.venturesCount || 0}`, direction: "neutral" }}
              accent="primary"
            />
          </div>

          {/* Charts and activity section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Views chart */}
            <Card className="lg:col-span-2 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Profile Views Over Time
              </h3>
              {views.length > 0 ? (
                <div className="space-y-3">
                  {views.map((v) => (
                    <div key={v.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground min-w-20">{v.date}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min((v.count / Math.max(...views.map((x) => x.count), 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-12 text-right">{v.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No view data for this period
                </p>
              )}
            </Card>

            {/* Trends summary */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Trends Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Views</p>
                  <p className="text-2xl font-bold">{totalViewsInPeriod}</p>
                  <p className="text-xs text-muted-foreground">across {views.length} days</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vouches</p>
                  <p className="text-2xl font-bold">{trends?.vouches?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">total received</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Views/Day</p>
                  <p className="text-2xl font-bold">
                    {views.length > 0 ? (totalViewsInPeriod / views.length).toFixed(0) : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">this period</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <Card className="mt-6 p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {activity.metadata && (
                        <p className="text-sm text-muted-foreground">
                          {JSON.stringify(activity.metadata).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity for this period
              </p>
            )}
          </Card>

          {/* Footer note */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
            <p>
              Analytics are calculated based on recorded page views and activity events. Data refreshes every 5 minutes.
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
}
