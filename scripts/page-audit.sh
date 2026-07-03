#!/usr/bin/env bash
# scripts/page-audit.sh
#
# Greps every page under src/routes/_authenticated/ for common
# smells. Prints a one-line per finding. Exits 0 regardless — this
# is a LIST, not a gate.
#
# Usage: bash scripts/page-audit.sh
set -e

cd "$(dirname "$0")/.."

PAGES=$(find src/routes/_authenticated src/routes -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | sort -u)

echo "============================================================"
echo "  PAGE AUDIT — $(echo "$PAGES" | wc -l) files scanned"
echo "============================================================"
echo ""

echo "▌ 1. Mock data — hardcoded arrays, fake names, dummy users"
echo "------------------------------------------------------------"
grep -rnE "(MOCK_|MOCK_FAKE|FakeName|TODO|FIXME|XXX|dummy)" \
  $PAGES 2>/dev/null | head -20 || echo "  (none)"
echo ""

echo "▌ 2. Hardcoded dot prices / amounts (should come from data)"
echo "------------------------------------------------------------"
grep -rnE "(dot[A-Z_]*\s*=\s*[0-9]+|[0-9]+\s*\*\s*15)" \
  $PAGES 2>/dev/null | grep -v "test\|spec" | head -15 || echo "  (none)"
echo ""

echo "▌ 3. Empty onClick handlers / TODO comments"
echo "------------------------------------------------------------"
grep -rnE "onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}" $PAGES 2>/dev/null | head -10 || echo "  (none)"
grep -rn "TODO\|FIXME" $PAGES 2>/dev/null | head -10 || echo "  (none)"
echo ""

echo "▌ 4. console.log / console.error (forgotten dev logs)"
echo "------------------------------------------------------------"
grep -rnE "console\.(log|error|warn)" $PAGES 2>/dev/null | head -10 || echo "  (none)"
echo ""

echo "▌ 5. alert() / confirm() in pages (should be toast)"
echo "------------------------------------------------------------"
grep -rnE "\balert\(|^\s*confirm\(" $PAGES 2>/dev/null | head -10 || echo "  (none)"
echo ""

echo "▌ 6. window.location / location.href (should be Link / navigate)"
echo "------------------------------------------------------------"
grep -rnE "window\.location|location\.href" $PAGES 2>/dev/null | head -10 || echo "  (none)"
echo ""

echo "▌ 7. setTimeout in JSX (often a sign of a missing load-on-mount)"
echo "------------------------------------------------------------"
grep -rnE "setTimeout\s*\(" $PAGES 2>/dev/null | head -10 || echo "  (none)"
echo ""

echo "▌ 8. Hardcoded '/api/' calls — should use src/api/* wrapper"
echo "------------------------------------------------------------"
grep -rnE 'dotApi\.(get|post|put|patch|delete)\s*\(\s*[`"'"'"']/api/' $PAGES 2>/dev/null \
  | grep -v "src/api/" | head -15 || echo "  (none)"
echo ""

echo "============================================================"
echo "  END — copy findings above into TODO and fix in one pass"
echo "============================================================"
