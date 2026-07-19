# Schema Verification Report

**Date:** $(Get-Date)
**Database:** Neon PostgreSQL

## Summary

✅ **ALL TABLES AND COLUMNS VERIFIED**

- Total items checked: 31
- Missing items found initially: 2
- Missing items after migration: 0

## Initial Verification Results

### Missing Tables (Fixed)
- ❌ `investor_profiles` → ✅ Added
- ❌ `capital_partner_profiles` → ✅ Added

### All Tables Verified ✅
1. loan_applications
2. loan_repayments
3. investor_profiles (ADDED)
4. capital_partner_profiles (ADDED)
5. platform_config
6. community_chat_messages
7. meeting_messages
8. moderation_reports

### All Columns Verified ✅

#### users table columns:
- two_factor_enabled
- two_factor_secret
- backup_codes
- loan_application_blocked
- vantage_test_prompted_at
- last_vantage_taken_at

#### founder_profiles table columns:
- whatsapp_link
- email_link
- telegram_link
- discord_link
- pitch_deck_url

#### service_orders table columns:
- escrow_status
- delivered_at

#### user_roles table columns:
- purchased_at
- expires_at
- grace_until
- renewal_status

#### feed_posts table columns:
- image_url

## Migration Applied

**File:** `migrations/add-missing-profile-tables.sql`

### investor_profiles table structure:
```sql
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_capacity DECIMAL(15, 2),
  investment_focus TEXT,
  risk_appetite TEXT CHECK (risk_appetite IN ('low', 'medium', 'high')),
  preferred_sectors TEXT[],
  accredited_investor BOOLEAN DEFAULT false,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  active_investments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### capital_partner_profiles table structure:
```sql
CREATE TABLE capital_partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT,
  organization_type TEXT,
  capital_available DECIMAL(15, 2),
  investment_criteria TEXT,
  sectors_of_interest TEXT[],
  minimum_investment DECIMAL(15, 2),
  maximum_investment DECIMAL(15, 2),
  geographical_focus TEXT[],
  total_deployed DECIMAL(15, 2) DEFAULT 0,
  active_partnerships INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Important Notes

1. **Data Type Correction**: The migration was initially failing because it assumed `users.id` was UUID, but it's actually TEXT in the database.

2. **Indexes Added**: Both tables have indexes on `user_id` for query performance.

3. **Triggers Added**: Both tables have `updated_at` triggers to automatically update timestamps.

4. **Foreign Key Constraints**: Both tables properly reference `users(id)` with CASCADE delete.

## Verification Scripts Created

1. `verify-schema.js` - Comprehensive schema verification script
2. `apply-missing-tables.js` - Migration application script
3. `check-users-table.js` - Database structure inspection script

## Conclusion

✅ **All required tables and columns now exist in the Neon database.**

The schema is complete and ready for the application to use all features including:
- Loan applications and repayments
- Investor profiles and capital partner profiles
- Two-factor authentication
- Contact links for founders
- Service order escrow
- User role management with renewal
- Feed posts with images
