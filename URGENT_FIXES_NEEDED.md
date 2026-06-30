# 🚨 URGENT FIXES NEEDED - Action Plan

**Date:** June 30, 2026  
**Priority:** HIGH  
**Status:** In Progress

---

## Issues Identified by User

### 1. **Jobs Section - Not Gigs/Freelance** 🔴
**Problem:** Jobs feel like employment, not freelance/remote gigs  
**Expected:** Gigs marketplace (like Fiverr/Upwork)  
**Current:** Full-time employment listings  

**Fix Required:**
- Change "Jobs" to "Gigs" throughout
- Change "Employment Type" to "Gig Type" (one-off, recurring, retainer)
- Remove salary/monthly pay → use project-based pricing
- Add delivery time estimates
- Change language from "hire" to "book"
- Make it feel like freelance work, not employment

**Files to modify:**
- `PostJobWizard.tsx` - Change wording, structure
- `marketplace.tsx` - Update to show gigs not jobs
- `work.tsx` - Reposition as freelance dashboard

---

### 2. **Job Posting Bug** 🔴
**Problem:** Can't actually post a job  
**Status:** Need to investigate PostJobWizard

**Fix Required:**
- Test the entire posting flow
- Check for blocking validation
- Verify API endpoint connectivity
- Fix any form submission issues

---

### 3. **DOT Work - Duplicate Leaderboard** 🔴
**Problem:** Leaderboard button in Work page header (already in sidebar)  
**Location:** `src/routes/_authenticated/work.tsx` line ~73

**Fix Required:**
```tsx
// REMOVE THIS:
<Link
  to="/work/leaderboard"
  className="inline-flex items-center gap-1.5..."
>
  <Trophy className="size-3.5 text-amber-500" />
  Leaderboard
</Link>
```

---

### 4. **Landing Page - Not Mobile Responsive** 🔴
**Problem:** Landing page broken on mobile devices  
**File:** `src/routes/index.tsx`

**Fix Required:**
- Hero section grid breaks on mobile
- Text too large on small screens
- Cards don't stack properly
- CTA buttons overflow
- Stat blocks misaligned

**Specific fixes:**
- Change `lg:grid-cols-12` to mobile-first
- Add `text-responsive` classes
- Stack hero card on mobile (hide on sm)
- Fix all grid layouts to `grid-cols-1 md:grid-cols-2`
- Make all padding responsive

---

### 5. **Currency Switcher Not Working** 🔴
**Problem:** Can't change from NGN to USD/ZAR/EUR/BTC in DOT OS card  
**Location:** `index.tsx` - StartupScoreHeroSection component

**Current (broken):**
```tsx
{["NGN", "USD", "ZAR", "EUR", "BTC"].map((c) => (
  <span key={c} className={`px-2 py-0.5 rounded ${c === "USD" ? "bg-primary..." : "..."}`}>
    {c}
  </span>
))}
```

**Fix Required:**
- Add useState for selected currency
- Make buttons clickable
- Update displayed values based on currency
- Add currency conversion logic
- Make the switcher interactive

---

### 6. **Venture Test** 🟡
**Problem:** Need to verify venture feature works  
**Action:** Test `/ventures` page functionality

---

### 7. **App Performance - Slow** 🟡
**Problem:** App is slow despite having no users  
**Possible causes:**
- Too many re-renders
- Large bundle size
- Unoptimized images
- Missing lazy loading
- Too many dependencies loaded upfront

**Investigation needed:**
- Run build analysis
- Check bundle size
- Identify slow components
- Profile React renders
- Check network waterfall

---

### 8. **Business/Startup Info** 🟡
**Problem:** Need better guidance about what a startup should be  
**Action:** Improve onboarding and help content for businesses

---

### 9. **Sidebar Scrolling Issues** 🔴
**Problem:** Sidebar has overflow/scrolling problems  
**Location:** `AppShell.tsx`

**Current code:**
```tsx
<aside className="hidden w-56 shrink-0 border-r border-border pr-6 lg:block">
  <nav className="sticky top-20 space-y-6">
```

