# DOT OS — DESIGN SYSTEM SPECIFICATION
**Version:** 1.0  
**Date:** 2025-07-04  
**Status:** LIVING — Update with every UI decision

---

## 1. DESIGN PRINCIPLES

| Principle | Rule | Enforcement |
|-----------|------|-------------|
| **Industrial Standard** | Every page matches the category leader (Upwork, Crunchbase, AngelList, YC) | Design review against reference apps |
| **Density with Clarity** | High information density, zero clutter. Tables > cards for data. | Max 2 hero sections per page |
| **Tier-Aware UI** | Free tier sees inline upgrade prompts. Premium sees full power. No dead ends. | Component: `<TierGate tier="founder">` |
| **Real-Time Feel** | Vantage <5s, notifications instant, gig status live, wallet instant. | WebSocket for all mutable state |
| **Mobile-First, Desktop-Powerful** | Mobile = core workflows. Desktop = power tools (tables, multi-panel, shortcuts). | Responsive breakpoints: 640/1024/1440 |
| **Trust Signals Everywhere** | Verification badges, Vantage scores, completion rates, earnings proof. | Component: `<TrustBadge type="kyc|vantage|verified">` |

---

## 2. COLOR SYSTEM (Semantic, Dark-First)

### 2.1 Core Palette
```css
:root {
  /* Brand */
  --color-primary: oklch(0.52 0.18 155);      /* Emerald-600 */
  --color-primary-hover: oklch(0.48 0.18 155);
  --color-primary-light: oklch(0.92 0.08 155);
  
  /* Gold (Founder/Capital) */
  --color-gold: oklch(0.72 0.18 85);          /* Amber-500 */
  --color-gold-light: oklch(0.95 0.12 85);
  
  /* Success */
  --color-success: oklch(0.55 0.15 155);
  --color-success-light: oklch(0.92 0.08 155);
  
  /* Warning */
  --color-warning: oklch(0.75 0.18 75);
  --color-warning-light: oklch(0.96 0.12 75);
  
  /* Destructive */
  --color-destructive: oklch(0.58 0.22 25);
  --color-destructive-light: oklch(0.95 0.08 25);
  
  /* Neutral (Dark Mode Base) */
  --color-bg: oklch(0.12 0 0);                /* Near black */
  --color-bg-elevated: oklch(0.16 0 0);       /* Cards */
  --color-bg-hover: oklch(0.20 0 0);
  --color-border: oklch(0.25 0 0);
  --color-border-strong: oklch(0.32 0 0);
  
  /* Text */
  --color-fg: oklch(0.98 0 0);
  --color-fg-muted: oklch(0.65 0 0);
  --color-fg-subtle: oklch(0.45 0 0);
  
  /* Accent (Contextual) */
  --color-accent-builder: oklch(0.58 0.18 240);   /* Blue */
  --color-accent-founder: oklch(0.72 0.18 85);    /* Gold */
  --color-accent-investor: oklch(0.55 0.18 300);  /* Purple */
  --color-accent-capital: oklch(0.48 0.18 155);   /* Emerald-dark */
}
```

### 2.2 Role-Based Accent Colors
| Role | Accent | Usage |
|------|--------|-------|
| Builder | Blue (`--color-accent-builder`) | `/work`, builder profiles, gig cards |
| Founder | Gold (`--color-accent-founder`) | `/founder`, venture cards, pitchathons |
| Investor | Purple (`--color-accent-investor`) | `/investor`, deal flow, portfolio |
| Capital Partner | Emerald-dark (`--color-accent-capital`) | `/capital`, premium features |
| Admin | Red (`--color-destructive`) | Admin only |

---

## 3. TYPOGRAPHY

### 3.1 Font Stack
```css
--font-display: "Syne", "Inter", system-ui, sans-serif;   /* Headlines, numbers */
--font-body: "Inter", system-ui, sans-serif;              /* Body text */
--font-mono: "JetBrains Mono", "Fira Code", monospace;    /* Numbers, code, DOT amounts */
```

