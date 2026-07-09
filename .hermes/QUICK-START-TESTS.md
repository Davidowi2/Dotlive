# Quick Start: Running Bootstrap Migrations Tests

**TL;DR**: Run one command to automatically test the fix

---

## For Windows Users (Easiest)

### Option 1: PowerShell (Recommended)
```powershell
.\run-bootstrap-tests.ps1
```

This will:
1. ✅ Check prerequisites (Node, npm)
2. ✅ Navigate to backend
3. ✅ Install dependencies
4. ✅ Install vitest if needed
5. ✅ Run all tests
6. ✅ Show results

### Option 2: Command Prompt (CMD)
```cmd
run-bootstrap-tests.bat
```

Same as above, using batch script.

### Option 3: Manual (Step-by-Step)
```cmd
cd dotlive-backend\apps\api
npm install
npm install --save-dev vitest
set DATABASE_URL=postgresql://...
npx vitest run src\routes\__tests__\critical-mutations.test.ts
```

---

## For Mac/Linux Users

### Option 1: Bash (Easiest)
```bash
bash run-bootstrap-tests.sh
```

This will:
1. ✅ Check prerequisites
2. ✅ Navigate to backend
3. ✅ Install dependencies
4. ✅ Run tests
5. ✅ Show results

### Option 2: Manual (Step-by-Step)
```bash
cd dotlive-backend/apps/api
npm install
npm install --save-dev vitest
export DATABASE_URL="postgresql://..."
npm run test
```

---

## Before Running Tests

### You Need:
1. ✅ Node.js 18+ installed
2. ✅ npm installed
3. ✅ Database connection string (or willbe prompted)

### You Should Know:
- Tests verify the bootstrap migrations fix
- Tests check database schema correctness
- Tests require database connectivity
- Takes ~30 seconds to run

---

## Database Connection Setup

### Quick Setup - Use Your Existing Neon Database

**For Windows PowerShell**:
```powershell
$env:DATABASE_URL = "postgresql://[user]:[password]@[host]/[database]"
.\run-bootstrap-tests.ps1
```

**For Windows CMD**:
```cmd
set DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
run-bootstrap-tests.bat
```

**For Mac/Linux Bash**:
```bash
export DATABASE_URL="postgresql://[user]:[password]@[host]/[database]"
bash run-bootstrap-tests.sh
```

### Where to Get Connection String:
1. Go to Neon dashboard: https://console.neon.tech
2. Select your project
3. Click "Connection string"
4. Copy the full URL (looks like: `postgresql://user:pass@ep-xxx.neon.tech/database`)

---

## What the Tests Check

✅ **pitch_decks table**
- Has correct columns (venture_id, url, NOT user_id/slides)
- No conflicting schema

✅ **dividends table**
- Has correct columns (declared_by, per_share_amount, NOT recipient_id)
- Indexes exist

✅ **loans table**
- Has correct columns
- Foreign keys valid

✅ **feed_posts table**
- Correct schema with all columns

✅ **builder_reviews table**
- Correct structure

✅ **Database Integrity**
- No duplicate constraints
- Idempotent (safe to re-run)
- All indexes present

---

## Expected Output - Success

```
✓ src/routes/__tests__/critical-mutations.test.ts (15)
  ✓ Critical Mutations - Pitch Decks, Dividends, Loans, Feed
    ✓ Pitch Decks Table Schema (1)
      ✓ should have correct pitch_decks columns after bootstrap
    ✓ Dividends Table Schema (1)
      ✓ should have correct dividends columns after bootstrap
    ✓ Loans Table Schema (1)
      ✓ should have correct loans columns after bootstrap
    ✓ Feed Posts Table Schema (2)
      ✓ should have correct feed_posts columns after bootstrap
      ✓ should have correct feed_post_likes schema
    ✓ Bootstrap Idempotency (1)
      ✓ tables should be created with IF NOT EXISTS
    ✓ No Duplicate Constraints (3)
      ✓ pitch_decks should have single primary key
      ✓ dividends should have single primary key
      ✓ loans should have single primary key
    ✓ Indexes Exist (2)
      ✓ pitch_decks should have venture_id index
      ✓ dividends should have venture_id and declared_by indexes

Test Files  1 passed (1)
     Tests  15 passed (15)
  Start at  12:34:56
  Duration  2.34s

================================
✓ ALL TESTS PASSED!
================================
```

