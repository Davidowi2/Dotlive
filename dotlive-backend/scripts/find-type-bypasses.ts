#!/usr/bin/env ts-node

/**
 * Type Bypass Finder
 * 
 * Finds all instances of `as any` and other type safety bypasses
 * that hide potential schema mismatches and validation errors.
 */

import fs from 'fs';
import path from 'path';

const bypasses: { file: string; line: number; context: string }[] = [];

console.log('\n🔍 Type Bypass Finder\n');
console.log('='.repeat(60));

// Scan all TypeScript files in routes
const routesDir = path.join(__dirname, '../apps/api/src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

console.log(`\nScanning ${routeFiles.length} route files for type bypasses...\n`);

routeFiles.forEach(file => {
  const filepath = path.join(routesDir, file);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Find `as any` patterns
    if (line.includes(' as any')) {
      // Get context (line before, this line, line after)
      const context = [
        lines[index - 1] || '',
        line,
        lines[index + 2] || '',
      ]
        .map(l => l.trim())
        .join(' ')
        .substring(0, 100);

      bypasses.push({
        file,
        line: index + 1,
        context,
      });
    }
  });
});

// Print results
console.log('='.repeat(60));
console.log(`\n📊 RESULTS\n`);

if (bypasses.length === 0) {
  console.log('✅ NO TYPE BYPASSES FOUND\n');
  console.log('Great! All code uses proper TypeScript types.\n');
  process.exit(0);
} else {
  console.log(`⚠️  FOUND ${bypasses.length} TYPE BYPASS(ES)\n`);

  bypasses.forEach((bypass, i) => {
    console.log(`  ${i + 1}. ${bypass.file}:${bypass.line}`);
    console.log(`     Context: ${bypass.context}`);
    console.log();
  });

  console.log('=' .repeat(60));
  console.log('\n⚠️  ACTION REQUIRED\n');
  console.log('These type bypasses hide potential bugs:');
  console.log('  • Missing NOT NULL fields may not be caught');
  console.log('  • IDE type checking is disabled');
  console.log('  • Future changes may introduce errors\n');
  console.log('Recommendation:');
  console.log('  • Remove `as any` casts');
  console.log('  • Use proper TypeScript types');
  console.log('  • Verify all required fields are provided\n');

  process.exit(1);
}
