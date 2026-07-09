#!/usr/bin/env ts-node

/**
 * Schema Coverage Validator
 * 
 * Checks that all NOT NULL fields in the schema are being properly
 * provided in INSERT statements. Helps catch schema mismatches early.
 */

import fs from 'fs';
import path from 'path';

// Define all tables with their required (NOT NULL) fields
const schemaRequirements: Record<string, {
  table: string;
  notNullFields: string[];
  allowedDefaults: string[]; // Fields that have .default() in schema
}> = {
  payments: {
    table: 'payments',
    notNullFields: ['userId', 'dotAmount', 'nairaAmount', 'status', 'reference', 'createdAt'],
    allowedDefaults: ['id', 'createdAt'],
  },
  withdrawal_requests: {
    table: 'withdrawal_requests',
    notNullFields: ['userId', 'amountDot', 'amountNgn', 'bankInfo', 'status', 'kycTier', 'updatedAt'],
    allowedDefaults: ['id', 'createdAt'],
  },
  dividends: {
    table: 'dividends',
    notNullFields: ['ventureId', 'declaredBy', 'amountNaira', 'perShareAmount', 'period', 'status', 'createdAt'],
    allowedDefaults: ['id'],
  },
  dividend_payments: {
    table: 'dividend_payments',
    notNullFields: ['dividendId', 'investorId', 'investmentId', 'sharesOwned', 'amountNaira', 'status', 'createdAt'],
    allowedDefaults: ['id'],
  },
  service_orders: {
    table: 'service_orders',
    notNullFields: ['serviceId', 'clientId', 'builderId', 'amountDot', 'title', 'status', 'updatedAt'],
    allowedDefaults: ['id', 'createdAt'],
  },
  feed_posts: {
    table: 'feed_posts',
    notNullFields: ['authorId', 'authorName', 'body', 'type'],
    allowedDefaults: ['id', 'createdAt', 'updatedAt'],
  },
  feed_comments: {
    table: 'feed_comments',
    notNullFields: ['postId', 'authorId', 'authorName', 'body'],
    allowedDefaults: ['id', 'createdAt'],
  },
  feed_post_likes: {
    table: 'feed_post_likes',
    notNullFields: ['postId', 'userId'],
    allowedDefaults: ['id', 'createdAt'],
  },
};

const issues: string[] = [];
const successes: string[] = [];

console.log('\n🔍 Schema Coverage Validator\n');
console.log('=' .repeat(60));

// Read all route files
const routesDir = path.join(__dirname, '../apps/api/src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

console.log(`\nScanning ${routeFiles.length} route files...\n`);

routeFiles.forEach(file => {
  const filepath = path.join(routesDir, file);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Find all db.insert() calls
  const insertMatches = content.matchAll(/\.insert\((\w+)\)[\s\S]*?\.values\(([\s\S]*?)\)/g);

  for (const match of insertMatches) {
    const tableName = match[1];
    const valuesCode = match[2];

    // Check if table has requirements
    const requirement = Object.values(schemaRequirements).find(r => r.table === tableName);
    if (!requirement) continue; // Not a table we're validating

    // Check for `as any` - red flag
    if (valuesCode.includes(' as any')) {
      issues.push(`⚠️  ${file}: Using 'as any' on ${tableName} INSERT - type safety bypassed`);
      continue;
    }

    // Check if required fields are mentioned in values
    const missingFields = requirement.notNullFields.filter(field => {
      const camelCase = field.charAt(0).toLowerCase() + field.slice(1); // Drizzle uses camelCase
      return !valuesCode.includes(camelCase);
    });

    // Filter out fields that have defaults
    const actuallyMissing = missingFields.filter(f => !requirement.allowedDefaults.includes(f));

    if (actuallyMissing.length > 0) {
      issues.push(
        `❌ ${file}: ${tableName} INSERT missing required fields: ${actuallyMissing.join(', ')}`
      );
    } else {
      successes.push(`✅ ${file}: ${tableName} has all required fields`);
    }
  }
});

// Print results
console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTS\n`);

if (issues.length > 0) {
  console.log(`❌ ISSUES FOUND: ${issues.length}\n`);
  issues.forEach(issue => console.log(`  ${issue}`));
}

if (successes.length > 0) {
  console.log(`\n✅ PASSED: ${successes.length}`);
  console.log(`  (not showing all passing checks for brevity)\n`);
}

console.log('='.repeat(60) + '\n');

if (issues.length > 0) {
  console.log('❌ VALIDATION FAILED\n');
  console.log('Action items:');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
  process.exit(1);
} else {
  console.log('✅ ALL VALIDATIONS PASSED\n');
  console.log('✅ All INSERT statements provide required NOT NULL fields\n');
  process.exit(0);
}
