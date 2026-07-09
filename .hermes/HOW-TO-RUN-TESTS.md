# How to Run Automated Tests for Bootstrap Migrations Fix

**Date**: July 9, 2026  
**Test File**: `dotlive-backend/apps/api/src/routes/__tests__/critical-mutations.test.ts`

---

## Overview

We created an automated test suite to verify that the bootstrap migrations fix is working correctly. This guide shows you exactly how to run these tests.

---

## Prerequisites

### 1. Install Dependencies
Make sure all backend dependencies are installed:

```bash
cd dotlive-backend/apps/api
npm install
```

### 2. Check Test Setup
Verify vitest is installed:

```bash
npm ls vitest
# Should show: vitest@4.1.9 (or higher)
```

---

## Method 1: Add Test Script to Backend (Recommended)

The backend `package.json` doesn't have a test script. Let's add one:

### Step 1: Update `dotlive-backend/apps/api/package.json`

Add these scripts to the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json || true",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "node scripts/seed.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 2: Install Vitest (if not already installed)

```bash
cd dotlive-backend/apps/api
npm install --save-dev vitest @vitest/coverage-v8
```

### Step 3: Create vitest config for backend

Create `dotlive-backend/apps/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
```

### Step 4: Run Tests

```bash
cd dotlive-backend/apps/api
npm run test
# or
npm run test:watch  # for watch mode
# or
npm run test:coverage  # for coverage report
```

---

## Method 2: Run Tests Directly with Vitest

If vitest is installed globally or in the workspace:

```bash
cd dotlive-backend/apps/api

# Run specific test file
npx vitest run src/routes/__tests__/critical-mutations.test.ts

# Run all tests
npx vitest run

# Run with watch mode
npx vitest

# Run with coverage
npx vitest run --coverage
```

---

## Method 3: Run from Workspace Root

If you have a workspace setup:

```bash
# From workspace root
npm run test -- dotlive-backend/apps/api/src/routes/__tests__/critical-mutations.test.ts

# Or run all backend tests
npm run test -- --project=api
```

---

## Method 4: Database-Connected Testing (Full Validation)

The test suite needs a database connection. You can run it against:

### Option A: Local Development Database

```bash
# Set environment variable for test database
export DATABASE_URL="postgresql://user:password@localhost:5432/dotlive_test"

# Run tests
cd dotlive-backend/apps/api
npm run test
```

### Option B: Neon Test Database

```bash
# Use the Neon staging/test URL
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dotlive_test"

# Run tests
npm run test
```

### Option C: Mock Database (Unit Tests Only)

For schema validation without database:

```bash
# Run only schema tests (no DB connection needed)
npx vitest run src/routes/__tests__/critical-mutations.test.ts --reporter=verbose
```

---

## Expected Test Output

When tests pass, you'll see:

```
✓ src/routes/__tests__/critical-mutations.test.ts (7)
  ✓ Critical Mutations - Pitch Decks, Dividends, Loans, Feed (7)
    ✓ Pitch Decks Table Schema
      ✓ should have correct pitch_decks columns after bootstrap
    ✓ Dividends Table Schema
      ✓ should have correct dividends columns after bootstrap
    ✓ Loans Table Schema
      ✓ should have correct loans columns after bootstrap
    ✓ Feed Posts Table Schema
      ✓ should have correct feed_posts columns after bootstrap
      ✓ should have correct feed_post_likes schema
    ✓ Bootstrap Idempotency
      ✓ tables should be created with IF NOT EXISTS
    ✓ No Duplicate Constraints
      ✓ pitch_decks should have single primary key
      ✓ dividends should have single primary key
      ✓ loans should have single primary key
    ✓ Indexes Exist
      ✓ pitch_decks should have venture_id index
      ✓ dividends should have venture_id and declared_by indexes

Test Files  1 passed (1)
     Tests  15 passed (15)
  Start at  12:34:56
  Duration  1.23s
```

---

## If Tests Fail

### Common Issues

#### Issue 1: Database Connection Error
```
Error: ECONNREFUSED — Cannot connect to database
```

**Solution**:
- Verify `DATABASE_URL` environment variable is set
- Check database is running and accessible
- Use valid credentials

#### Issue 2: Vitest Not Found
```
Command 'vitest' not found
```

**Solution**:
```bash
cd dotlive-backend/apps/api
npm install --save-dev vitest
```

