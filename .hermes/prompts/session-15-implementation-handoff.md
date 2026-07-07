# DOT Platform — Implementation Handoff (P4-P9)

**Focus: Implement features from session prompts P4 through P9**

---

## Overview

Implement the following features in order. Each feature has a dedicated prompt file — read it first, check existing code, then implement.

---

## Feature Order

| Priority | Feature | Prompt File | Backend Needed |
|----------|---------|-------------|----------------|
| P4 | Buy Shares flow | `session-6-buy-shares.md` | Yes |
| P5 | Loan Panel | `session-7-loan-panel.md` | Yes |
| P6 | Communities | `session-11-referral.md` | Yes |
| P7 | Vantage Rebuild | `session-13-analytics.md` | Yes |
| P8 | Meetings + Chat | `session-10-meetings.md` | Yes |
| P9 | /work Jobs + Services | `session-14-admin.md` | Yes |

---

## How to Use

1. **Read the prompt file** — Each `.hermes/prompts/session-N-*.md` contains:
   - Current state (files to check first)
   - Database schema requirements
   - API routes needed
   - Frontend hooks/components
   - Testing steps

2. **Check existing code** — Before writing anything, look at:
   - `src/routes/` — existing pages
   - `src/hooks/` — existing hooks
   - `src/components/` — existing components
   - `dotlive-backend/apps/api/src/db/schema.ts` — DB tables

3. **Implement in order** — Schema → API → Hooks → UI

4. **Build must pass** — Run `npm run build` before commit

5. **Verify in browser** — Test with `browserverify@test.com` / `Verify123!`

---

## Project Structure

```
dotlive-main/
├── src/
│   ├── routes/              # Page routes
│   ├── hooks/               # Custom hooks
│   ├── components/          # UI components
│   └── lib/                 # Utilities
├── dotlive-backend/
│   └── apps/api/src/
│       ├── db/schema.ts     # Database tables
│       └── routes/          # API endpoints
└── .hermes/prompts/         # Feature prompts
    ├── session-6-buy-shares.md
    ├── session-7-loan-panel.md
    ├── session-10-meetings.md
    ├── session-11-referral.md
    ├── session-12-pitch.md
    ├── session-13-analytics.md
    └── session-14-admin.md
```

---

## Test Credentials

- **Email:** browserverify@test.com
- **Password:** Verify123!
- **Dev URL:** http://localhost:5173

---

## Rules

- One feature per session
- Don't invent new columns/APIs not in the prompt
- Use existing UI components from `src/components/ui/`
- Build must pass before any commit
- Commit with clear message describing what was added
- Push when feature is verified working

---

## Start Here

Pick a prompt file and begin with P4 (Buy Shares):

```bash
cat .hermes/prompts/session-6-buy-shares.md
```