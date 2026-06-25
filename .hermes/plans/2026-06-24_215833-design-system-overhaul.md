# DOT Design System Overhaul — Implementation Plan

> **STATUS (Jun 25 2026):** ✅ ALL 7 PHASES + 3 BONUS ANGLES COMPLETE. 16 commits on `design-system-overhaul`. Build passes (54s, 293 files changed, 13K insertions, 86K deletions of dead code).

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Each task ends with a commit.

**Goal:** Overhaul the visual design of the DOT landing page, design system tokens, shared app shell, and the entire authenticated app surface — bringing it into alignment with a "dark by default + green-accent editorial" brand.

**Architecture:** Token-first approach. Update the design tokens in `src/styles.css` first (single source of truth), then propagate changes through Tailwind utilities, then update the actual screens. AppShell is the spine; per-route content hangs off it. Light theme is rebuilt from scratch (not inverted dark).

**Tech Stack:** TanStack Start 1.167, React 19, Vite 8, Tailwind CSS 4 (CSS-first config via `@theme inline`), shadcn/ui, OKLCH color tokens.

**Execution Mode (locked Jun 24 2026):** Phase 1 (tokens) is a CHECKPOINT. After Phase 1 commits, pause for user preview of dark + light theme on live site before cascading into Phase 2+. Don't auto-execute the whole plan.

---

## Locked Design Decisions (don't relitigate)

- **Palette direction:** Option B — editorial neutrals + green accent. Green appears on CTAs and brand moments only, ~4–5 times per page maximum. Fallback to Option A (green primary + gold secondary) if Option B doesn't land visually.
- **Theme default:** dark, with `prefers-color-scheme` respected. Light is a designed alternative, not a fallback.
- **Dark background:** `#0A1410` (green-tinted near-black). NOT `#000808` (current — too dead).
- **Dark section panels:**
  - Default: `#0A1410`
  - Deep-forest: `#032110`
  - Sage-tinted: `#1A2618`
  - Sand-tinted: `#1F1B14`
- **Light background:** `#F7F2E3` (warm cream, existing).
- **Light section panels:**
  - Default: `#F7F2E3`
  - Sand: `#E7D4BB`
  - Sage: `#BDD6B8` (used sparingly)
  - Cream-light: `#FBF8EE`
- **Hex tokens (canonical):**
  - Primary green: `#59A174` (dark) / `#0A4627` (light)
  - Gold: `#D3A563`
  - Terracotta: `#CD725C`
  - Teal: `#008479`
  - Purple: `#6365C1`
  - Sage: `#BDD6B8`
  - Moss: `#3E8343`
  - Sand: `#E7D4BB`
  - Cream: `#F7F2E3`
- **Dead-duplicate tokens to fix in `src/styles.css`:**
  - `--forest` is identical to `--primary` (light) — replace with proper forest variant
  - `--cream` is identical to `--background` (light) — replace with lighter cream surface
  - `--ink` is identical to `--background` (dark) — replace with proper ink for body text on light surfaces

---

## Phase 0 — Safety & Setup (BEFORE any code change)

### Task 0.1: Verify a non-OneDrive working copy exists (LIVE FOLDER, with safeguards)