### 3.2 Scale (Fluid, Clamp)
| Token | Mobile | Desktop | Usage |
|-------|--------|---------|-------|
| `--text-display` | clamp(2.5rem, 5vw, 4rem) | clamp(3rem, 4vw, 5rem) | Page titles |
| `--text-h1` | clamp(1.75rem, 3vw, 2.5rem) | clamp(2rem, 3vw, 3rem) | Section headers |
| `--text-h2` | 1.5rem | 1.75rem | Card titles |
| `--text-h3` | 1.125rem | 1.25rem | Sub-sections |
| `--text-base` | 1rem | 1rem | Body |
| `--text-sm` | 0.875rem | 0.875rem | Secondary |
| `--text-xs` | 0.75rem | 0.75rem | Labels, badges |
| `--text-tabular` | 1rem | 1rem | Numbers (mono) |

### 3.3 Weight System
| Token | Weight | Usage |
|-------|--------|-------|
| `--font-light` | 300 | Display, large numbers |
| `--font-normal` | 400 | Body |
| `--font-medium` | 500 | Emphasis, labels |
| `--font-semibold` | 600 | Buttons, strong |
| `--font-bold` | 700 | Headers, critical numbers |

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale (4px base)
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight |
| `--space-2` | 8px | Base |
| `--space-3` | 12px | Comfortable |
| `--space-4` | 16px | Section |
| `--space-5` | 20px | Generous |
| `--space-6` | 24px | Section gap |
| `--space-8` | 32px | Major section |
| `--space-10` | 40px | Page padding |
| `--space-12` | 48px | Hero |

### 4.2 Container Widths
| Token | Value | Usage |
|-------|-------|-------|
| `--container-sm` | 640px | Forms, modals |
| `--container-md` | 896px | Content pages |
| `--container-lg` | 1152px | Dashboards |
| `--container-xl` | 1408px | Wide tables |
| `--container-full` | 100% | Full-bleed |

### 4.3 Grid System
```css
/* 12-col grid, 24px gap desktop, 16px mobile */
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--space-4); }
@media (min-width: 1024px) { .grid { gap: var(--space-6); } }
.col-span-full { grid-column: 1 / -1; }
.col-span-6 { grid-column: span 6; }
.col-span-4 { grid-column: span 4; }
.col-span-3 { grid-column: span 3; }
```

---

## 5. COMPONENT SPECIFICATIONS

### 5.1 Buttons
```tsx
// Variants
<Button variant="hero" />      // Primary action - primary bg, white text
<Button variant="primary" />   // Secondary primary - primary bg, white text
<Button variant="secondary" /> // Outline - border, primary text
<Button variant="ghost" />     // No border, primary text
<Button variant="destructive" /> // Red bg, white text
<Button variant="tier-locked" /> // Gray, shows upgrade tooltip

// Sizes
<Button size="sm" />   // h-8, px-3, text-xs
<Button size="md" />   // h-10, px-4, text-sm (default)
<Button size="lg" />   // h-12, px-6, text-base
<Button size="icon" /> // h-10, w-10, icon only
```

### 5.2 Cards
```tsx
<Card variant="default" />      // bg-elevated, border, shadow-sm
<Card variant="elevated" />     // bg-elevated, border, shadow-md
<Card variant="interactive" />  // hover: border-primary/40, shadow-lg
<Card variant="tier-locked" />  // opacity-60, overlay upgrade CTA
```

### 5.3 Badges (Trust Signals)
```tsx
<Badge variant="verified" />        // Green, check icon - KYC/Verified
<Badge variant="vantage-tier" />    // Gold, tier label (Assess→Scale)
<Badge variant="role" />            // Role-colored - Builder/Founder/Investor
<Badge variant="status" />          // Semantic - pending/active/completed
<Badge variant="premium" />         // Gold star - paid feature
```

### 5.4 Tables (Data Dense)
```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Venture', render: LinkCell },
    { key: 'stage', header: 'Stage', render: BadgeCell },
    { key: 'vantage', header: 'Vantage', type: 'number', className: 'tabular' },
    { key: 'fundability', header: 'Fundability %', type: 'number' },
    { key: 'actions', header: '', render: ActionMenu }
  ]}
  sortable
  filterable
  paginated
  exportable
  rowSelection
  density="comfortable" // compact | comfortable | spacious
/>
```

