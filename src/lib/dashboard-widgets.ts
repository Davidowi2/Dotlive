export interface WidgetConfig {
  id: string;
  showFor: string[];
}

export const dashboardWidgets: WidgetConfig[] = [
  { id: "wallet", showFor: ["builder", "founder", "investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin", "moderator", "support", "finance"] },
  { id: "vantage", showFor: ["founder", "builder", "investor", "capital_partner"] },
  { id: "builder-journey", showFor: ["founder"] },
  { id: "profile-completion", showFor: ["builder"] },
  { id: "stakes", showFor: ["builder", "founder", "investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin", "moderator", "support", "finance"] },
  { id: "net-worth", showFor: ["builder", "founder", "investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin", "moderator", "support", "finance"] },
  { id: "pulse", showFor: ["builder", "founder", "investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin", "moderator", "support", "finance"] },
  { id: "explore", showFor: ["builder", "founder", "investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin", "moderator", "support", "finance"] },
];
