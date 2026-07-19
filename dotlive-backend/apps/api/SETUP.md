# DOT Backend — Local Setup

## Prerequisites
- Node.js >= 20
- PostgreSQL installed and running on localhost:5432
- `psql` available on PATH or via PostgreSQL bin dir

## 1. Create databases
Open a shell as the Postgres superuser and run:
- psql -U postgres -c "CREATE DATABASE dotlive_dev;"
- psql -U postgres -c "CREATE DATABASE dotlive_test;"

## 2. Configure environment
Create `dotlive-backend/apps/api/.env`:
- DATABASE_URL=postgres://postgres:postgres@localhost:5432/dotlive_dev
- TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/dotlive_test
- JWT_SECRET=dev-secret-do-not-use-in-prod
- NODE_ENV=development

## 3. Run migrations
- cd dotlive-backend/apps/api
- npx drizzle-kit migrate

## 4. Seed local DB
- npm run db:seed

## 5. Run tests
- npm test

## Troubleshooting
- If `psql` cannot connect, verify `pg_hba.conf` allows `scram-sha-256` from localhost and that the superuser password matches.
- If migrations fail, verify DATABASE_URL points to `dotlive_dev`.