### 5.5 Forms (Multi-Step Wizards)
```tsx
<FormWizard
  steps={[
    { id: 'basics', title: 'Basics', fields: [...] },
    { id: 'media', title: 'Media', fields: [...] },
    { id: 'team', title: 'Team', fields: [...] },
    { id: 'review', title: 'Review', fields: [] }
  ]}
  onComplete={handleSubmit}
  saveDraft={true}
  progressPosition="top"
/>
```

### 5.6 Media Components
```tsx
<VideoPlayer src={url} poster={thumbnail} title={title} />
<PDFViewer src={url} title={title} toolbar={['download', 'print', 'fullscreen']} />
<ImageGallery images={[{url, alt}]} />
<AudioPlayer src={url} title={title} />
```

---

## 6. PAGE-LEVEL REDESIGN TARGETS

### 6.1 `/work` — Upwork Standard
| Section | Current | Target |
|---------|---------|--------|
| Job Feed | Basic list | Filterable table: keyword, category, budget, duration, client rating |
| Proposals | Empty tab | Kanban: Draft → Sent → Interview → Hired |
| Contracts | Empty tab | Active contracts: milestones, payments, deliverables, messages |
| Earnings | Empty tab | Chart: weekly/monthly/yearly, tax export, invoice generator |
| Profile | Basic | Skills, hourly rate, portfolio, reviews, availability calendar |

### 6.2 `/vantage` — Crunchbase Standard
| Section | Current | Target |
|---------|---------|--------|
| Assessment | 21 questions | Structured: 6 categories, mixed inputs (slider, number, select, text) |
| Score Display | Radial gauge | Radial + breakdown: 5 pillars, benchmarks, percentile |
| Investor Memo | None | One-click PDF export: traction, team, market, cap table, risks |
| History | Basic chart | Timeline: score trajectory, category deltas, milestone markers |
| Benchmarks | None | Peer comparison: industry, stage, country, Africa-wide |

### 6.3 `/pitchathons` — AngelList Demo Day Standard
| Section | Current | Target |
|---------|---------|--------|
| Event List | Basic cards | Seasonal: countdown timer, judges, prize pool, sponsor logos |
| Live Pitch | None | YouTube embed + live chat + real-time voting + judge scores |
| Venture Cards | Basic | Problem/Solution/Traction/Team/Ask in scannable format |
| Commit Flow | None | Click to commit → wire instructions → cap table update |
| Results | None | Leaderboard + video replay + investor updates |

### 6.4 `/academy` — YC Standard
| Section | Current | Target |
|---------|---------|--------|
| Catalog | Basic grid | Curriculum map: tracks (Founder, Builder, Investor), prerequisites |
| Course Page | Basic | Syllabus, instructor bio, reviews, progress, certificate preview |
| Cohort/Sessions | Basic | Calendar, RSVP, attendance, office hours, recordings |
| Certificates | Basic | Verifiable, Vantage boost shown, shareable (LinkedIn, PDF) |
| Alumni | None | Network: filter by track, cohort, location, current role |

### 6.5 `/founder/:id` — Company Intelligence Page
| Section | Current | Target |
|---------|---------|--------|
| Header | Name, avatar | Logo, name, tagline, stage, Vantage score, verification badges |
| Traction | None | MRR, users, growth%, retention%, burn, runway (editable) |
| Team | Basic | Founders + key hires: role, LinkedIn, equity %, history |
| Raises | None | Timeline: round, date, amount, valuation, investors |
| Deck/Video | URL only | Embedded PDF viewer + video player + download tracking |
| Comments | Feed only | Threaded: VP comments, founder replies, upvotes |
| Followers | None | Count + list (investors, builders, peers) |

### 6.6 `/demo/:id` — Data Room
| Section | Current | Target |
|---------|---------|--------|
| Deal Terms | None | Valuation, share price, min/max investment, security type |
| Cap Table | None | Interactive: shareholders, %, dilution calculator |
| Share Purchase | None | Click → amount → wire details → e-sign → cap table update |
| Investor Updates | None | Founder posts: monthly/quarterly, metrics, asks |
| Documents | None | Data room: legal, financial, IP, technical (permissioned) |