**Fix Required:**
- Add `overflow-y-auto` to nav
- Add `max-h-[calc(100vh-6rem)]` to constrain height
- Ensure sidebar scrolls independently
- Test with many nav items

---

## Priority Order

### 🔴 CRITICAL (Do First):
1. Remove duplicate leaderboard button (5 minutes)
2. Fix landing page mobile responsiveness (2 hours)
3. Fix currency switcher (30 minutes)
4. Change Jobs → Gigs system (3 hours)
5. Fix job posting bug (1 hour)
6. Fix sidebar scrolling (30 minutes)

### 🟡 IMPORTANT (Do Next):
7. Test venture functionality (30 minutes)
8. Investigate app performance (2 hours)
9. Improve business onboarding content (1 hour)

**Total Estimated Time:** 10-12 hours

---

## Detailed Action Items

### Action 1: Remove Duplicate Leaderboard Button
**File:** `src/routes/_authenticated/work.tsx`
**Line:** ~73
**Change:**
```tsx
// FROM:
action={
  <div className="flex items-center gap-2">
    {isFounder && (
      <Button onClick={() => setShowPostJob(true)} size="sm">
        <Plus className="size-4" />
        Post a Job
      </Button>
    )}
    <Link to="/work/leaderboard" ...>  // ← REMOVE THIS
      <Trophy className="size-3.5 text-amber-500" />
      Leaderboard
    </Link>
  </div>
}

// TO:
action={
  isFounder ? (
    <Button onClick={() => setShowPostJob(true)} size="sm">
      <Plus className="size-4" />
      Post a Gig
    </Button>
  ) : undefined
}
```

---

### Action 2: Landing Page Mobile Responsive

**Changes needed in `index.tsx`:**

1. **Hero Section:**
```tsx
// FROM:
<div className="grid lg:grid-cols-12 gap-12 items-center">
  <div className="lg:col-span-7">...</div>
  <div className="lg:col-span-5 hidden lg:block">...</div>
</div>

// TO:
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
  <div className="lg:col-span-7">...</div>
  <div className="lg:col-span-5 hidden lg:block">...</div>
</div>
```

2. **Headline font size:**
```tsx
// FROM:
style={{ fontSize: "clamp(3rem, 8.5vw, 7rem)" }}

// TO:
style={{ fontSize: "clamp(2rem, 8vw, 7rem)" }}
// Reduces minimum from 3rem to 2rem for mobile
```

3. **CTA buttons:**
```tsx
// FROM:
<div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">

// TO:
<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
```

4. **Stat strip:**
```tsx
// FROM:
<div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4 pt-8 border-t border-border">

// TO:
<div className="mt-12 grid grid-cols-3 gap-4 pt-6 border-t border-border sm:flex sm:flex-wrap sm:gap-x-10">
```

5. **All grid layouts:**
```tsx
// Find all: className="grid lg:grid-cols-..."
// Replace with: className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-..."
```

---

### Action 3: Fix Currency Switcher

**In `StartupScoreHeroSection` function:**

```tsx
// ADD at top of component:
const [currency, setCurrency] = useState("USD");

// UPDATE the currency buttons:
<div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-1 text-[10px] tracking-widest uppercase font-semibold">
  <span className="text-muted-foreground px-2">Currency:</span>
  {["NGN", "USD", "ZAR", "EUR", "BTC"].map((c) => (
    <button
      key={c}
      onClick={() => setCurrency(c)}
      className={`px-2 py-0.5 rounded transition-colors ${
        c === currency 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {c}
    </button>
  ))}
</div>

// ADD conversion logic:
const conversions = {
  NGN: { symbol: "₦", rate: 1600 },
  USD: { symbol: "$", rate: 1 },
  ZAR: { symbol: "R", rate: 18 },
  EUR: { symbol: "€", rate: 0.92 },
  BTC: { symbol: "₿", rate: 0.000023 },
};

