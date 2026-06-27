/**
 * Role permissions matrix — single source of truth for what each
 * staff role can do. The frontend reads /api/admin/roles/hierarchy
 * to render the matrix; the backend uses hasPermission() to gate
 * routes.
 *
 * Add new permissions here as you build new admin tooling.
 */

export type Permission =
  // Users
  | "users.view"
  | "users.ban"
  | "users.unban"
  | "users.promote"
  | "users.demote"
  | "users.grant_admin"
  | "users.grant_super_admin"
  | "users.delete"
  // Wallets & DOT
  | "wallets.view"
  | "wallets.transfer"
  | "wallets.mint"
  | "wallets.burn"
  // Content
  | "content.view_flagged"
  | "content.approve"
  | "content.remove"
  | "content.unpublish"
  // Communities
  | "communities.view"
  | "communities.verify"
  | "communities.suspend"
  // Ventures
  | "ventures.view"
  | "ventures.feature"
  | "ventures.remove"
  // Events / Demo / Pitchathons
  | "events.view"
  | "events.create"
  | "events.publish"
  | "events.cancel"
  // Audit & System
  | "audit.view"
  | "system.view_health"
  | "system.config"
  | "feature_flags.toggle"
  // Support
  | "support.view_user_data"
  | "support.impersonate"
  // Bounties / Finance
  | "finance.review_withdrawals"
  | "finance.approve_withdrawals"
  | "finance.manage_payouts";

export interface RoleMeta {
  role: string;
  label: string;
  description: string;
  color: "emerald" | "blue" | "purple" | "amber" | "red" | "slate";
  isStaff: boolean;
  rank: number; // higher = more powerful
  permissions: Permission[];
}

/**
 * Roles, ordered from least to most powerful.
 * Higher rank overrides lower rank.
 */
