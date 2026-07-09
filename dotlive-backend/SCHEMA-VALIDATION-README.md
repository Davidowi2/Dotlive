# Schema Validation System

This directory contains tools and tests to prevent schema mismatch bugs from reaching production.

## Problem We're Solving

We kept seeing the same patterns of bugs:
- Missing `createdAt` fields in INSERT statements
- Missing `updatedAt` fields in INSERT statements  
- Missing NOT NULL fields in INSERT statements
- Type-safety bypasses using `as any` that hide errors

These bugs cause HTTP 500 errors on user mutations and break critical platform features.

## Solution: Multi-Layer Validation

### Layer 1: Pre-Commit Hook
Runs automatically BEFORE code is committed. Validates:
- All INSERT statements have required fields
- No `as any` bypasses used
- Schema consistency

**Setup**:
```bash
bash scripts/setup-pre-commit-hook.sh
```

**Result**: Cannot commit code that violates these rules.

### Layer 2: Validation Scripts
Can be run manually or in CI/CD pipeline.

**Validate Schema Coverage**:
```bash
npx ts-node scripts/validate-schema-coverage.ts
```
Checks that all INSERT statements provide required NOT NULL fields.

**Find Type Bypasses**:
```bash
npx ts-node scripts/find-type-bypasses.ts
```
Finds all `as any` casts that hide type errors.

**Result**: Immediate feedback on what needs fixing.

### Layer 3: Integration Tests
Tests REAL database behavior to ensure schema constraints are enforced.

**Run Schema Validation Tests**:
```bash
npm run test -- schema-validation.test.ts
```

Tests that:
- Database rejects INSERT without required fields
- Database accepts INSERT with all required fields
- All NOT NULL constraints are properly enforced

**Result**: Catches schema drifts before deployment.

---

## How to Use

### As a Developer

#### Before Committing Code

```bash
# Your normal workflow
git add .
git commit -m "my changes"

# Pre-commit hook AUTOMATICALLY runs:
# ✅ Validates all INSERTs have required fields
# ✅ Checks for type bypasses
# ✅ Verifies schema consistency
#
# If validation fails:
# ❌ Commit is rejected
# ✅ You see exact errors
# ✅ Fix the issues
# ✅ Try committing again
```

#### When Adding a New INSERT Statement

1. Add the INSERT statement
2. Try to commit
3. Pre-commit hook validates
4. If fields are missing, hook tells you which ones
5. Add the missing fields
6. Commit succeeds

#### When Something Seems Wrong

```bash
# Run validation manually
cd dotlive-backend

# Check for schema mismatches
npx ts-node scripts/validate-schema-coverage.ts

# Check for type bypasses
npx ts-node scripts/find-type-bypasses.ts

# Run integration tests
npm run test -- schema-validation.test.ts
```

### In CI/CD Pipeline

Add to your GitHub Actions workflow (.github/workflows/validate.yml):

```yaml
- name: Validate Schema Coverage
  run: cd dotlive-backend && npx ts-node scripts/validate-schema-coverage.ts

- name: Check Type Bypasses
  run: cd dotlive-backend && npx ts-node scripts/find-type-bypasses.ts

- name: Run Schema Tests
  run: cd dotlive-backend && npm run test -- schema-validation.test.ts
```

**Result**: PR cannot be merged if validation fails.

---

## What Gets Checked

### Pre-Commit Hook

| Check | Caught | Example |
|-------|--------|---------|
| Missing NOT NULL field | ✅ YES | INSERT without createdAt |
| Missing updatedAt | ✅ YES | INSERT without updatedAt |
| Type bypass (as any) | ✅ WARNING | `values({...} as any)` |

### Validation Scripts

| Check | Validator | Example |
|-------|-----------|---------|
| All INSERT statements covered | validate-schema-coverage.ts | Finds all db.insert() calls |
| Required fields provided | validate-schema-coverage.ts | Checks against schema |
| Type bypasses | find-type-bypasses.ts | Searches for `as any` |

