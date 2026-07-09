#!/bin/bash
# Quick script to run bootstrap migrations tests
# Usage: bash run-bootstrap-tests.sh

set -e

echo "================================"
echo "Bootstrap Migrations Test Runner"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Step 2: Navigate to backend
echo "Step 2: Navigating to backend directory..."
cd dotlive-backend/apps/api
echo -e "${GREEN}✓ Changed to: $(pwd)${NC}"
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Check vitest
echo "Step 4: Checking vitest..."
if ! npx vitest --version &> /dev/null; then
    echo -e "${YELLOW}⚠ vitest not found, installing...${NC}"
    npm install --save-dev vitest @vitest/coverage-v8
fi
echo -e "${GREEN}✓ vitest ready: $(npx vitest --version)${NC}"
echo ""

# Step 5: Check database connection
echo "Step 5: Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠ DATABASE_URL not set${NC}"
    echo "   Please set: export DATABASE_URL=\"postgresql://....\""
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
fi
echo ""

# Step 6: Run TypeScript check
echo "Step 6: Running TypeScript check..."
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript warnings (non-blocking)${NC}"
fi
echo ""

# Step 7: Run tests
echo "Step 7: Running automated tests..."
echo "   Test file: src/routes/__tests__/critical-mutations.test.ts"
echo ""
echo "Running: npx vitest run src/routes/__tests__/critical-mutations.test.ts"
echo ""

if npx vitest run src/routes/__tests__/critical-mutations.test.ts --reporter=verbose; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "The bootstrap migrations fix has been verified."
    echo ""
    echo "Next steps:"
    echo "1. Commit the changes"
    echo "2. Deploy backend to Render"
    echo "3. Test mutations via frontend"
    echo "4. Monitor error logs"
    echo ""
else
    echo ""
    echo -e "${RED}================================${NC}"
    echo -e "${RED}✗ TESTS FAILED${NC}"
    echo -e "${RED}================================${NC}"
    echo ""
    echo "Please review the errors above."
    echo ""
    echo "Common issues:"
    echo "1. DATABASE_URL not set - set with: export DATABASE_URL=\"postgresql://...\""
    echo "2. Database not accessible - check connection string"
    echo "3. Migrations not applied - run: npm run db:push"
    echo ""
    exit 1
fi