export const ROLES: RoleMeta[] = [
  {
    role: "builder",
    label: "Builder",
    description: "Default role for new sign-ups. Can complete tasks and earn DOT.",
    color: "slate",
    isStaff: false,
    rank: 10,
    permissions: [],
  },
  {
    role: "founder",
    label: "Founder",
    description: "Building a venture. Has access to Vantage, academy, pitchathons.",
    color: "slate",
    isStaff: false,
    rank: 20,
    permissions: [],
  },
  {
    role: "investor",
    label: "Investor",
    description: "Browses, saves, follows ventures. Access to investor portal.",
    color: "slate",
    isStaff: false,
    rank: 20,
    permissions: [],
  },
  {
    role: "community_leader",
    label: "Community Leader",
    description: "Runs a community. Has dashboard, referral codes, rewards.",
    color: "slate",
    isStaff: false,
    rank: 20,
    permissions: [],
  },
  {
    role: "capital_partner",
    label: "Capital Partner",
    description: "Commits funds, sponsors events, hosts deal rooms.",
    color: "slate",
    isStaff: false,
    rank: 20,
    permissions: [],
  },
  {
    role: "vendor",
    label: "Vendor",
    description: "Service provider. Has vendor portal.",
    color: "slate",
    isStaff: false,
    rank: 20,
    permissions: [],
  },
  {
    role: "moderator",
    label: "Moderator",
    description: "Reviews flagged content. Can ban/unban users and remove inappropriate content.",
    color: "blue",
    isStaff: true,
    rank: 60,
    permissions: [
      "users.view",
      "users.ban",
      "users.unban",
      "content.view_flagged",
      "content.approve",
      "content.remove",
      "ventures.view",
      "communities.view",
    ],
  },
  {
    role: "support",
    label: "Support",
    description: "Helps users. Can view user data, but no destructive actions.",
    color: "purple",
    isStaff: true,
    rank: 60,
    permissions: [
      "users.view",
      "support.view_user_data",
      "wallets.view",
      "ventures.view",
      "communities.view",
      "audit.view",
    ],
  },
  {
    role: "finance",
    label: "Finance",
    description: "Manages DOT supply, withdrawals, and payouts. Cannot promote admins.",
    color: "amber",
    isStaff: true,
    rank: 70,
    permissions: [
      "users.view",
      "wallets.view",
      "wallets.transfer",
      "wallets.mint",
      "wallets.burn",
      "finance.review_withdrawals",
      "finance.approve_withdrawals",
      "finance.manage_payouts",
      "audit.view",
    ],
  },
  {
    role: "admin",
    label: "Admin",
    description: "Full moderation, content, and community management. Cannot grant admin to others or mint DOT.",
    color: "emerald",
    isStaff: true,
    rank: 80,
    permissions: [
      "users.view",
      "users.ban",
      "users.unban",
      "users.promote",
      "users.demote",
      "wallets.view",
      "content.view_flagged",
      "content.approve",
      "content.remove",
      "content.unpublish",
      "communities.view",
      "communities.verify",
      "communities.suspend",
      "ventures.view",
      "ventures.feature",
      "ventures.remove",
      "events.view",
      "events.create",
      "events.publish",
      "audit.view",
      "system.view_health",
      "feature_flags.toggle",
      "support.view_user_data",
    ],
  },
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Can do everything an admin can do, plus grant admin role and mint/burn DOT. Like the WhatsApp group creator — cannot be removed or demoted.",
    color: "red",
    isStaff: true,
    rank: 100,
    permissions: (() => {
      // All permissions
      const all: Permission[] = [
        "users.view", "users.ban", "users.unban", "users.promote", "users.demote",
        "users.grant_admin", "users.grant_super_admin", "users.delete",
        "wallets.view", "wallets.transfer", "wallets.mint", "wallets.burn",
        "content.view_flagged", "content.approve", "content.remove", "content.unpublish",
        "communities.view", "communities.verify", "communities.suspend",
        "ventures.view", "ventures.feature", "ventures.remove",
        "events.view", "events.create", "events.publish", "events.cancel",
        "audit.view", "system.view_health", "system.config", "feature_flags.toggle",
        "support.view_user_data", "support.impersonate",
        "finance.review_withdrawals", "finance.approve_withdrawals", "finance.manage_payouts",
      ];
      return all;
    })(),
  },
];

const ROLE_MAP = new Map<string, RoleMeta>(ROLES.map((r) => [r.role, r]));

/**
 * Check whether a set of roles grants a specific permission.
 * Highest-rank role wins on conflicts.
 */
export function hasPermission(roles: string[], permission: Permission): boolean {
  // Pick the highest-ranked role
  let bestRank = -1;
  let best: RoleMeta | null = null;
  for (const r of roles) {
    const meta = ROLE_MAP.get(r);
    if (!meta) continue;
    if (meta.rank > bestRank) {
      bestRank = meta.rank;
      best = meta;
    }
  }
  if (!best) return false;
  return best.permissions.includes(permission);
}

/**
 * Pick the highest-ranked staff role (used for "viewing as" indicator).
 */
export function getPrimaryStaffRole(roles: string[]): RoleMeta | null {
  let best: RoleMeta | null = null;
  for (const r of roles) {
    const meta = ROLE_MAP.get(r);
    if (!meta || !meta.isStaff) continue;
    if (!best || meta.rank > best.rank) best = meta;
  }
  return best;
}

/**
 * Get all staff roles + the user-facing roles (sorted by rank).
 */
export function getAllRoles(): RoleMeta[] {
  return [...ROLES].sort((a, b) => a.rank - b.rank);
}

/**
 * Get staff roles only.
 */
export function getStaffRoles(): RoleMeta[] {
  return ROLES.filter((r) => r.isStaff).sort((a, b) => a.rank - b.rank);
}

/**
 * Get all unique permission labels, grouped by category.
 */
