# 🐛 Frontend Bugs & Missing Features — Comprehensive Report

**Date:** June 30, 2026  
**Priority:** HIGH - These block production launch

---

## Critical Issues Found

### 1. 🔴 Signup Flow Incomplete - No User Details Collected

**Issue:** Signup only asks for name, email, password. No meaningful user data collected.

**Current Flow:**
1. Step 1: Name, email, password ✅
2. Step 2: (skipped)
3. Step 3: Email verification ✅  
4. Step 4: Intent selection (what they want to do) ✅
5. Step 5: Follow-up questions per intent - **BUT THESE ARE NEVER SAVED!**

**Problems:**
- User selects "I want to earn" → chooses skills → **data discarded**
- User selects "I have a business" → chooses stage → **data discarded**
- User selects "I want to invest" → chooses range → **data discarded**
- Only name/email/password saved to database
- No location/country captured during signup
- No phone number collected

**Impact:**
- Can't personalize experience
- Can't match users to opportunities
- Can't do proper segmentation
- Platform looks unfinished

**Location in Code:**
```typescript
// src/routes/auth.tsx line ~730
async function completeSignup(chosenIntent: SignupIntent, chips: string[]) {
  // ... sends signupToken, password, name
  // ❌ BUT NEVER SENDS: chips, businessStage, investRange, country
}
```

---

### 2. 🔴 Onboarding Flow Too Basic - Missing Builder Profile Setup

**Issue:** After signup, onboarding only asks for role. Builders get no setup wizard.

**Current Onboarding:**
1. Pick role (builder/founder/investor/community_leader) ✅
2. IF founder → collect venture details ✅
3. Accept terms ✅
4. Done → Dashboard

**Missing for Builders:**
- ❌ No skills selection
- ❌ No hourly rate / pricing
- ❌ No portfolio links
- ❌ No bio/description
- ❌ No availability status
- ❌ No sample work / experience level
- ❌ No preferred work types (gigs vs full-time)

**Impact:**
- Builders can't be matched to jobs
- No way to showcase skills
- Marketplace won't work
- Looks amateur compared to Upwork/Fiverr

**What Competitors Do:**
- Upwork: 10-step profile builder
- Fiverr: Create first gig during onboarding
- Toptal: Skills test + portfolio review

---

### 3. 🔴 No Way to Post Jobs or Gigs

**Issue:** The `/work` page is read-only. No posting interface.

**Current `/work` page:**
- Shows user's own contracts ✅
- Shows earnings ✅
- Shows applications ✅
- "To HIRE or POST jobs, go to /discover → Open roles" ⚠️

**Problem:**
- `/discover` has NO job posting interface
- Checked all routes - **no job creation page exists**
- Dead link in UI: "Post a job" button goes nowhere

**Missing:**
- ❌ `/work/post-job` page
- ❌ `/work/post-gig` page
- ❌ Job creation form (title, description, budget, deadline)
- ❌ Gig creation flow
- ❌ Draft saving
- ❌ Job preview before publishing

**Impact:**
- Core marketplace feature missing
- Can't match supply (builders) with demand (jobs)
- Platform is one-sided

---

### 4. 🔴 Community Page Incomplete

**Issue:** Community page exists but is barebones.

**Current `/community` page:**
- Shows community name ✅
- Shows member list ✅
- Shows referral code/QR ✅
- **Missing everything else**

**Missing Community Features:**
- ❌ No Discord-style channels (code exists in backend but not wired to UI)
- ❌ No community posts/feed
- ❌ No events calendar
- ❌ No member directory with profiles
- ❌ No community challenges
- ❌ No leader dashboard with analytics
- ❌ No member engagement metrics
- ❌ No way to message members
- ❌ No community settings/customization

**Code Evidence:**
- Backend has `/api/communities/:id/channels` endpoint
- Backend has `/api/communities/:id/posts` endpoint
- Frontend routes exist: `src/routes/_authenticated/community/channels.tsx`
- **BUT** community.tsx doesn't link to channels

**Impact:**
- Community leaders can't engage members
- Just a member list - no actual community happening
- Competitors (Slack, Discord, Circle) have way better UX

---

### 5. 🟡 Mobile Responsiveness Issues

**Issue:** App not fully mobile-friendly.

**Problems Found:**

**Auth Page:**
- Signup flow too wide on mobile (720px form on 375px screen)
- Progress dots overlap on small screens
- Country/region selectors cut off on mobile
- Password strength indicator wraps badly