**Decision (Jun 24 2026):** Work in the LIVE folder `C:\Users\GTHub\OneDrive\Desktop\dotlive-main\`. Tracked copy at `dotlive-main-tracked\dotlive-main\` is 67 hours stale and missing 7 migrations. Worth more risk to OneDrive corruption than worth the time to sync.

**Anti-OneDrive safeguards (mandatory for every edit):**
1. **Atomic writes only** — use `write_file` (not `echo > file` in terminal), it writes to a temp file then renames atomically.
2. **Verify after every save** — `read_file` immediately after `write_file` to confirm the file is whole.
3. **If a save looks corrupt** (truncated, missing chars, garbled) — `git checkout -- file.tsx` and retry. Never trust a write you haven't read back.
4. **Commit frequently** — minimum after every task, ideally mid-task for big files. `git status` between phases.
5. **`.gitignore` already exists** — but verify node_modules, .output, dist are ignored so OneDrive doesn't try to sync multi-GB folders.

**Files:**
- Read: `.gitignore` (project root)
- Read: `package.json` (verify dev/build scripts work)
- Check: `git status` is clean

**Step 1:** Verify `.gitignore` excludes the heavy folders:
```bash
cd "/c/Users/GTHub/OneDrive/Desktop/dotlive-main"
cat .gitignore
```
Expected to see: `node_modules`, `.output`, `dist`, `.vercel`, `.wrangler`, `.tanstack`. If any are missing, add them.

**Step 2:** Confirm git is healthy and on the right branch:
```bash
git status
git log -3 --oneline
git branch --show-current
```
Expected: clean working tree, on `main` (Lovable's connected branch), recent commits.

**Step 3:** Create the redesign branch:
```bash
git checkout -b design-system-overhaul
```

**Step 4:** Smoke-test the dev server boots (no code changes yet):
```bash
npm run build
```
Expected: build succeeds. (Skip `npm run dev` for now — it blocks; we'll boot it in Phase 7.)

**Step 5:** Initial commit (empty diff but marks the branch):
```bash
git commit --allow-empty -m "chore: branch design-system-overhaul started"
```

**Verification:** Branch exists, working tree clean, build passes, anti-OneDrive habits documented for this session.

---

## Phase 1 — Design System Tokens (the foundation)

> **Why this phase first:** Every component reads from these tokens. Fixing them in one place cascades. If you skip this and edit components directly, you'll do the same work N times.

### Task 1.1: Audit existing tokens and document the diff

**Files:**
- Read: `src/styles.css` (entire file)
- Read: `src/components/theme/ThemeToggle.tsx`
- Read: `tailwind.config.*` if exists, else confirm Tailwind 4 uses `@theme` in CSS only

**Step 1:** Read `src/styles.css` end-to-end and list every `--token` defined in both `:root` and `.dark`.

**Step 2:** Run a grep across `src/` for every token name to map current usage:
```bash
cd "/c/Users/GTHub/OneDrive/Desktop/dotlive-main"
grep -rn "bg-primary\|text-primary\|border-primary\|bg-card\|bg-background\|bg-muted\|bg-accent\|bg-secondary\|bg-gold\|bg-teal\|bg-purple\|bg-sage\|bg-forest\|bg-moss\|bg-cream\|bg-sand\|bg-terracotta\|bg-ink" src/ --include="*.tsx" --include="*.ts" -l
```

**Step 3:** Write a token migration map to `.hermes/plans/token-migration.md`:
- Current token → New token (or unchanged)
- For each: which components use it
- For dead duplicates: what it should become

**Step 4:** Commit the audit (no code change yet, just the doc):
```bash
git add .hermes/plans/token-migration.md
git commit -m "docs(audit): design token migration map for overhaul"
```

**Verification:** `token-migration.md` exists with a complete table covering every `--*` token in `styles.css`.

---

### Task 1.2: Rewrite `:root` (light theme) tokens

**Files:**
- Modify: `src/styles.css` — `:root` block (light mode tokens)
- Test: visual — load `/` in browser, light theme should show warm cream + sage + ink, NOT just inverted dark

**Step 1:** Replace the `:root` block with:
```css
:root {
  --radius: 0.75rem;

  /* Surfaces (warm cream editorial paper) */
  --background: oklch(0.96 0.02 90);       /* #F7F2E3 cream */
  --foreground: oklch(0.18 0.02 200);      /* near-ink for body text */

  --card: oklch(0.98 0.01 90);             /* #FBF8EE cream-light, lifted */
  --card-foreground: oklch(0.18 0.02 200);

  --popover: oklch(0.98 0.01 90);
  --popover-foreground: oklch(0.18 0.02 200);

  /* Brand: deep forest green */
  --primary: oklch(0.35 0.08 155);         /* #0A4627 */
  --primary-foreground: oklch(0.98 0.01 155);
  --primary-glow: oklch(0.55 0.12 155);    /* #258651 */

  /* Secondary = sand surface (NOT another color, a panel) */
  --secondary: oklch(0.88 0.04 75);        /* #E7D4BB sand */
  --secondary-foreground: oklch(0.20 0.02 200);

  --muted: oklch(0.92 0.02 90);
  --muted-foreground: oklch(0.45 0.02 200);

  --accent: oklch(0.85 0.05 140);          /* #BDD6B8 sage */
  --accent-foreground: oklch(0.20 0.04 155);

  /* Editorial accents — used SPARINGLY */
  --gold: oklch(0.75 0.10 75);             /* #D3A563 */
  --gold-foreground: oklch(0.15 0.05 75);

  --teal: oklch(0.55 0.10 185);            /* #008479 */
  --teal-foreground: oklch(0.98 0.01 185);

  --purple: oklch(0.55 0.14 280);          /* #6365C1 */
  --purple-foreground: oklch(0.98 0.01 280);

  --terracotta: oklch(0.65 0.12 35);       /* #CD725C */
  --terracotta-foreground: oklch(0.98 0.01 35);

  /* Semantic */
  --success: oklch(0.50 0.13 150);
  --success-foreground: oklch(0.98 0.01 150);
  --destructive: oklch(0.55 0.20 25);
  --destructive-foreground: oklch(0.98 0.01 25);
  --info: oklch(0.52 0.12 240);
  --info-foreground: oklch(0.98 0.01 240);
  --warning: oklch(0.70 0.14 55);
  --warning-foreground: oklch(0.15 0.04 55);

  /* Borders — warm hairline */
  --border: oklch(0.82 0.02 90);
  --input: oklch(0.92 0.02 90);
  --ring: oklch(0.35 0.08 155);

  /* Charts */
  --chart-1: oklch(0.35 0.08 155);   /* primary green */
  --chart-2: oklch(0.75 0.10 75);    /* gold */
  --chart-3: oklch(0.55 0.10 185);   /* teal */
  --chart-4: oklch(0.65 0.12 35);    /* terracotta */
  --chart-5: oklch(0.55 0.14 280);   /* purple */

  /* Sidebar — sand surface */
  --sidebar: oklch(0.95 0.02 90);
  --sidebar-foreground: oklch(0.20 0.02 200);
  --sidebar-primary: oklch(0.35 0.08 155);
  --sidebar-primary-foreground: oklch(0.98 0.01 155);
  --sidebar-accent: oklch(0.85 0.05 140);
  --sidebar-accent-foreground: oklch(0.20 0.04 155);
  --sidebar-border: oklch(0.82 0.02 90);
  --sidebar-ring: oklch(0.35 0.08 155);

  /* Editorial palette — proper distinct values, no more dead duplicates */
  --sage:                 oklch(0.85 0.05 140);
  --sage-foreground:      oklch(0.18 0.04 155);
  --forest:               oklch(0.28 0.10 155);   /* darker than primary, was duplicate */
  --forest-foreground:    oklch(0.98 0.01 155);
  --moss:                 oklch(0.55 0.12 145);
  --moss-foreground:      oklch(0.98 0.01 145);
  --cream:                oklch(0.98 0.01 90);    /* lighter than bg, was duplicate */
  --cream-foreground:     oklch(0.18 0.02 200);
  --sand:                 oklch(0.88 0.04 75);
  --sand-foreground:      oklch(0.18 0.04 75);
  --terracotta:           oklch(0.65 0.12 35);
  --terracotta-foreground: oklch(0.98 0.01 35);
  --ink:                  oklch(0.18 0.02 200);   /* distinct from --bg-dark */
  --ink-foreground:       oklch(0.96 0.02 90);
  --slate-editorial:      oklch(0.45 0.03 220);
  --slate-editorial-foreground: oklch(0.96 0.01 220);

  /* Gradients */
  --gradient-hero:    linear-gradient(135deg, oklch(0.35 0.08 155) 0%, oklch(0.50 0.10 155) 50%, oklch(0.75 0.10 75) 100%);
  --gradient-primary: linear-gradient(135deg, oklch(0.30 0.08 157), oklch(0.48 0.10 158));
  --gradient-gold:    linear-gradient(135deg, oklch(0.75 0.10 75), oklch(0.68 0.12 55));
  --gradient-surface: linear-gradient(180deg, oklch(0.98 0.01 90), oklch(0.94 0.02 90));

  /* Shadows — warm tinted */
  --shadow-sm:   0 1px 3px oklch(0.30 0.04 75 / 0.10), 0 1px 2px oklch(0.30 0.04 75 / 0.06);
  --shadow-md:   0 4px 16px -4px oklch(0.35 0.06 75 / 0.18), 0 2px 6px -2px oklch(0.30 0.04 75 / 0.10);
  --shadow-lg:   0 20px 50px -16px oklch(0.35 0.08 75 / 0.28), 0 8px 20px -8px oklch(0.30 0.04 75 / 0.14);
  --shadow-glow: 0 0 0 1px oklch(0.55 0.16 155 / 0.18), 0 0 32px -4px oklch(0.55 0.16 155 / 0.45);

  /* Spacing scale (unchanged) */
  --space-1:  0.5rem;
  --space-2:  1rem;
  --space-3:  1.5rem;
  --space-4:  2rem;
  --space-6:  3rem;
  --space-8:  4rem;
  --space-12: 6rem;
}
```

**Step 2:** Build and visually verify light theme still loads:
```bash
npm run build
```
Expected: no errors. Open `/` in browser, toggle to light, confirm:
- Background is warm cream `#F7F2E3`, not white
- Body text is `#2D2D2D`-ish (ink, not pure black)
- Borders are warm hairlines, not grey
- Primary green is `#0A4627` (deep forest)

