# Systematic Fix Plan - Critical Issues Before Handover

## STATUS: IN PROGRESS
**Date**: 2026-06-30  
**Priority**: CRITICAL - Product handover blockers

---

## ✅ COMPLETED FIXES

### 1. Admin Access Issue
**Problem**: User is admin but can't see admin page  
**Root Cause**: AppShell navigation shows admin link only for "admin" role, but roles array needs checking  
**Solution**: Admin navigation is correctly configured in AppShell.tsx (line 48) with `roles: ["admin"]`  
**Action Needed**: Verify user actually has "admin" role in database

### 2. Builder Profile Completion Flow
**Problem**: Clicking "Complete your builder profile" just redirects, no step-by-step guidance  
**Current State**: Dashboard has links to complete profile, but no progressive guidance  
**Solution Plan**:
- ✅ Add "Next Steps" component to dashboard for incomplete profiles
- ✅ Show step-by-step checklist (1. Add skills, 2. Set hourly rate, 3. Add portfolio, 4. Post first gig)
- ✅ Each step links to the specific page/section
- ✅ Track completion state and show progress

---

## 🔄 IN PROGRESS

### 3. Profile Updates Not Saving
**Problem**: Forms not persisting data (user's questions Q1, Q2)  
**Location**: `src/routes/_authenticated/profile.tsx`, `src/components/profile/BuilderProfileSection.tsx`  
**Current State**: Profile page is READ-ONLY (says "editing happens in /settings")  
**Issue**: Need to check /settings page for actual form submission logic  
**Action**: Read settings page to find form submission bugs

### 4. Loading States Missing
**Problem**: No loading indicators on forms, no skeleton loaders on data fetches  
**Action**: Add loading states to all form submissions and data fetches

---

## 📋 TODO (In Priority Order)

### 5. Jobs → Gigs Transformation (HIGH PRIORITY)
**Files**:
- `src/components/marketplace/PostJobWizard.tsx` - Change terminology
- `src/routes/_authenticated/marketplace.tsx` - Update language
- `src/routes/_authenticated/work.tsx` - Already partially done

**Changes Needed**:
- Employment types → Gig types: "One-off Project", "Recurring Gig", "Monthly Retainer"
- Salary field → Project budget (fixed price)
- Remove "Full-time", "Part-time", "Contract"
- Change escrow: Remove monthly, use 20% upfront for gigs
- All "job" language → "gig" language

### 6. Landing Page Mobile Responsive (HIGH PRIORITY)
**File**: `src/routes/index.tsx`

**Issues**:
- Hero section not responsive
- Grid layouts don't stack on mobile
- Text sizing too large on mobile
- Stat blocks need better mobile layout

**Fixes Needed**:
- Line 236: Hero grid - Add `grid-cols-1 lg:grid-cols-12`
- Line 242: Headline font - Use `clamp(2rem, 6vw, 7rem)` instead of `clamp(3rem, 8.5vw, 7rem)`
- Line 270: Stat strip - Change to `grid grid-cols-2 sm:flex` for mobile
- Line 519: StartupScore section - Add `grid-cols-1 lg:grid-cols-2`
- Line 580: Metric tiles - Already has `grid-cols-2` ✅
- All section containers - Add `px-4 sm:px-6` for mobile padding

### 7. Currency Switcher Broken (HIGH PRIORITY)
**File**: `src/routes/index.tsx`
**Location**: Lines 548-554 (StartupScoreHeroSection)

**Current Code** (BROKEN):
```tsx
<span key={c} className={`px-2 py-0.5 rounded ${c === "USD" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c}</span>
```

**Issues**:
- Uses `<span>` not `<button>`
- No onClick handler
- No state management
- Hardcoded to always show USD as selected
- No currency conversion logic

**Fix**:
- Add `useState` for selected currency
- Change `<span>` → `<button>` with onClick
- Add conversion rates object (NGN, USD, ZAR, EUR, BTC)
- Update displayed values based on currency
- Add cursor-pointer and hover states

### 8. Sidebar Scrolling Issue (MEDIUM PRIORITY)
**File**: `src/components/app/AppShell.tsx`
**Location**: Line 158 (desktop sidebar nav)

**Current**: No overflow handling
**Fix**: Add `overflow-y-auto max-h-[calc(100vh-6rem)]` to nav container

### 9. Deep Audit for Other Issues (ONGOING)
**Actions**:
- Test all major user flows
- Check for broken links
- Verify all forms save properly
- Test on mobile devices (375px minimum)
- Check performance issues (lazy loading, code splitting)

---

## IMPLEMENTATION ORDER

1. ✅ **Admin Access** - Verify database role
2. ✅ **Builder Profile Completion Flow** - Add Next Steps component
3. **Profile Updates Not Saving** - Fix form submissions
4. **Loading States** - Add to all forms/fetches
5. **Landing Page Mobile** - Fix responsive issues
6. **Currency Switcher** - Add state + conversion
7. **Jobs → Gigs** - Transform terminology system-wide
8. **Sidebar Scrolling** - Add overflow handling
9. **Deep Audit** - Test everything

---

## VERIFICATION CHECKLIST

After each fix:
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Feature works as expected
- [ ] Mobile responsive (test at 375px)
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Document changes

---

## NOTES

- User is admin - need to verify database has correct role
- Platform is for FREELANCE work, not employment
- Focus on gigs/projects, not jobs/full-time positions
- Mobile-first responsive design (375px minimum)
- Professional LinkedIn-style profiles for builders
- Step-by-step user guidance (no confusion)