### Integration Tests

| Check | Test | Verification |
|-------|------|--------------|
| NOT NULL enforced | schema-validation.test.ts | Try INSERT without field → expect error |
| INSERT succeeds with fields | schema-validation.test.ts | Try INSERT with all fields → expect success |
| Defaults work | schema-validation.test.ts | Verify id generation, timestamps |
| Complete workflows | schema-validation.test.ts | Full payment/withdrawal/dividend workflows |

---

## Adding a New Table to Validation

When you add a new table with NOT NULL fields:

### 1. Update `validate-schema-coverage.ts`

```typescript
const schemaRequirements: Record<string, ...> = {
  // ... existing tables
  
  new_table: {
    table: 'new_table',
    notNullFields: ['field1', 'field2', 'createdAt'],
    allowedDefaults: ['id', 'createdAt'],
  },
};
```

### 2. Add tests to `schema-validation.test.ts`

```typescript
describe('new_table table', () => {
  it('should reject INSERT without required field', async () => {
    const shouldFail = async () => {
      await db.execute(sql`
        INSERT INTO new_table (id, field1)
        VALUES (${id}, ${value})
        -- ← Missing: field2
      `);
    };
    
    await expect(shouldFail()).rejects.toThrow();
  });
});
```

### 3. Run validation

```bash
npx ts-node scripts/validate-schema-coverage.ts
npm run test -- schema-validation.test.ts
```

---

## Troubleshooting

### "Pre-commit hook not running"

The hook might not be executable. Fix it:
```bash
chmod +x .git/hooks/pre-commit
```

Or reinstall:
```bash
bash scripts/setup-pre-commit-hook.sh
```

### "Validation says field is missing but I provided it"

The validator looks for camelCase field names (as used in code):
- Database: `created_at`
- Code (Drizzle): `createdAt`
- Validator searches for: `createdAt`

Make sure you're using the Drizzle field names.

### "as any warning but I need it"

Usually you don't. Remove the `as any` and add proper types instead:

```typescript
// ❌ WRONG
.values({...} as any)

// ✅ RIGHT - Remove as any
.values({...})
```

If TypeScript complains, it means a field is missing. That's the point!

### "Test failing with FK constraint but I provided all fields"

That's expected! The test might fail with "foreign key violated" if it's trying to reference a non-existent record. But it should NOT fail with "column...does not exist" or "NOT NULL constraint".

If you see those errors, your INSERT is missing a field.

---

## Files in This System

### Validators
- `scripts/validate-schema-coverage.ts` - Check all INSERTs have required fields
- `scripts/find-type-bypasses.ts` - Find `as any` bypasses
- `scripts/setup-pre-commit-hook.sh` - Setup pre-commit hook

### Tests
- `apps/api/src/routes/__tests__/schema-validation.test.ts` - Integration tests

### Documentation
- `SCHEMA-VALIDATION-README.md` - This file
- `.hermes/SYSTEMATIC-VERIFICATION-STRATEGY.md` - Detailed strategy document

---

## Success Criteria

You'll know this system is working when:

✅ Cannot commit without all required fields  
✅ Pre-commit hook runs automatically  
✅ Schema validation tests pass  
✅ No `as any` bypasses in new code  
✅ Database rejects bad data with proper errors  
✅ Users no longer see 500 errors from schema mismatches  

---

## Performance Impact

- Pre-commit validation: < 500ms per commit
- CI/CD validation: < 2 seconds
- Database tests: < 5 seconds
- Negligible overhead for developers

---

## Questions?

See the comprehensive strategy document:
`.hermes/SYSTEMATIC-VERIFICATION-STRATEGY.md`

It includes:
- Detailed explanation of the problem
- Complete solution architecture
- Implementation plan
- Real-world examples
- Future recommendations