**Step 3:** Commit:
```bash
git add src/styles.css
git commit -m "feat(tokens): rewrite light theme as editorial cream paper"
```

**Verification:** Light theme renders warm + readable. No white surfaces, no grey borders.

---

### Task 1.3: Rewrite `.dark` tokens (the dark theme — primary surface)

**Files:**
- Modify: `src/styles.css` — `.dark` block
- Test: visual — load `/` in browser with `prefers-color-scheme: dark` (or default-toggle), confirm warm-green-tinted near-black, NOT cold `#000808`

**Step 1:** Replace the `.dark` block with:
```css
.dark {
  /* Surfaces — warm green-tinted near-black, NOT cold #000808 */
  --background: oklch(0.16 0.02 155);       /* #0A1410 — slight green tint */
  --foreground: oklch(0.94 0.02 90);

  --card: oklch(0.20 0.02 155);             /* #0F1812 — lifted from bg */
  --card-foreground: oklch(0.94 0.02 90);

  --popover: oklch(0.18 0.02 155);
  --popover-foreground: oklch(0.94 0.02 90);

  /* Brand: brighter forest green for dark */
  --primary: oklch(0.65 0.10 155);          /* #59A174 */
  --primary-foreground: oklch(0.10 0.02 155);
  --primary-glow: oklch(0.75 0.12 158);

  /* Secondary = deep-forest panel */
  --secondary: oklch(0.22 0.04 155);        /* #032110 deep-forest */
  --secondary-foreground: oklch(0.90 0.02 90);

  --muted: oklch(0.22 0.02 155);
  --muted-foreground: oklch(0.65 0.04 140);

  /* Accent = sage-tinted panel */
  --accent: oklch(0.28 0.04 145);           /* #1A2618 */
  --accent-foreground: oklch(0.88 0.04 140);

  /* Editorial accents — boosted for dark visibility */
  --gold: oklch(0.78 0.11 78);
  --gold-foreground: oklch(0.14 0.04 70);

  --teal: oklch(0.68 0.11 182);
  --teal-foreground: oklch(0.12 0.02 182);

  --purple: oklch(0.70 0.16 278);
  --purple-foreground: oklch(0.12 0.02 278);

  --terracotta: oklch(0.68 0.13 35);
  --terracotta-foreground: oklch(0.14 0.02 35);

  /* Semantic */
  --success: oklch(0.68 0.14 152);
  --success-foreground: oklch(0.12 0.02 152);
  --destructive: oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.96 0.01 25);
  --info: oklch(0.65 0.13 237);
  --info-foreground: oklch(0.12 0.02 237);
  --warning: oklch(0.78 0.14 58);
  --warning-foreground: oklch(0.14 0.04 50);

  --border: oklch(1 0 0 / 8%);
  --input: oklch(1 0 0 / 12%);
  --ring: oklch(0.65 0.10 155);

  --chart-1: oklch(0.65 0.10 155);
  --chart-2: oklch(0.78 0.11 78);
  --chart-3: oklch(0.68 0.11 182);
  --chart-4: oklch(0.68 0.13 35);
  --chart-5: oklch(0.70 0.16 278);

  /* Sidebar — deep-forest surface */
  --sidebar: oklch(0.13 0.02 155);
  --sidebar-foreground: oklch(0.90 0.02 90);
  --sidebar-primary: oklch(0.65 0.10 155);
  --sidebar-primary-foreground: oklch(0.10 0.02 155);
  --sidebar-accent: oklch(0.22 0.04 155);
  --sidebar-accent-foreground: oklch(0.88 0.04 140);
  --sidebar-border: oklch(1 0 0 / 8%);
  --sidebar-ring: oklch(0.65 0.10 155);

  /* Editorial palette — distinct dark variants */
  --sage:                 oklch(0.30 0.04 140);
  --sage-foreground:      oklch(0.88 0.04 140);
  --forest:               oklch(0.18 0.06 155);
  --forest-foreground:    oklch(0.94 0.02 155);
  --moss:                 oklch(0.62 0.13 145);
  --moss-foreground:      oklch(0.96 0.01 145);
  --cream:                oklch(0.92 0.02 90);
  --cream-foreground:     oklch(0.18 0.02 200);
  --sand:                 oklch(0.78 0.05 75);
  --sand-foreground:      oklch(0.18 0.04 75);
  --terracotta:           oklch(0.68 0.13 35);
  --terracotta-foreground: oklch(0.14 0.02 35);
  --ink:                  oklch(0.96 0.01 90);     /* distinct from --bg-dark */
  --ink-foreground:       oklch(0.16 0.02 155);
  --slate-editorial:      oklch(0.62 0.04 220);
  --slate-editorial-foreground: oklch(0.94 0.01 220);

  /* Gradients */
  --gradient-hero:    linear-gradient(135deg, oklch(0.65 0.10 155) 0%, oklch(0.72 0.12 158) 50%, oklch(0.78 0.11 78) 100%);
  --gradient-primary: linear-gradient(135deg, oklch(0.55 0.10 157), oklch(0.72 0.12 158));
  --gradient-gold:    linear-gradient(135deg, oklch(0.78 0.11 78), oklch(0.72 0.14 55));
  --gradient-surface: linear-gradient(180deg, oklch(0.18 0.02 155), oklch(0.14 0.02 155));

  /* Shadows */
  --shadow-sm:   0 1px 3px oklch(0 0 0 / 0.30), 0 1px 2px oklch(0 0 0 / 0.22);
  --shadow-md:   0 4px 16px -4px oklch(0 0 0 / 0.50), 0 2px 6px -2px oklch(0 0 0 / 0.32);
  --shadow-lg:   0 20px 50px -16px oklch(0 0 0 / 0.60), 0 8px 20px -8px oklch(0 0 0 / 0.38);
  --shadow-glow: 0 0 0 1px oklch(0.72 0.16 158 / 0.22), 0 0 32px -4px oklch(0.72 0.16 158 / 0.40);

  --space-1:  0.5rem;
  --space-2:  1rem;
  --space-3:  1.5rem;
  --space-4:  2rem;
  --space-6:  3rem;
  --space-8:  4rem;
  --space-12: 6rem;
}
```