**Dashboard:**
- Stat cards don't stack properly on mobile
- Side navigation doesn't collapse to hamburger
- Tables scroll horizontally (bad UX)
- Action buttons overflow

**Community Page:**
- QR code section too large on mobile
- Member table not responsive
- Referral URL wraps badly

**Work Page:**
- 4-column stats compress into unreadable layout
- Tabs overflow on narrow screens
- Empty states don't scale down

**Discover Page:**
- Filter sidebar doesn't collapse
- Cards don't resize
- Search bar fixed width

**Quick Wins:**
```css
/* Add these Tailwind classes throughout */
.stat-grid { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 }
.card { @apply p-4 md:p-6 }
.page-header { @apply text-2xl md:text-3xl lg:text-4xl }
```

---

### 6. 🟡 Leaderboard Not Accessible

**Issue:** Leaderboard exists at `/work/leaderboard` but not discoverable.

**Problems:**
- No main navigation link
- Only accessible via small badge on `/work` page
- Should be in app shell navigation
- Should be in Discover section
- Missing from home page

**Fix:** Add to main navigation + create `/leaderboard` top-level route

---

### 7. 🟡 Builder Details Never Captured

**Issue:** No builder profile creation wizard.

**What's Missing:**
- Skills/expertise selection
- Hourly rate or project rates
- Portfolio URL
- GitHub/LinkedIn/Behance links
- Bio (elevator pitch)
- Years of experience
- Education/certifications
- Work availability (full-time/part-time/weekends)
- Time zone
- Preferred payment methods

**Current State:**
- `builder_profiles` table exists in database
- Frontend has NO form to fill it
- Onboarding skips builders entirely

---

### 8. 🟡 Form Validation Inconsistent

**Issues Found:**
- Some forms validate on blur, others on submit
- Error messages inconsistent styling
- No loading states on some submit buttons
- Success messages use different toast styles
- Required field markers (*) missing
- No inline validation feedback

---

### 9. 🟡 Empty States Need Work

**Current empty states are too generic:**
- "No data yet" - not helpful
- Missing CTAs in many places
- No illustrations or icons in some spots
- Text too technical ("No entities found")

**Should Have:**
- Friendly tone ("Let's get started!")
- Clear next action button
- Optional: illustration/icon
- Explanation of what will appear here

---

### 10. 🟡 Navigation Issues

**Problems:**
- No breadcrumbs
- Back button inconsistent (sometimes there, sometimes not)
- No "current page" indicator in nav
- Mobile nav doesn't exist (no hamburger menu)
- Search not prominent
- Notifications bell but no badge count in some views

---

## Priority Fix Roadmap

### 🔴 CRITICAL (Block Launch) - Fix in Next 2 Days

#### Priority 1: Complete Signup Flow
**Effort:** 4 hours

**Tasks:**
1. Add country dropdown to Step 1 (reuse onboarding component)
2. Save intent + chips + stage/range to user metadata
3. Create `user_metadata` JSONB column if not exists
4. Update `completeSignup` to send all data
5. Show collected data on profile page

**Code Changes:**
```typescript
// src/routes/auth.tsx
async function completeSignup(chosenIntent: SignupIntent, chips: string[]) {
  const metadata = {
    intent: chosenIntent,
    skills: chips, // for "earn"
    interests: chips, // for "learn"
    businessStage, // for "business"
    investRange, // for "invest"
    country, // capture in Step 1
  };
  
  await dotApi.post("/api/auth/complete-signup", {
    signupToken,
    password,
    name: name.trim(),
    metadata, // ← NEW
  });
}
```

#### Priority 2: Builder Onboarding Wizard
**Effort:** 6 hours

**Tasks:**
1. Create `src/routes/_authenticated/onboarding/builder.tsx`
2. Add to onboarding flow after role selection
3. Multi-step form:
   - Step 1: Skills (chips selection, min 3)
   - Step 2: Experience level + hourly rate
   - Step 3: Bio + portfolio links
   - Step 4: Availability
4. Save to `builder_profiles` table
5. Redirect to dashboard after complete

**UI Flow:**
```
Role Selection: "Builder" selected
  ↓
Builder Wizard:
  [Step 1: Skills] → [Step 2: Rates] → [Step 3: Bio] → [Step 4: Availability]
  ↓
Dashboard with "Complete your profile" banner if incomplete
```

