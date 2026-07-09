#!/bin/bash

# Setup Pre-Commit Hook for Schema Validation
# 
# This script creates a pre-commit hook that runs validation checks
# before allowing code to be committed, preventing schema bugs from
# reaching version control.

set -e

HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"

echo "📝 Setting up pre-commit hook for schema validation..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOK_DIR"

# Create the pre-commit hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Pre-commit hook: Schema Validation
# Runs before code is committed to prevent schema bugs

set -e

echo ""
echo "🔍 Running pre-commit schema validation..."
echo ""

# Check for `as any` casts
if grep -r " as any" dotlive-backend/apps/api/src/routes/ --include="*.ts" > /dev/null 2>&1; then
  echo "⚠️  WARNING: Found 'as any' type bypasses in route files"
  echo "    These hide type checking and may hide schema mismatches"
  echo "    Consider removing them and using proper types"
  echo ""
fi

# Run schema coverage validator if it exists
if [ -f "dotlive-backend/scripts/validate-schema-coverage.ts" ]; then
  echo "📊 Validating schema coverage..."
  cd dotlive-backend
  npx ts-node scripts/validate-schema-coverage.ts
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Schema validation failed!"
    echo "   Fix the issues above before committing"
    exit 1
  fi
  cd ..
else
  echo "⚠️  Schema validator not found, skipping validation"
fi

echo ""
echo "✅ Pre-commit validation passed!"
echo ""

exit 0
EOF

# Make the hook executable
chmod +x "$HOOK_FILE"

echo "✅ Pre-commit hook installed at: $HOOK_FILE"
echo ""
echo "The hook will now run automatically before each commit."
echo ""
echo "To test it:"
echo "  1. Make a change to a route file"
echo "  2. Try to commit"
echo "  3. Hook will run validation automatically"
echo ""
echo "To bypass hook (not recommended):"
echo "  git commit --no-verify"
echo ""