**Step 2:** Build and verify dark theme renders warm-tinted, not cold:
```bash
npm run build
```
Open `/` with `prefers-color-scheme: dark` (or toggle). Confirm:
- Background `#0A1410`, not `#000808`
- Subtle warmth from green tint
- Borders are subtle, not grey
- Primary green `#59A174` reads as the brand voice, not the only voice

**Step 3:** Commit:
```bash
git add src/styles.css
git commit -m "feat(tokens): rewrite dark theme with green-tinted near-black"
```

**Verification:** Dark theme feels warm, not void-like.

---

### Task 1.4: Default theme to dark + respect prefers-color-scheme

**Files:**
- Modify: `src/components/theme/ThemeToggle.tsx`
- Modify: `src/contexts/DotAuthContext.tsx` if it sets initial theme
- Search: `<html className=` references in `index.html` and `__root.tsx`

**Step 1:** Read `src/components/theme/ThemeToggle.tsx` to understand current default behavior.

**Step 2:** Update so that:
- On first load: respect `prefers-color-scheme: dark` (default to dark)
- The toggle still works manually
- localStorage persists user choice

**Step 3:** If there's a script-injected theme class in `index.html` or `__root.tsx`, make sure it sets `.dark` BEFORE first paint to avoid flash of light theme.

**Step 4:** Build and verify:
```bash
npm run build && npm run dev
```
- Open in browser with system in dark mode → see dark theme immediately, no flash
- Toggle to light → switches, persists on reload
- Toggle to dark → switches, persists on reload

**Step 5:** Commit:
```bash
git add src/components/theme/ThemeToggle.tsx
git commit -m "feat(theme): default to dark, respect prefers-color-scheme"
```

**Verification:** First paint shows dark theme when system is dark. No flash of light theme.

---

## Phase 2 — Landing Page (`src/routes/index.tsx`)

> **Why Phase 2 second:** The landing page is what the client sees first. After Phase 1, the tokens are right, so all sections will benefit from the new palette. Now we shape the actual landing.

### Task 2.1: Replace fake testimonials with honest content

**Files:**
- Modify: `src/routes/index.tsx` — `testimonials` array (lines ~118-145) and `TestimonialsSection` (lines ~570-600)
- Add: a new honest section that promotes the app's actual aim

**Step 1:** Delete the 3 fabricated testimonials (Amara, Kwame, Fatima). Remove the `testimonials` array and the `TestimonialsSection` function entirely.

