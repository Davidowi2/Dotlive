# 🔧 Regression Fixes Needed - July 10, 2026

## Issues Found

### 1. Discover Page - 3-Dot Menu Not Working ❌
**Issue**: The MoreHorizontal button exists but has no onClick handler
**Location**: `src/routes/_authenticated/discover.tsx` line ~365
**Current**:
```tsx
<button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
  <MoreHorizontal className="size-4" />
</button>
```

**Fix Needed**:
- Add DropdownMenu from shadcn/ui
- Add Delete option (calls DELETE /api/feed/:id)
- Add Edit option (opens edit modal)
- Check if user is post author or admin before showing delete

### 2. Meetings Routes - Wrong Path Prefix ❌
**Issue**: Routes defined as `/api/meetings/slots` but prefix is already `/api`
**Location**: `dotlive-backend/apps/api/src/routes/meetings.ts`
**Result**: Routes become `/api/api/meetings/slots` (404)

**Current**:
```typescript
export async function meetingsRoutes(app: FastifyInstance) {
  app.get("/api/meetings/slots", ...)  // ❌ Wrong
  app.post("/api/meetings", ...)       // ❌ Wrong
}
```

**Fix Needed**:
```typescript
export async function meetingsRoutes(app: FastifyInstance) {
  app.get("/meetings/slots", ...)  // ✅ Correct
  app.post("/meetings", ...)       // ✅ Correct
}
```

### 3. Other Pages to Check for Regression
Need to verify these pages still work:
- [ ] Analytics page
- [ ] Stakes page
- [ ] Ventures page
- [ ] Community page
- [ ] Profile page

---

## Fix Priority

1. **HIGH**: Meetings routes (breaks entire meetings feature)
2. **MEDIUM**: Delete/Edit posts (user experience issue)
3. **LOW**: Regression check on other pages