### 6.7 `/wallet` — Multi-Ledger Financial Dashboard
| Section | Current | Target |
|---------|---------|--------|
| Balance | Single number | Four columns: Available / Staked / Locked / Lifetime Earned |
| Staking | None | Stake on ventures, unstake, slash history, rewards |
| Escrow | None | Active escrows: gig, amount, status, release/dispute |
| Transactions | Basic list | Filterable table: type, amount, status, counterparty, export CSV |
| Redemption | None | Capped cash-out: amount, rate, reserve coverage, audit link |

### 6.8 `/leaderboard` — 7-Tab Competitive Intelligence
| Tab | Metric | Target |
|-----|--------|--------|
| Ventures | Community Score / DOT Allocated / VP Count | Sortable, filterable by industry/stage/country |
| Founders | Vantage / Ventures Funded / Capital Raised | Profile link, tier badge |
| Builders | DOT Earned / Contracts Completed / Rating | Profile link, Verified badge |
| Communities | Members / Challenges / DOT Distributed | Join button, tier |
| Universities | Ventures / Founders / Vantage Avg | Leaderboard + alumni |
| States/Countries | Ventures / Capital / Talent | Geographic heatmap |
| Venture Partners | Reviews / Accuracy / DOT Allocated | Profile, badges |

---

## 7. RESPONSIVE BREAKPOINTS & BEHAVIOR

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single col, stacked cards, bottom nav, swipe gestures |
| Tablet | 640-1023px | 2-col grid, collapsible sidebar, touch-friendly |
| Desktop | 1024-1439px | Full layout, sidebar persistent, keyboard shortcuts |
| Wide | ≥ 1440px | 3-col grids, expanded tables, multi-panel |

### Mobile-First Rules
- Touch targets ≥ 44x44px
- No hover-only actions
- Bottom sheet modals (not centered)
- Swipe-to-delete/archive on lists
- Pull-to-refresh on feeds
- Bottom navigation (5 tabs max)

---

## 8. ACCESSIBILITY (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | ≥ 4.5:1 text, ≥ 3:1 UI elements |
| Focus visible | `focus-visible` ring on all interactive |
| Keyboard nav | Tab order logical, skip links, escape closes modals |
| Screen readers | ARIA labels, live regions for toasts, table headers |
| Motion | `prefers-reduced-motion` respected |
| Text scaling | Supports 200% zoom, no horizontal scroll |

---

## 9. ANIMATION & MICRO-INTERACTIONS

| Interaction | Duration | Easing | Purpose |
|-------------|----------|--------|---------|
| Page transition | 150ms | ease-out | Perceived speed |
| Card hover | 100ms | ease-out | Affordance |
| Button press | 50ms | ease-out | Feedback |
| Toast enter | 200ms | ease-out | Attention |
| Skeleton shimmer | 1.5s | linear | Loading state |
| Number count-up | 800ms | ease-out | Data delight |
| Tab switch | 100ms | ease-out | Orientation |

---

## 10. DARK MODE (Default) + LIGHT MODE SUPPORT

```css
/* Dark mode first (default) */
:root { /* dark tokens */ }

/* Light mode via class */
.light {
  --color-bg: oklch(0.98 0 0);
  --color-bg-elevated: oklch(1 0 0);
  --color-bg-hover: oklch(0.95 0 0);
  --color-border: oklch(0.88 0 0);
  --color-border-strong: oklch(0.82 0 0);
  --color-fg: oklch(0.15 0 0);
  --color-fg-muted: oklch(0.45 0 0);
  --color-fg-subtle: oklch(0.65 0 0);
}
```

---

## 11. IMPLEMENTATION ORDER

| Phase | Components | Files |
|-------|------------|-------|
| 1 | Design tokens (CSS vars), Button, Badge, Card, Input | `src/styles/tokens.css`, `src/components/ui/*` |
| 2 | Table, Card, FormWizard, Media | `src/components/ui/table.tsx`, `src/components/ui/form-wizard.tsx` |
| 3 | Page layouts: Work, Vantage, Academy, Pitchathons | `src/routes/_authenticated/work.tsx`, etc. |
| 4 | Mobile audit, PWA manifest, offline support | `public/manifest.json`, `src/hooks/use-online.ts` |
| 5 | Performance: RUM, lazy loading, code splitting | `src/lib/analytics.ts`, `vite.config.ts` |

---

**This spec is the UI contract.** Every component, page, and interaction is measured against this. Design reviews = spec compliance checks.