**Step 2:** Replace with a new section titled "What DOT actually is" or "The product, honestly":
```tsx
function HonestAimSection() {
  return (
    <section className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">06</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">What we are building</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">A measurable path for African founders</h2>
          </div>
        </div>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-light text-primary">Venture intelligence</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Vantage measures your venture across quality, founder readiness,
              market strength, and fundability. A real number investors can compare.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-light text-primary">Earned, not given</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Founders start with 500 DOT. Earn more by completing gigs, finishing
              Academy courses, contributing to communities. The wallet grows with the work.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-light text-primary">One progression</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              From idea to funded, measured in seven stages. No shortcuts, just progress.
              Every member follows the same path so investors and community leaders speak the same language.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 3:** In `LandingPage()`, replace `<TestimonialsSection />` with `<HonestAimSection />`.

**Step 4:** Update section numbering: "By the numbers" stays as `05` (Traction), "What we are building" becomes `06` (Aim), "Built for the whole network" becomes `07` (Network). Final CTA stays as `08`.

**Step 5:** Build and verify:
```bash
npm run build
```
Open `/` in browser, scroll to the new section. Confirm:
- Section heading reads "A measurable path for African founders"
- 3 honest columns explain the product aim
- No fake names, no fake quotes

**Step 6:** Commit:
```bash
git add src/routes/index.tsx
git commit -m "feat(landing): replace fake testimonials with honest product aim"
```

**Verification:** No fabricated names. Section promotes the actual app, not fake social proof.

---

### Task 2.2: Hero background — layered editorial instead of dead flat

**Files:**
- Modify: `src/routes/index.tsx` — `HeroSection` (lines ~270-340)
- Modify: `src/assets/hero-dot.jpg` — keep but improve its presentation
- Add: a subtle SVG noise/grain overlay (inline SVG or CSS pattern)

**Step 1:** Update `HeroSection` background. Current:
```tsx
<div className="absolute inset-0 -z-10 pointer-events-none">
  <img src={heroImg} alt="" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 dark:opacity-5" />
  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
</div>
```
At 5–10% opacity in dark mode, the image is essentially invisible. Fix: replace with layered backgrounds.

**Step 2:** New hero background:
```tsx
{/* Layered editorial background */}
<div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
  {/* Layer 1: subtle radial bloom in primary glow, top-right */}
  <div className="absolute -right-1/4 -top-1/4 h-[60rem] w-[60rem] rounded-full bg-primary/8 blur-3xl" />
  <div className="absolute -left-1/4 bottom-0 h-[40rem] w-[40rem] rounded-full bg-sage/5 blur-3xl" />

  {/* Layer 2: grid overlay */}
  <div className="absolute inset-0 bg-grid opacity-50" />

  {/* Layer 3: hero image, faint and only on the right side */}
  <img
    src={heroImg}
    alt=""
    className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 dark:opacity-15 mix-blend-luminosity"
  />

  {/* Layer 4: edge gradient to anchor text legibility */}
  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
</div>
```

**Step 3:** Build and verify. Hero should now have:
- Visible green-tinted radial bloom in top-right
- Subtle grid texture across the section
- Hero image now reads as silhouette, not invisible
- Text remains legible on the left

**Step 4:** Commit:
```bash
git add src/routes/index.tsx
git commit -m "feat(hero): layered editorial background with grid + radial bloom"
```

**Verification:** Hero no longer feels like a wall of text on flat dark.

---

### Task 2.3: Section backgrounds — alternating editorial panels

**Files:**
- Modify: `src/routes/index.tsx` — `ByTheNumbersSection`, `PillarsSection`, `AudiencesSection`

**Why:** Right now every section uses `bg-background` or `bg-card/30` interchangeably. Need to alternate between:
- Default (ink/cream)
- Deep-forest panel (dark) / sand panel (light)
- Sage-tinted panel (dark) / cream-light (light)
- Sand-tinted panel (dark) / sand (light)

**Step 1:** Update `ByTheNumbersSection` to use a `bg-secondary` panel (sand-tinted in dark, sand in light):
```tsx
<section className="border-t border-border bg-secondary">
```
Borders and stat colors stay. The panel makes it feel like a deliberate "moment" rather than another flat section.

**Step 2:** Update `PillarsSection` to use a `bg-accent` panel (sage-tinted in dark, sage in light).

**Step 3:** Update `AudiencesSection` to use a `bg-secondary` panel.

**Step 4:** Keep the existing full-primary "Pilot Stats" section as the one section that breaks the pattern (intentional).

**Step 5:** Build and verify section transitions feel like a journey, not a wall.

**Step 6:** Commit:
```bash
git add src/routes/index.tsx
git commit -m "feat(landing): alternate section panels across editorial palette"
```

**Verification:** Scrolling the page feels like moving through rooms with different moods, not through one flat hallway.

---

### Task 2.4: Trust line — drop fake counts, honest framing

**Files:**
- Modify: `src/routes/index.tsx` — Hero trust line ("Trusted by 12,000+ founders across 47 countries") and "As seen in" section

**Why:** Same fake-data problem. "12,000+ founders across 47 countries" is not real. "TechCrunch Africa, Disrupt Africa, Future Africa, Microtraction, Ventures Platform" — are these real endorsements? Unlikely.

**Step 1:** Replace hero trust line with something honest:
```tsx
<p className="mt-16 text-[10px] tracking-widest uppercase text-muted-foreground/60">
  In pilot · Builders and founders welcome
