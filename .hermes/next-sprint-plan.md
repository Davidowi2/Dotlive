
SPRINT 2 — BUILDER SYSTEM (the highest-impact first sprint)

Why this first: Builders are the value-creation loop. Every other
actor's experience (founders posting gigs, communities tracking
members, investors seeing pipelines) depends on a real Builder
identity with reputation. Without Levels + Arena + Challenges,
the OS has no engine.

What ships:
1. Builder Passport page (/builder/passport)
   - Photo, name, headline, bio, skills (chips), portfolio links
   - Reputation score (0-1000) with tier label
   - Current level + next-level requirements
   - Achievement badges grid
2. Builder Level Engine (server-side logic)
   - 5 levels with hard requirement gates
   - /api/builder/level (returns current + next + requirements)
   - Auto-promotion on requirement satisfaction
3. Builder Arena (/arena) — single home for builders
   - Open opportunities (challenges + gigs + jobs)
   - My submissions
   - Earnings this week
   - Earnings all-time
4. Challenge System (foundation for Sprint 4 community + Sprint 6 demo)
   - founders + admins post challenges (skill, reward DOT, deadline)
   - builders apply → submit → reviewer approves → DOT released
   - Tables: challenges, challenge_submissions
   - Routes: /api/challenges (CRUD), /api/challenges/:id/submit

Tables to add:
- challenges (id, title, description, skill, reward_dot, deadline,
  posted_by, status, created_at)
- challenge_submissions (id, challenge_id, builder_id, content,
  status, submitted_at, reviewed_at)

Effort: 4-5 days.

After Sprint 2 ships, the client will see:
- A builder can sign up → complete passport → see "you're Level 1
  Explorer, 0/100 rep" → browse the Arena → apply for a challenge →
  submit → get DOT credited → watch reputation tick up.
- That's the loop. Everything else hangs off it.