const convert = (usd: number) => {
  const { symbol, rate } = conversions[currency];
  const value = usd * rate;
  if (currency === "BTC") return `${symbol}${value.toFixed(6)}`;
  return `${symbol}${value.toLocaleString()}`;
};

// UPDATE metric values:
<p className="font-display text-2xl font-light mt-1">{convert(2000000000)}</p>
```

---

### Action 4: Jobs → Gigs System

**1. Update PostJobWizard.tsx:**

```tsx
// Change all "Job" to "Gig"
// Change steps:
const STEPS = [
  { n: 1, title: "Basics", icon: Briefcase },      // ← Same
  { n: 2, title: "Details", icon: FileText },      // ← Changed from "Description"
  { n: 3, title: "Pricing", icon: Coins },         // ← Changed from "Budget"
  { n: 4, title: "Review", icon: Sparkles },       // ← Same
  { n: 5, title: "Posted", icon: CheckCircle2 },   // ← Same
];

// Change employment types to gig types:
const GIG_TYPES = [
  { value: "one_off", label: "One-off Project" },
  { value: "recurring", label: "Recurring Gig" },
  { value: "retainer", label: "Monthly Retainer" },
];

// Change salary to project budget:
const [projectBudget, setProjectBudget] = useState(5000);  // Total project cost
const [deliveryDays, setDeliveryDays] = useState(7);      // Delivery time

// Remove escrow months, use single escrow:
const escrowAmount = Math.floor(projectBudget * 0.2);  // 20% upfront escrow
```

**2. Update marketplace.tsx:**

```tsx
// Change all language:
"Open gigs" ← Keep this
"Builders post services" ← Keep this
"Post a Gig" ← Change from "Post a Job"

// Service card should show:
- Gig title
- Delivery time (e.g., "7 days")
- Fixed price (not monthly)
- "Book Now" button (not "Hire")
```

**3. Update work.tsx:**

```tsx
// Change:
subtitle="Your freelance dashboard — gigs, contracts, earnings."  // ← Not "labor dashboard"

// Tabs:
<TabsTrigger value="overview">Overview</TabsTrigger>
<TabsTrigger value="active-gigs">Active Gigs</TabsTrigger>  // ← Changed
<TabsTrigger value="proposals">Proposals</TabsTrigger>        // ← Changed
<TabsTrigger value="earnings">Earnings</TabsTrigger>

// Remove "applications" tab (doesn't make sense for gigs)
```

---

### Action 5: Fix Sidebar Scrolling

**In `AppShell.tsx`:**

```tsx
// FROM:
<aside className="hidden w-56 shrink-0 border-r border-border pr-6 lg:block">
  <nav className="sticky top-20 space-y-6">
    {sections.map...}
  </nav>
</aside>

// TO:
<aside className="hidden w-56 shrink-0 border-r border-border pr-6 lg:block">
  <nav className="sticky top-20 space-y-6 overflow-y-auto max-h-[calc(100vh-6rem)] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
    {sections.map...}
  </nav>
</aside>

// ADD to globals.css:
.scrollbar-thin {
  scrollbar-width: thin;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.3);
}
```

---

## Testing Checklist

### After fixes, test:
- [ ] Landing page on mobile (375px, 768px, 1024px+)
- [ ] Currency switcher clicks and updates values
- [ ] Post a gig flow (all 5 steps)
- [ ] Gig appears in marketplace
- [ ] Sidebar scrolls smoothly with many items
- [ ] Leaderboard only in sidebar (not in Work header)
- [ ] All "Job" language changed to "Gig"
- [ ] Venture page loads correctly
- [ ] App feels faster

---

## Communication Strategy

### Tell the user:
1. **What was wrong** - Clear explanation
2. **What was fixed** - Specific changes
3. **How to test** - Steps to verify
4. **What's next** - Remaining items

---

**Status:** Ready to implement  
**Next Step:** Start with critical fixes (#1-6)  
**ETA:** 6-8 hours for all critical fixes
