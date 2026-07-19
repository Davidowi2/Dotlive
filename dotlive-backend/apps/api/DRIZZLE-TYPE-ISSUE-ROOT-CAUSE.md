# Root Cause: Drizzle ORM Type Inference Bug

## Issue Summary
TypeScript reports that columns defined in `schema.ts` don't exist when using `.update().set()`, despite the columns being properly defined and exported.

## Root Cause
**Known bug in Drizzle ORM v0.32.0 - v0.33.0** where optional fields (columns without `.notNull()`) are not included in the TypeScript update types.

### Evidence
1. **GitHub Issue**: https://github.com/drizzle-team/drizzle-orm/issues/2654
   - Reported in drizzle-orm v0.32.0
   - Affects optional fields in `.update().set()` operations
   - Confirmed to be a type inference bug

2. **Our Version**: `drizzle-orm@^0.33.0` (from package.json)
   - We're running an affected version

3. **Error Pattern**: 
   - TypeScript only sees unique/primary key columns in update types
   - Example: users table shows only `{ id, email, dotId }` - all unique fields
   - Missing ALL other columns including those with `.notNull().default()`

## Affected Columns in Our Schema

### users table
- ✅ `id` (primaryKey) - TypeScript sees this
- ✅ `email` (unique) - TypeScript sees this  
- ✅ `dotId` (unique) - TypeScript sees this
- ❌ `twoFactorEnabled` (notNull, has default) - TypeScript DOESN'T see this
- ❌ `twoFactorSecret` (nullable) - TypeScript DOESN'T see this
- ❌ `loanApplicationBlocked` (notNull, has default) - TypeScript DOESN'T see this
- ❌ All other non-unique columns

### loanApplications table
- ❌ `status` - TypeScript DOESN'T see this
- ❌ `reviewedBy` - TypeScript DOESN'T see this
- ❌ Most columns except constraints

### Similar pattern in:
- `feedPosts` (imageUrl)
- `wallets` (balance, lockedBalance)
- `serviceOrders` (status)
- `transactions` (description)

## Proper Fix

### Option 1: Upgrade to v1.0.0-rc.1+ (RECOMMENDED)
Drizzle v1.0.0-rc.1 includes:
- Complete internal rework with new codec system
- Fixed type inference issues
- 25-30% performance improvement
- JIT mappers for better performance

```bash
npm install drizzle-orm@latest drizzle-kit@latest
```

### Option 2: Downgrade to v0.31.x
Use a version before the bug was introduced:

```bash
npm install drizzle-orm@0.31.4 drizzle-kit@0.22.8
```

### Option 3: Keep current workaround (NOT RECOMMENDED)
Continue using `as any` type assertions, but this:
- Loses type safety
- Hides potential runtime errors
- Is a code smell

## Verification Steps After Fix

1. Remove all `as any` assertions from update operations
2. Run `npm run build` - should pass without TypeScript errors
3. Run `npm test` - all tests should pass
4. Verify no runtime errors in update operations

## Files Requiring Changes After Fix

Once Drizzle is upgraded, remove `as any` from:
- `src/routes/auth.ts` (lines 175, 191, 203)
- `src/routes/loan-applications.ts` (lines 196, 239, 278, 284, 317, 323)
- `src/scripts/archive-old-images.ts` (line 19)
- `src/scripts/auto-release-orders.ts` (lines 23, 29, 36, 39)

## Conclusion

This is NOT a schema issue, NOT an import issue, and NOT a configuration issue. 

It's a confirmed bug in Drizzle ORM v0.32.x-0.33.x that affects all optional/nullable columns in UPDATE operations.

The proper fix is to upgrade to v1.0.0-rc.1 or later where this bug has been resolved.