#### Priority 3: Job/Gig Posting Interface
**Effort:** 8 hours

**Tasks:**
1. Create `/work/post` route (handles both jobs & gigs)
2. Form fields:
   - Type: Job vs Gig
   - Title (max 60 chars)
   - Description (rich text)
   - Category dropdown
   - Budget (DOT amount)
   - Duration/Deadline
   - Required skills
   - Attachments
3. Preview before publish
4. Save as draft option
5. Wire to `/api/jobs` POST endpoint
6. Add "Post a Job" button to discover page
7. Add "My Postings" tab to /work page

---

### 🟡 HIGH (Polish for Launch) - Fix in Next Week

#### Priority 4: Mobile Responsiveness Pass
**Effort:** 6 hours

**Tasks:**
1. Audit all pages on iPhone SE (375px)
2. Fix stat card layouts (force vertical stack)
3. Add hamburger menu for mobile nav
4. Make all tables horizontally scrollable
5. Shrink form widths on mobile
6. Test on real devices
7. Fix touch target sizes (min 44x44px)

#### Priority 5: Complete Community Features
**Effort:** 10 hours

**Tasks:**
1. Wire up channels page (`/community/channels`)
2. Add "Channels" tab to community page
3. Implement post feed with replies
4. Add emoji reactions
5. Create event posting interface
6. Build member directory with filters
7. Add community analytics dashboard for leaders

#### Priority 6: Leaderboard Visibility
**Effort:** 1 hour

**Tasks:**
1. Add "Leaderboard" to main app navigation
2. Create `/leaderboard` route (alias to `/work/leaderboard`)
3. Add leaderboard widget to dashboard
4. Link from builder profile pages

---

### 🟢 MEDIUM (Post-Launch) - Fix in Month 1

#### Priority 7: Form Validation Overhaul
- Standardize validation library (use Zod everywhere)
- Add inline validation
- Consistent error styling
- Loading states on all submit buttons

#### Priority 8: Empty State Improvements
- Add illustrations (use Lucide or custom SVGs)
- Rewrite copy (friendly, action-oriented)
- Ensure every empty state has a CTA

#### Priority 9: Navigation Enhancements
- Add breadcrumbs
- Mobile hamburger menu
- Search prominence
- Notification badge counts

---

## Mobile Responsiveness Checklist

### Layout Issues
- [ ] Stat cards stack vertically on mobile
- [ ] Forms don't exceed screen width
- [ ] Tables scroll horizontally (not overflow)
- [ ] Modals fit on small screens
- [ ] Images scale down
- [ ] Navigation collapses to hamburger
- [ ] Footer adapts to narrow screens

### Touch Targets
- [ ] Buttons min 44x44px
- [ ] Form inputs min 44px height
- [ ] Links have enough spacing
- [ ] Dropdowns easy to tap
- [ ] Icons large enough

### Typography
- [ ] Font sizes scale down on mobile
- [ ] Line lengths readable (45-75 chars)
- [ ] Headers don't wrap awkwardly
- [ ] Code blocks scroll not wrap

### Testing Viewports
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 13)
- [ ] 414px (iPhone 14 Pro Max)
- [ ] 360px (Samsung Galaxy)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro)

---

## Specific Code Fixes Needed

### 1. Fix Signup Data Collection

**File:** `src/routes/auth.tsx`

**Line ~730 - completeSignup function:**

```typescript
// BEFORE (current)
async function completeSignup(chosenIntent: SignupIntent, chips: string[]) {
  // ... sends signupToken, password, name only
}

// AFTER (fixed)
async function completeSignup(chosenIntent: SignupIntent, chips: string[]) {
  const metadata: Record<string, any> = { intent: chosenIntent };
  
  if (chosenIntent === "earn" || chosenIntent === "learn") {
    metadata.selectedTopics = chips;
  } else if (chosenIntent === "business") {
    metadata.businessStage = businessStage;
  } else if (chosenIntent === "invest") {
    metadata.investRange = investRange;
  }
  
  if (country) metadata.country = country;
  
  await dotApi.post("/api/auth/complete-signup", {
    signupToken,
    password,
    name: name.trim(),
    metadata, // ← ADD THIS
  });
}
```

### 2. Add Country to Signup Step 1

**File:** `src/routes/auth.tsx`

**Line ~680 - Add after password field:**