#### Issue 3: Column Not Found
```
Error: column "venture_id" does not exist
```

**Solution**:
- Run bootstrap migrations first:
  ```bash
  cd dotlive-backend/apps/api
  npm run db:push
  ```
- Or start the server once to run bootstrap:
  ```bash
  npm run dev
  # Server will create tables at startup
  # Then run tests
  ```

#### Issue 4: Test Timeout
```
Test timeout after 5000ms
```

**Solution**:
- Increase timeout in vitest.config.ts:
  ```typescript
  export default defineConfig({
    test: {
      testTimeout: 30000,  // 30 seconds
    },
  });
  ```

---

## Full Test Workflow

Here's the complete workflow to run tests properly:

### Step 1: Setup Backend
```bash
cd dotlive-backend/apps/api
npm install
```

### Step 2: Set Environment (choose one)

**Option A - Local DB**:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/dotlive_test"
```

**Option B - Neon DB**:
```bash
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dotlive_test"
```

**Option C - Use .env file**:
```bash
# Create .env
echo DATABASE_URL="postgresql://..." > .env
```

### Step 3: Run Bootstrap Migrations (if needed)
```bash
npm run db:push
```

### Step 4: Run Tests
```bash
npm run test
```

### Step 5: View Results
- Check console output for passed/failed tests
- Review coverage report (if generated)

---

## Test Coverage

The test suite covers:

✅ **Schema Verification**
- Correct columns exist
- No conflicting columns present
- Data types match

✅ **Constraint Verification**
- Single primary key (no duplicates)
- Foreign keys valid
- Unique constraints present

✅ **Index Verification**
- Required indexes exist
- Indexes named correctly

✅ **Idempotency**
- Tables safe to create multiple times
- No conflicts on re-runs

✅ **Specific Tables Tested**
- pitch_decks
- dividends
- loans
- feed_posts
- builder_reviews
- And their related tables

---

## CI/CD Integration

To add to CI/CD pipeline (GitHub Actions, GitLab CI, etc.):

### GitHub Actions Example
```yaml
name: Test Bootstrap Migrations

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dotlive_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd dotlive-backend/apps/api
          npm install
      
      - name: Run migrations
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost/dotlive_test"
        run: |
          cd dotlive-backend/apps/api
          npm run db:push
      
      - name: Run tests
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost/dotlive_test"
        run: |
          cd dotlive-backend/apps/api
          npm run test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./dotlive-backend/apps/api/coverage/coverage-final.json
```

---

## Quick Reference Commands

```bash
# Go to backend
cd dotlive-backend/apps/api

# Install dependencies
npm install

# Set database (choose one)
export DATABASE_URL="postgresql://..."

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run src/routes/__tests__/critical-mutations.test.ts

# Run with coverage
npm run test:coverage

# Run with specific reporter
npx vitest run --reporter=verbose

# Run and generate HTML coverage
npm run test:coverage -- --reporter=html
```

---

## Troubleshooting

### Tests Run But All Fail
**Cause**: Database connection issue  
**Fix**: 
1. Verify DATABASE_URL is correct
2. Check database is accessible
3. Run `npm run db:push` first

### Tests Take Too Long
**Cause**: Slow database connection  
**Fix**:
1. Use local database if possible
2. Increase timeout in config
3. Run in parallel mode

### One Test Passes, Others Fail
**Cause**: Test order dependency or data cleanup issue  
**Fix**:
1. Check test isolation
2. Add cleanup between tests
3. Run tests in different order

### Import Errors
**Cause**: Module resolution issue  
**Fix**:
1. Check tsconfig.json
2. Verify file paths
3. Install missing dependencies

---

## Next Steps

After running tests successfully:

1. ✅ Verify all tests pass
2. ✅ Review test output for any warnings
3. ✅ Check test coverage (aim for >80%)
4. ✅ Run functional tests manually
5. ✅ Deploy backend
6. ✅ Test mutations via frontend

---

## Support

If tests don't work:

1. Check `.hermes/VALIDATION-STEPS.md` for detailed procedures
2. Review test file: `dotlive-backend/apps/api/src/routes/__tests__/critical-mutations.test.ts`
3. Check for environment variable issues
4. Verify database connectivity
5. Review error messages in console

---

**Once all tests pass, the fix is verified and ready for production deployment!**

