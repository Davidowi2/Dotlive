
import { neon } from "@neondatabase/serverless";
const db = neon(process.env.DATABASE_URL);

// Get users who don't have ventures yet
const usersWithoutVentures = await db`
  SELECT u.id, u.name, u.email, u.dot_id
  FROM users u
  LEFT JOIN ventures v ON v.user_id = u.id
  WHERE v.id IS NULL
    AND u.email LIKE '%@%'
  LIMIT 8
`;
console.log(`Found ${usersWithoutVentures.length} users without ventures`);

const ventures = [
  { name: 'PayAfrika', industry: 'Fintech', stage: 'Validate', country: 'Nigeria', description: 'Cross-border micro-payment infrastructure for gig workers.', fundingGoal: 50000, vantagePoint: 720, fundability: 68 },
  { name: 'AgriMobi', industry: 'Agriculture', stage: 'Build', country: 'Kenya', description: 'Mobile marketplace connecting smallholder farmers to urban buyers.', fundingGoal: 120000, vantagePoint: 540, fundability: 72 },
  { name: 'HealthLink', industry: 'Health', stage: 'Assess', country: 'Ghana', description: 'Telemedicine platform for rural West African clinics.', fundingGoal: 75000, vantagePoint: 380, fundability: 55 },
  { name: 'EduBridge', industry: 'Education', stage: 'Validate', country: 'Nigeria', description: 'AI tutor that adapts to local curriculum and language.', fundingGoal: 90000, vantagePoint: 615, fundability: 64 },
  { name: 'SolarCircle', industry: 'Energy', stage: 'Build', country: 'Senegal', description: 'Pay-as-you-go solar for off-grid households.', fundingGoal: 200000, vantagePoint: 800, fundability: 78 },
  { name: 'MarketX', industry: 'Commerce', stage: 'Scale', country: 'South Africa', description: 'B2B wholesale marketplace for African SMEs.', fundingGoal: 350000, vantagePoint: 920, fundability: 85 },
  { name: 'LogiLink', industry: 'Logistics', stage: 'Validate', country: 'Egypt', description: 'Last-mile delivery network for North Africa.', fundingGoal: 60000, vantagePoint: 480, fundability: 60 },
  { name: 'MediaLift', industry: 'Media', stage: 'Fund', country: 'Nigeria', description: 'Streaming platform for African content creators.', fundingGoal: 250000, vantagePoint: 750, fundability: 70 },
];

let userIdx = 0;
for (const v of ventures) {
  if (userIdx >= usersWithoutVentures.length) break;
  const u = usersWithoutVentures[userIdx++];
  await db`
    INSERT INTO ventures (user_id, name, industry, stage, country, description, funding_goal, vantage_point, fundability, investment_readiness)
    VALUES (${u.id}, ${v.name}, ${v.industry}, ${v.stage}, ${v.country}, ${v.description}, ${String(v.fundingGoal)}, ${v.vantagePoint}, ${v.fundability}, 60)
  `;
  
  // Also update founder_profiles
  await db`
    INSERT INTO founder_profiles (user_id, venture_name, industry, stage, country, bio, funding_goal, vantage_point, fundability, investment_readiness)
    VALUES (${u.id}, ${v.name}, ${v.industry}, ${v.stage}, ${v.country}, ${v.description}, ${String(v.fundingGoal)}, ${v.vantagePoint}, ${v.fundability}, 60)
    ON CONFLICT (user_id) DO UPDATE SET venture_name = EXCLUDED.venture_name
  `;
  console.log(`  ✓ ${u.name} → ${v.name} (${v.stage}, vantage=${v.vantagePoint})`);
}

// Have the super admin commit 5000 DOT to PayAfrika for testing
const [cpUser] = await db`SELECT id FROM users WHERE email = 'browserverify@test.com'`;
const [payAfrika] = await db`SELECT id, user_id FROM ventures WHERE name = 'PayAfrika'`;
if (cpUser && payAfrika) {
  // Check if not already committed
  const existing = await db`SELECT id FROM transactions WHERE user_id = ${cpUser.id} AND description LIKE ${'%' + payAfrika.id + '%'} AND description LIKE '[CAPITAL_COMMIT]%'`;
  if (existing.length === 0) {
    await db`
      UPDATE wallets SET balance = balance - 5000, updated_at = NOW()
      WHERE user_id = ${cpUser.id} AND balance >= 5000
    `;
    await db`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${cpUser.id}, '-5000', 'debit', ${'[CAPITAL_COMMIT] venture=' + payAfrika.id + ' note=Test commitment from CP dashboard'})
    `;
    await db`
      UPDATE wallets SET balance = balance + 5000, updated_at = NOW()
      WHERE user_id = ${payAfrika.user_id}
    `;
    await db`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${payAfrika.user_id}, '5000', 'credit', ${'[CAPITAL_RECEIVE] from=' + cpUser.id + ' venture=' + payAfrika.id + ' note=Test commitment from CP dashboard'})
    `;
    console.log(`  ✓ Capital committed: 5000 DOT → PayAfrika`);
  } else {
    console.log(`  (already committed)`);
  }
}

// Also add some votes to PayAfrika for testing
const [v] = await db`SELECT id, user_id FROM ventures WHERE name = 'PayAfrika'`;
if (v) {
  const voters = await db`SELECT id FROM users WHERE id != ${v.user_id} LIMIT 5`;
  for (const voter of voters) {
    const existingVote = await db`SELECT id FROM votes WHERE voter_id = ${voter.id} AND target_id = ${v.id} AND target_type = 'venture'`;
    if (existingVote.length === 0) {
      await db`
        INSERT INTO votes (voter_id, target_id, target_type, weight, reputation_at_vote, event_slug)
        VALUES (${voter.id}, ${v.id}, 'venture', 1, 100, 'dot-demo-july-2026')
      `;
    }
  }
  console.log(`  ✓ Added votes for PayAfrika`);
}

console.log(`\nDone. Total ventures: ${(await db`SELECT COUNT(*) FROM ventures`)[0].count}`);
