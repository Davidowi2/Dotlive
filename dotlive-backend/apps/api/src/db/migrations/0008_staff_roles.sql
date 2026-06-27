-- Migration 0008: extend user_roles role CHECK to include staff roles
-- Adds: moderator, support, finance
-- Run on Neon via Node + Neon HTTP:
--   import('dotenv/config').then(async () => {
--     const { neon } = await import('@neondatabase/serverless');
--     const sql = neon(process.env.DATABASE_URL);
--     await sql`ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check_chk`;
--     await sql`ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check_chk CHECK (role IN ('builder', 'founder', 'investor', 'community_leader', 'admin', 'super_admin', 'vendor', 'capital_partner', 'moderator', 'support', 'finance'))`;
--   });

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check_chk;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check_chk CHECK (role IN ('builder', 'founder', 'investor', 'community_leader', 'admin', 'super_admin', 'vendor', 'capital_partner', 'moderator', 'support', 'finance'));
