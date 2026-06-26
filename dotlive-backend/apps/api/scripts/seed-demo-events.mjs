
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

const events = [
  {
    slug: "dot-demo-july-2026",
    name: "DOT Demo July 2026",
    description: "The flagship quarterly demo day. Open Track + Invitational Track. Top 10 ventures pitch live, Capital Partners commit funding, audience votes for People's Choice. 1,000,000 DOT in prize pool.",
    start_date: "2026-07-26T17:00:00Z",
    end_date: "2026-07-26T22:00:00Z",
    registration_deadline: "2026-07-20T23:59:00Z",
    voting_opens_at: "2026-07-15T00:00:00Z",
    voting_closes_at: "2026-07-26T17:00:00Z",
    tracks: ["open", "invitational"],
    sponsors: [
      { name: "Paystack", tier: "platinum", logo: "/sponsors/paystack.svg" },
      { name: "Flutterwave", tier: "platinum", logo: "/sponsors/flutterwave.svg" },
      { name: "Lagos State Innovation Council", tier: "gold", logo: "/sponsors/lagoscouncil.svg" }
    ],
    judges: [
      { name: "Iyin Aboyeji", role: "General Partner, Future Africa", avatar: "/judges/iyin.jpg" },
      { name: "Tayo Oviosu", role: "Founder & CEO, Paga", avatar: "/judges/tayo.jpg" },
      { name: "Dr. Omo Osagiede", role: "VP, Lagos Angel Network", avatar: "/judges/omo.jpg" }
    ],
    prize_pool_dot: "1000000.00",
    livestream_url: "https://youtube.com/live/dot-demo-july-2026",
    registration_fee_dot: "5000.00",
    status: "registration_open",
    featured_ventures: []
  },
  {
    slug: "campus-challenge-2026",
    name: "Campus Challenge 2026",
    description: "University founders compete for scholarships, mentorship, and demo-day qualification. University leaderboards, faculty rankings, team registration. 500,000 DOT in scholarships and prizes.",
    start_date: "2026-09-15T10:00:00Z",
    end_date: "2026-11-30T20:00:00Z",
    registration_deadline: "2026-10-15T23:59:00Z",
    voting_opens_at: "2026-11-15T00:00:00Z",
    voting_closes_at: "2026-11-28T23:59:00Z",
    tracks: ["open"],
    sponsors: [
      { name: "University of Lagos", tier: "platinum" },
      { name: "Covenant University", tier: "platinum" },
      { name: "Lagos Business School", tier: "gold" }
    ],
    judges: [],
    prize_pool_dot: "500000.00",
    registration_fee_dot: "0.00",
    status: "upcoming",
    featured_ventures: []
  },
  {
    slug: "arise-top-10-builders-aug-2026",
    name: "ARISE Top 10 Builders — August 2026",
    description: "Recognition program. The 10 builders with the highest reputation gain in August are featured on ARISE and awarded bonus DOT. Public voting runs alongside reputation scoring.",
    start_date: "2026-08-01T00:00:00Z",
    end_date: "2026-08-31T23:59:00Z",
    voting_opens_at: "2026-08-20T00:00:00Z",
    voting_closes_at: "2026-08-31T23:59:00Z",
    tracks: ["open"],
    sponsors: [],
    judges: [],
    prize_pool_dot: "200000.00",
    registration_fee_dot: "0.00",
    status: "upcoming",
    featured_ventures: []
  }
];

let ok = 0, skipped = 0;
for (const ev of events) {
  try {
    await db`
      INSERT INTO demo_events (
        slug, name, description, start_date, end_date, registration_deadline,
        voting_opens_at, voting_closes_at, tracks, sponsors, judges,
        prize_pool_dot, livestream_url, registration_fee_dot, status,
        featured_ventures, created_by, created_at, updated_at
      ) VALUES (
        ${ev.slug}, ${ev.name}, ${ev.description}, ${ev.start_date}, ${ev.end_date},
        ${ev.registration_deadline}, ${ev.voting_opens_at}, ${ev.voting_closes_at},
        ${JSON.stringify(ev.tracks)}::jsonb, ${JSON.stringify(ev.sponsors)}::jsonb, ${JSON.stringify(ev.judges)}::jsonb,
        ${ev.prize_pool_dot}, ${ev.livestream_url ?? null}, ${ev.registration_fee_dot}, ${ev.status},
        ${JSON.stringify(ev.featured_ventures)}::jsonb, ${'system'}, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        updated_at = NOW()
    `;
    ok++;
    console.log(`  ✓ ${ev.slug}`);
  } catch (e) {
    if (String(e.message).includes("duplicate")) skipped++;
    else {
      skipped++;
      console.error(`  ! ${ev.slug}: ${String(e.message).slice(0, 100)}`);
    }
  }
}
console.log(`\nDone: ${ok} inserted, ${skipped} skipped/updated`);