export function getPermissionGroups(): Array<{ category: string; permissions: Array<{ key: Permission; label: string; description: string }> }> {
  const groups: Array<{ category: string; permissions: Array<{ key: Permission; label: string; description: string }> }> = [
    {
      category: "Users",
      permissions: [
        { key: "users.view",             label: "View users",         description: "See user list, profiles, balances" },
        { key: "users.ban",              label: "Ban users",          description: "Suspend user accounts" },
        { key: "users.unban",            label: "Unban users",        description: "Lift bans" },
        { key: "users.promote",          label: "Promote users",      description: "Add roles (e.g. community_leader)" },
        { key: "users.demote",           label: "Demote users",       description: "Remove roles" },
        { key: "users.grant_admin",      label: "Grant admin",        description: "Promote to admin — super-admin only" },
        { key: "users.grant_super_admin",label: "Grant super admin",  description: "Promote to super_admin — super-admin only" },
        { key: "users.delete",           label: "Delete users",       description: "Permanently remove (GDPR)" },
      ],
    },
    {
      category: "Wallets & DOT",
      permissions: [
        { key: "wallets.view",     label: "View wallets",      description: "See balances + transactions" },
        { key: "wallets.transfer", label: "Transfer DOT",      description: "Move user-to-user, user-to-self" },
        { key: "wallets.mint",     label: "Mint DOT",          description: "Increase total supply (super-admin only)" },
        { key: "wallets.burn",     label: "Burn DOT",          description: "Decrease total supply (super-admin only)" },
      ],
    },
    {
      category: "Content",
      permissions: [
        { key: "content.view_flagged", label: "View flagged content", description: "See moderation queue" },
        { key: "content.approve",      label: "Approve content",      description: "Clear flags" },
        { key: "content.remove",       label: "Remove content",       description: "Delete violating content" },
        { key: "content.unpublish",    label: "Unpublish",            description: "Hide without deleting" },
      ],
    },
    {
      category: "Communities",
      permissions: [
        { key: "communities.view",    label: "View communities", description: "Browse all communities" },
        { key: "communities.verify",  label: "Verify communities", description: "Mark as verified/enterprise" },
        { key: "communities.suspend", label: "Suspend communities", description: "Disable communities" },
      ],
    },
    {
      category: "Ventures",
      permissions: [
        { key: "ventures.view",    label: "View ventures", description: "See venture submissions" },
        { key: "ventures.feature", label: "Feature ventures", description: "Pin to top" },
        { key: "ventures.remove",  label: "Remove ventures", description: "Delete violating ventures" },
      ],
    },
    {
      category: "Events / Demo",
      permissions: [
        { key: "events.view",    label: "View events",    description: "See all events" },
        { key: "events.create",  label: "Create events",  description: "Draft new events" },
        { key: "events.publish", label: "Publish events", description: "Make events live" },
        { key: "events.cancel",  label: "Cancel events",  description: "Pull events from public" },
      ],
    },
    {
      category: "Audit & System",
      permissions: [
        { key: "audit.view",           label: "View audit log",       description: "See admin actions" },
        { key: "system.view_health",   label: "View system health",   description: "DB + integrations status" },
        { key: "system.config",        label: "Configure system",     description: "Edit system-wide settings" },
        { key: "feature_flags.toggle", label: "Toggle feature flags", description: "Roll out features" },
      ],
    },
    {
      category: "Support",
      permissions: [
        { key: "support.view_user_data", label: "View user PII",   description: "See email, phone, KYC docs" },
        { key: "support.impersonate",    label: "Impersonate user", description: "Sign in as another user (super-admin only)" },
      ],
    },
    {
      category: "Finance",
      permissions: [
        { key: "finance.review_withdrawals", label: "Review withdrawals", description: "See pending withdrawal requests" },
        { key: "finance.approve_withdrawals",label: "Approve withdrawals", description: "Approve or reject" },
        { key: "finance.manage_payouts",      label: "Manage payouts",      description: "Bulk payouts, statements" },
      ],
    },
  ];
  return groups;
}