</p>
```

**Step 2:** Remove or rework the "As seen in" section. Either:
- (a) Delete it entirely, OR
- (b) Replace with a "Built with" or "Powered by" line that lists real tech: "Whop · Supabase · Paystack · Vercel"

Option (b) is honest and useful. Go with that.

**Step 3:** Update `byTheNumbers` to honest numbers — or replace the whole section with a "What we're measuring" framing. If pilot numbers are aspirational, mark them as such:
```tsx
{ value: "Pilot",  label: "Founders target" },
{ value: "Pilot",  label: "Communities target" },
{ value: "7",      label: "Progression stages" },
{ value: "500",    label: "DOT starter grant" },
```

**Step 4:** Build and verify no fake numbers anywhere.

**Step 5:** Commit:
```bash
git add src/routes/index.tsx
git commit -m "feat(landing): honest trust lines, drop fabricated social proof"
```

**Verification:** No claim that can't be backed up. Pilot-stage numbers marked as pilot.

---

## Phase 3 — Logo & Favicon (alpha channel)

### Task 3.1: Audit current logo + favicon assets

**Files:**
- Read: `dotlive logo.png` (186KB at project root)
- Read: `public/favicon.ico` (34KB)
- Read: `public/favicon.svg` (990 bytes)
- Find: every reference to these files

**Step 1:** Check `dotlive logo.png` — does it have an alpha channel?
```bash
file "/c/Users/GTHub/OneDrive/Desktop/dotlive-main/dotlive logo.png"
```
If it doesn't have alpha, the logo is unusable on dark backgrounds without white halos.

**Step 2:** Check the SVG favicon (the better path forward):
```bash
cat "/c/Users/GTHub/OneDrive/Desktop/dotlive-main/public/favicon.svg"
```

**Step 3:** Find every `<img src="dotlive logo.png">` or `import heroImg`:
```bash
grep -rn "dotlive logo\|hero-dot\|favicon" src/ public/ index.html --include="*.tsx" --include="*.ts" --include="*.html" 2>/dev/null
```

**Step 4:** Decide: keep the PNG (and fix it), or replace with the SVG. SVG is usually better for logos (scales, smaller, alpha native).

---

### Task 3.2: Replace hero image with proper logo + favicon variants

**Files:**
- Modify: `src/assets/hero-dot.jpg` → replace with `src/assets/logo-mark.svg` + `src/assets/logo-full.svg`
- Modify: `src/components/site/Logo.tsx`
- Modify: `public/favicon.svg` (already exists, may need redesign)
- Modify: `index.html` (favicon links)

**Step 1:** If logo SVG doesn't exist, create it from the PNG. Use the existing `dotlive logo.png` as visual reference.

**Step 2:** Update `Logo.tsx` to use SVG with proper sizing and currentColor support.

**Step 3:** Update `index.html` favicon links to point at SVG.

**Step 4:** Build and verify logo renders crisp at all sizes (16px favicon, 32px header, 200px hero) with transparent background.

**Step 5:** Commit:
```bash
git add src/assets/ public/
git commit -m "feat(brand): replace raster logo with alpha-channel SVG variants"
```

**Verification:** Logo has no white halo on dark mode. Renders crisp at favicon size.

---

## Phase 4 — Authenticated App Shell (`AppShell` + `PageHeader`)

> **Why Phase 4:** The app shell is the spine. Every authenticated route renders inside it. Fix this once, fix every app page.

### Task 4.1: Audit current AppShell rendering

**Files:**
- Read: `src/components/app/AppShell.tsx` (entire file)
- Read: `src/components/app/PageHeader.tsx`
- Read: `src/components/app/StatCard.tsx`
- Read: `src/components/app/EmptyState.tsx`
- Read: `src/components/app/DataTable.tsx`
- Read: `src/components/app/TransferDialog.tsx`
- Read: `src/components/app/DeliveryDialog.tsx`
- Read: `src/components/app/PageSkeleton.tsx`

**Step 1:** Read each file. Note current styling approach.

**Step 2:** List any remaining issues:
- Background color (currently `bg-background` — OK after Phase 1)
- Sidebar styling (uses `--sidebar` token — OK after Phase 1)
- Card borders (use `border-border` — OK)
- Role-based nav highlighting
- Active-route indicator

---

### Task 4.2: Sidebar visual treatment

**Files:**
- Modify: `src/components/app/AppShell.tsx` — sidebar surface and active state

**Step 1:** Sidebar background should use `--sidebar` token (set in Phase 1). Verify it does.

**Step 2:** Active nav item should have:
- Background: `bg-primary/10` (dark) or `bg-sage/30` (light)
- Text: `text-primary`
- Left border or dot indicator: 2px `border-primary` on the left edge
- Hover: `bg-accent` (sage-tinted)

**Step 3:** Inactive items: `text-muted-foreground`, hover `text-foreground`.

**Step 4:** Add subtle section dividers between role groups (e.g., a separator before "Admin" only if user is admin).

**Step 5:** Commit:
```bash
git add src/components/app/AppShell.tsx
git commit -m "feat(app-shell): sidebar active state + section dividers"
```

---

### Task 4.3: PageHeader visual treatment

**Files:**
- Modify: `src/components/app/PageHeader.tsx`

**Step 1:** Current style — review and confirm: eyebrow + title + subtitle on a bordered card or bare section?

**Step 2:** Standardize:
- Eyebrow (small uppercase tracked) above
- Title (display font, large)
- Subtitle (muted, body weight)
- Optional: right-aligned action buttons slot
- Optional: breadcrumbs slot

**Step 3:** Apply to all routes by ensuring they all use `PageHeader`.

**Step 4:** Commit:
```bash
git add src/components/app/PageHeader.tsx
git commit -m "feat(app-shell): standardize PageHeader across routes"
```

---

## Phase 5 — Per-Route Visual Pass

> **Approach:** Walk through every authenticated route, update visual treatment to match the new design system, fix anything that breaks.

### Task 5.1: Dashboard visual pass

**Files:**
- Modify: `src/routes/_authenticated/dashboard.tsx`

**Step 1:** Read the full file. Identify any:
- Hardcoded colors that should use tokens
- Sections that feel flat
- Stat cards that could benefit from icons + colors per stat type
- Empty states

**Step 2:** Apply the new design system: dark/cream surfaces, editorial palette accents for stat categories, proper card hierarchy.

**Step 3:** Verify wallet balance display is prominent (it's the user's most-looked-at number).

**Step 4:** Commit:
```bash
git add src/routes/_authenticated/dashboard.tsx
git commit -m "feat(dashboard): visual pass for new design system"
```

---

### Task 5.2: Wallet visual pass

**Files:**
- Modify: `src/routes/_authenticated/wallet.tsx`

**Step 1:** Wallet is a money screen. Apply gold accents for the balance card (the "premium" feel), green for actions.

**Step 2:** Transactions list: use alternating row backgrounds (subtle `bg-muted/30`), date groups as section headers.

**Step 3:** Commit:
```bash
git add src/routes/_authenticated/wallet.tsx
git commit -m "feat(wallet): visual pass with gold accent on balance"
```

---

### Task 5.3: Vantage visual pass

**Files:**
- Modify: `src/routes/_authenticated/vantage.tsx`

**Step 1:** Vantage is the scoring screen. The 0–1000 number is the hero. Apply:
- Big display number on a primary-glow card
- Category breakdown with colored bars (one per category, palette-mapped)
- Chart styling (recharts) should use new palette tokens

**Step 2:** Commit.

---

### Task 5.4: Academy visual pass

**Files:**
- Modify: `src/routes/_authenticated/academy.tsx`

**Step 1:** Courses as cards. Each course could use a subtle accent per category. Progress indicators use primary green.

**Step 2:** Commit.

---

### Task 5.5: Work / Marketplace visual pass

**Files:**
- Modify: `src/routes/_authenticated/work.tsx`

**Step 1:** Jobs + gigs marketplace. Card grid layout. Apply new design system.

**Step 2:** Commit.

---

### Task 5.6: Pitchathons visual pass

**Files:**
- Modify: `src/routes/_authenticated/pitchathons.tsx`

**Step 1:** Pitchathons are competitions. Gold accent for prizes, green for "Apply" CTAs.

**Step 2:** Commit.

---

### Task 5.7: Community + Sessions visual pass

**Files:**
- Modify: `src/routes/_authenticated/community.tsx`
- Modify: `src/routes/_authenticated/sessions.tsx`

**Step 1:** Apply design system. Community uses terracotta accent (people warmth). Sessions use teal accent (intellect/learning).

**Step 2:** Commit.

---

### Task 5.8: Discover + Investor + Judge visual pass

**Files:**
- Modify: `src/routes/_authenticated/discover.tsx`
- Modify: `src/routes/_authenticated/investor.tsx`
- Modify: `src/routes/_authenticated/judge.tsx`

**Step 1:** Investor surfaces get gold accents (capital). Discover gets sage. Judge is admin-style.

**Step 2:** Commit.

---

### Task 5.9: Profile + Settings + Notifications visual pass

**Files:**
- Modify: `src/routes/_authenticated/profile.tsx`
- Modify: `src/routes/_authenticated/settings.tsx`
- Modify: `src/routes/_authenticated/notifications.tsx`

**Step 1:** Apply design system. Settings stays clean and minimal (utility page).

**Step 2:** Commit.

---

### Task 5.10: Meetings + Certificates + Demo visual pass

**Files:**
- Modify: `src/routes/_authenticated/meetings.tsx`
- Modify: `src/routes/_authenticated/certificates.tsx`
- Modify: `src/routes/_authenticated/demo.tsx`

**Step 1:** Apply design system. Certificates use gold (achievement). Demo uses gold (capital).

**Step 2:** Commit.

---

### Task 5.11: Admin visual pass

**Files:**
- Modify: `src/routes/_authenticated/admin.tsx`

**Step 1:** Admin stays dense and functional. Apply design system but keep information density high.

**Step 2:** Commit.

---

### Task 5.12: Onboarding visual pass

**Files:**
- Modify: `src/routes/_authenticated/onboarding.tsx`

**Step 1:** Onboarding is the user's first experience after signup. This is THE most important authenticated screen. Apply the strongest design system treatment here.

**Step 2:** Commit.

---

## Phase 6 — Public Marketing Pages (besides landing)

### Task 6.1: About, Platform, Journey, Communities, Investors pages

**Files:**
- Modify: `src/routes/about.tsx`
- Modify: `src/routes/platform.tsx`
- Modify: `src/routes/journey.tsx`
- Modify: `src/routes/communities.tsx`
- Modify: `src/routes/investors.tsx`

**Step 1:** Each page uses `PageShell` — verify it benefits from the new design system. Apply per-page palette accent if needed.

**Step 2:** Commit per page or batch.

---

### Task 6.2: Auth pages

**Files:**
- Modify: `src/routes/auth.tsx`
- Modify: `src/routes/auth.callback.tsx`
- Modify: `src/routes/reset-password.tsx`

**Step 1:** Auth pages need to feel premium and trustworthy. Apply design system with editorial typography.

**Step 2:** Commit.

---

## Phase 7 — Validation & Polish

### Task 7.1: Build + visual QA across all themes

**Step 1:** Full build:
```bash
npm run build
```
Expected: no errors, no warnings (or warnings reduced).

**Step 2:** Boot dev server:
```bash
npm run dev
```

**Step 3:** Walk every route in browser:
- `/` — landing (dark)
- `/` — toggle to light
- `/auth` — both themes
- `/dashboard` — both themes (with mock auth)
- `/wallet` — both themes
- `/vantage` — both themes
- `/academy` — both themes
- `/work` — both themes
- `/pitchathons` — both themes
- `/community` — both themes
- `/sessions` — both themes
- `/investor` — both themes
- `/discover` — both themes
- `/meetings` — both themes
- `/certificates` — both themes
- `/notifications` — both themes
- `/settings` — both themes
- `/profile` — both themes
- `/admin` — both themes
- `/onboarding` — both themes
- `/about` — both themes
- `/platform` — both themes
- `/journey` — both themes
- `/communities` — both themes
- `/investors` — both themes

**Step 4:** Note anything that breaks or feels off. Patch in follow-up tasks.

---

### Task 7.2: Lighthouse + bundle check

**Step 1:** Run Lighthouse on `/` in both themes.
- Performance score > 85
- Accessibility > 90
- No contrast errors

**Step 2:** Check bundle size — the design system changes shouldn't have grown it dramatically.

---

### Task 7.3: Sync changes back to live folder (if working in tracked copy)

**Step 1:** If Phase 0 put us in `dotlive-main-tracked\dotlive-main\`, sync back:
```bash
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.output' --exclude='dist' \
  "/c/Users/GTHub/OneDrive/Desktop/dotlive-main/dotlive-main-tracked/dotlive-main/" \
  "/c/Users/GTHub/OneDrive/Desktop/dotlive-main/"