```tsx
<div className="space-y-2">
  <Label htmlFor="su-country">Where are you based?</Label>
  <Select value={country} onValueChange={setCountry}>
    <SelectTrigger id="su-country">
      <SelectValue placeholder="Select country" />
    </SelectTrigger>
    <SelectContent>
      {AFRICAN_COUNTRIES_SHORT.map((c) => (
        <SelectItem key={c} value={c}>{c}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### 3. Create Builder Onboarding Route

**New File:** `src/routes/_authenticated/onboarding/builder.tsx`

```typescript
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dotApi } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding/builder")({
  component: BuilderOnboarding,
});

const SKILL_OPTIONS = [
  "Design", "Development", "Writing", "Marketing", "Sales",
  "Finance", "Video Editing", "Social Media", "Customer Support",
];

function BuilderOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [rate, setRate] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("full-time");
  
  // ... implementation
  
  return (
    <div className="min-h-screen bg-muted/30 p-4">
      {/* 4-step wizard UI */}
    </div>
  );
}
```

### 4. Create Job Posting Page

**New File:** `src/routes/_authenticated/work/post.tsx`

```typescript
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dotApi } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/work/post")({
  component: PostJobPage,
});

function PostJobPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<"job" | "gig">("job");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await dotApi.post("/api/jobs", {
        title,
        description,
        category,
        salaryDot: Number(budget),
        employmentType: type === "job" ? "full-time" : "contract",
        duration,
      });
      toast.success("Job posted!");
      navigate({ to: "/work" });
    } catch (err) {
      toast.error("Failed to post job");
    }
  }
  
  return (
    <AppShell>
      <PageHeader title="Post a Job or Gig" />
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Form fields */}
      </form>
    </AppShell>
  );
}
```

### 5. Fix Mobile Responsiveness - Universal Classes

**File:** `src/components/app/AppShell.tsx`

Add responsive padding:

```typescript
<div className="px-4 sm:px-6 lg:px-8 py-6">
  {children}
</div>
```

**File:** `src/components/app/StatCard.tsx`

Force mobile stack:

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* stat cards */}
</div>
```

---

## Testing Checklist

### Before Marking "Done"

#### Signup Flow
- [ ] Can complete signup with all fields
- [ ] Metadata saves to database
- [ ] Shows on profile page after signup
- [ ] Works on mobile (375px width)
- [ ] Email verification works
- [ ] Password requirements enforced

#### Builder Onboarding
- [ ] Wizard shows after selecting Builder role
- [ ] All 4 steps work
- [ ] Can go back/forward
- [ ] Data saves to builder_profiles table
- [ ] Profile page shows builder info
- [ ] Can skip and complete later

#### Job Posting
- [ ] Can create job posting
- [ ] Can create gig posting
- [ ] Preview works before publish
- [ ] Saves as draft
- [ ] Shows in My Postings tab
- [ ] Shows in Discover → Open Roles
- [ ] Builders can apply

#### Mobile Responsiveness
- [ ] All pages tested on iPhone SE
- [ ] Navigation works (hamburger menu)
- [ ] Forms don't overflow
- [ ] Tables scroll
- [ ] Touch targets 44px min
- [ ] Text readable on small screens

#### Community
- [ ] Channels page accessible
- [ ] Can create post
- [ ] Can reply to posts
- [ ] Emoji reactions work
- [ ] Member directory functional

---

## Summary: What You Need to Do

### This Weekend (8-10 hours)
1. ✅ Fix signup to collect and save all user data (2 hours)
2. ✅ Create builder onboarding wizard (4 hours)
3. ✅ Create job posting page (3 hours)
4. ✅ Quick mobile responsiveness fixes (1 hour)

### Next Week (15-20 hours)
5. ✅ Complete mobile responsive overhaul (6 hours)
6. ✅ Wire up community channels/posts (6 hours)
7. ✅ Make leaderboard prominent (1 hour)
8. ✅ Fix form validation consistency (3 hours)
9. ✅ Improve empty states (2 hours)
10. ✅ Navigation enhancements (2 hours)

### After Launch (Ongoing)
- User feedback incorporation
- A/B testing
- Performance optimization
- Accessibility audit

---

**Bottom Line:** You have a solid foundation, but the user-facing experience feels incomplete. The fixes above will make it feel professional and production-ready.

**Estimated Total Effort:** 25-30 hours to get to launch quality.

Want me to start implementing any of these fixes?