---

## If Tests Fail

### Error: "DATABASE_URL not set"

**Fix**:
Set the database URL:

**PowerShell**:
```powershell
$env:DATABASE_URL = "postgresql://user:pass@host/database"
.\run-bootstrap-tests.ps1
```

**CMD**:
```cmd
set DATABASE_URL=postgresql://user:pass@host/database
run-bootstrap-tests.bat
```

**Bash**:
```bash
export DATABASE_URL="postgresql://user:pass@host/database"
bash run-bootstrap-tests.sh
```

---

### Error: "Cannot connect to database"

**Fix**:
1. Verify connection string is correct
2. Check database is running
3. Check credentials are valid
4. Test connection: `psql $DATABASE_URL` (if you have psql installed)

---

### Error: "vitest not found"

**Fix**:
The scripts will try to install it automatically. If that fails, do manually:

```bash
cd dotlive-backend/apps/api
npm install --save-dev vitest @vitest/coverage-v8
```

---

### Error: "Column does not exist"

**Fix**:
Database tables don't exist yet. Run migrations:

```bash
cd dotlive-backend/apps/api
npm run db:push
```

Or start the server once (which creates tables):
```bash
npm run dev
# Wait 5 seconds for server to start
# Press Ctrl+C to stop
```

Then run tests again.

---

### Error: "Test timeout"

**Fix**:
Database is slow. Increase timeout:

Edit `dotlive-backend/apps/api/vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    testTimeout: 30000,  // 30 seconds instead of 5
  },
});
```

---

## After Tests Pass

✅ Fix is verified  
✅ Ready to deploy  

### Next Steps:

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "fix(bootstrap): remove duplicate migrations causing 500 errors"
   git push
   ```

2. **Deploy to Render**:
   - Push to `audit-fixes-2026-07-09` branch
   - Render auto-deploys
   - Monitor error logs

3. **Test via frontend**:
   - Create pitch deck (should work)
   - Create feed post (should work)
   - Try other mutations

4. **Monitor**:
   - Check `/api/health` returns 200
   - Monitor error logs for 500s
   - Verify mutations work

---

## Troubleshooting Guide

| Problem | Solution |
|---------|----------|
| Scripts not found | Make sure you're in workspace root |
| Permission denied (bash) | Run: `chmod +x run-bootstrap-tests.sh` |
| Tests can't find database | Set DATABASE_URL environment variable |
| vitest command not found | Run: `npm install --save-dev vitest` in backend folder |
| TypeScript errors | Run: `npm install` in backend folder |
| Tests timeout | Increase timeout in vitest.config.ts or use faster database |
| Module not found errors | Run migrations first: `npm run db:push` |

---

## Important Notes

- ✅ Tests don't modify data, only read schema
- ✅ Safe to run multiple times
- ✅ Safe to run while server is running
- ✅ Requires database connectivity
- ✅ Takes ~30 seconds
- ✅ No production impact

---

## Need Help?

1. Check `.hermes/HOW-TO-RUN-TESTS.md` for detailed guide
2. Check `.hermes/VALIDATION-STEPS.md` for full test procedures
3. Review test file: `dotlive-backend/apps/api/src/routes/__tests__/critical-mutations.test.ts`

---

## Summary

**Run one of these commands:**

```bash
# Windows PowerShell
.\run-bootstrap-tests.ps1

# Windows CMD
run-bootstrap-tests.bat

# Mac/Linux
bash run-bootstrap-tests.sh
```

**That's it!** The script handles everything else.