```

**Step 2:** Verify live folder reflects changes.

**Step 3:** Commit on live folder if it has its own git.

---

## Risks & Tradeoffs

1. **OneDrive file corruption risk** — `.tsx` writes may fail mid-edit. Mitigation: work in `dotlive-main-tracked\` (non-OneDrive sibling).

2. **Theme flash on first load** — if dark default isn't set in `<head>` before first paint, users see light theme briefly. Mitigation: inline script in `index.html` or `__root.tsx` head.

3. **Token cascade breakage** — changing tokens in Phase 1 will visually affect every page immediately. Some pages may look worse before they look better. Mitigation: per-route visual passes in Phase 5 fix them one at a time.

4. **Fake social proof risk** — even after Task 2.1, there may be other fabricated claims (`"as seen in"`, fabricated founder counts). Task 2.4 catches the landing-page ones. App-side reviews may also be fake — out of scope for this plan, flagged for separate audit.

5. **Lovable sync** — the project is Lovable-connected. Avoid force-push, rebasing published commits. Commit often, push to branch, merge via PR or Lovable's editor.

6. **OneDrive copy corruption** — `dotlive-monorepo\` and `dotlive-backend\` siblings exist but are the legacy Fastify backends (NOT used). Don't touch them. Live code is in `dotlive-main\` (or tracked copy).

7. **Scope creep** — "Everything" was selected. This plan has 7 phases and ~30 tasks. Each task is a real PR. Don't bundle — keep commits atomic so rollback is cheap.

---

## Resolved Decisions (locked Jun 24 2026)

1. **Pilot/beta labeling** — **NO.** Just remove fake specific numbers. Keep copy neutral. Don't say "pilot" or "beta" anywhere — it shouldn't feel like an early product.

2. **Logo scope** — **Full redesign.** Propose 2–3 logo alternatives before committing. Adds 1–2 hours but worth it.

3. **Motion** — **Included.** Add `motion` (Framer Motion successor, ~30KB) to dependencies. Implement:
   - Scroll-triggered fade-ups on section headings + cards
   - Hover lifts on interactive cards
   - Gentle parallax on hero background
   - Respect `prefers-reduced-motion` — disable all motion if user has it set

## Resolved Decisions (Locked — quality-first picks)

1. **Mock auth during dev** — Hardcode a dev-mode `useDotAuth` return gated on `import.meta.env.DEV`. Lets me visually QA every authenticated route without touching Supabase or real users. Real auth still flows through normally in production builds.

2. **Hero image fate** — **Remove** `hero-dot.jpg` entirely. The layered editorial backgrounds (radial bloom + grid + edge gradients) carry the hero now. The current image at 5% opacity is invisible and adds nothing. One-line re-import later if you miss it.

3. **Lighthouse budget** — **90 / 95** (performance / accessibility). Marketing surface should hold that bar. Measure and tune during Phase 7.

4. **Push cadence** — **Per-commit** to Lovable's connected branch. Atomic commits = cheap rollback. Batching a 25-hour redesign into one PR is too risky.

## Still Open (user can override any of these)

None blocking Phase 0. The four above are sensible defaults that prioritize quality and reversibility. User can override at any time.

---

## Time Estimate

- Phase 0 (safety): 15 min
- Phase 1 (tokens): 2 hours
- Phase 2 (landing): 3 hours
- Phase 3 (logo): 1 hour
- Phase 4 (app shell): 2 hours
- Phase 5 (per-route pass, 12 routes): 8–12 hours
- Phase 6 (marketing + auth pages): 2 hours
- Phase 7 (validation + polish): 2 hours

**Total: 20–25 hours of focused work.** Realistic for a full app redesign of a 13-route app with 19 DB migrations and 12 API modules.

User-execution blocks (visual QA on every route, theme toggle testing, deploy verification): add 3–4 hours of the user's time.

---

## Success Criteria

- [ ] All 8 phases completed
- [ ] Every route renders cleanly in both dark and light themes
- [ ] No fabricated testimonials, founder counts, or social proof
- [ ] Logo has proper alpha channel
- [ ] Favicon is crisp SVG
- [ ] No OneDrive write errors during execution
- [ ] Lighthouse Performance > 85, Accessibility > 90
- [ ] Bundle size delta < 50KB
- [ ] All commits atomic with descriptive messages
- [ ] Pilot-stage honesty is visible to users