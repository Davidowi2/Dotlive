# DOT Platform — Admin Dashboard Implementation

**Session 14 Prompt — Focus: Admin & Operator Dashboard**

---

## What is Admin Dashboard?

An operator/admin dashboard to manage the platform:
- User management (view, roles)
- Platform metrics
- Content moderation
- System configuration

---

## Current State

Check these files BEFORE writing any code:

1. **Existing admin**: Check for any admin routes
2. **User roles**: Check existing role system (admin, investor, founder, builder)

---

## Requirements

### 1. Backend

Update `dotlive-backend/apps/api/src/routes/` or create admin routes:

```typescript
// Admin-only routes (check user role in middleware)

// GET /api/admin/users - list all users
// Query: ?role=founder|investor|builder&search=...&limit=20&offset=0

// GET /api/admin/users/:id - single user details

// POST /api/admin/users/:id/role - change user role
// Body: { role: "admin" | "investor" | "founder" | "builder" }

// GET /api/admin/stats - platform-wide stats
// Returns: { totalUsers, totalVentures, totalInvestments, totalVouches }

// GET /api/admin/ventures - list ventures (with moderation flags)
// POST /api/admin/ventures/:id/feature - feature a venture
// POST /api/admin/ventures/:id/flag - flag for review

// GET /api/admin/reports - reported content
```

### 2. Frontend Hook

Create `src/hooks/use-admin.ts`:

```typescript
// useAdminUsers(role, search, pagination)
// useAdminUser(id)
// useUpdateUserRole(userId, role)
// useAdminStats()
// useAdminVentures()
// useFeatureVenture(ventureId)
// useFlagVenture(ventureId)
```

### 3. Admin Dashboard UI

Create `src/routes/operator.tsx` or update existing:

```
- Sidebar: Users | Ventures | Reports | Settings
- Stats overview cards at top

- Users tab:
  - Search by name/email
  - Filter by role
  - Table: name, email, role, venture, joined date
  - Click row -> details
  - Change role dropdown

- Ventures tab:
  - List of ventures
  - Feature/unfeature toggle
  - Flag for review

- Reports tab:
  - User-reported issues
  - Resolve action
```

### 4. Access Control

Only users with `admin` role can access:
- Add role check in route loader
- Show "Access Denied" for non-admins

---

## Design Guidelines

- Use existing Table, Card components
- Keep it functional over beautiful
- Show clear role badges
- Confirmation for role changes

---

## Testing

1. Access /operator as non-admin -> denied
2. Access as admin -> see dashboard
3. Search users
4. Change user role

---

## IMPORTANT

- DO NOT allow self-promotion to admin
- Always confirm role changes
- Build must pass before commit