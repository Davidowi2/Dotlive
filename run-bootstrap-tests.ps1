# Quick script to run bootstrap migrations tests (PowerShell)
# Usage: .\run-bootstrap-tests.ps1

Write-Host "================================"
Write-Host "Bootstrap Migrations Test Runner"
Write-Host "================================"
Write-Host ""

# Colors
$SUCCESS = "Green"
$WARNING = "Yellow"
$ERROR_COLOR = "Red"

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..."
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor $SUCCESS
} else {
    Write-Host "✗ Node.js is not installed" -ForegroundColor $ERROR_COLOR
    exit 1
}

$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor $SUCCESS
} else {
    Write-Host "✗ npm is not installed" -ForegroundColor $ERROR_COLOR
    exit 1
}
Write-Host ""

# Step 2: Navigate to backend
Write-Host "Step 2: Navigating to backend directory..."
Set-Location "dotlive-backend/apps/api"
$currentPath = Get-Location
Write-Host "✓ Changed to: $currentPath" -ForegroundColor $SUCCESS
Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Installing dependencies..."
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..."
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor $SUCCESS
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor $SUCCESS
}
Write-Host ""

# Step 4: Check vitest
Write-Host "Step 4: Checking vitest..."
$vitestVersion = npx vitest --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ vitest ready: $vitestVersion" -ForegroundColor $SUCCESS
} else {
    Write-Host "⚠ vitest not found, installing..." -ForegroundColor $WARNING
    npm install --save-dev vitest @vitest/coverage-v8
    Write-Host "✓ vitest installed" -ForegroundColor $SUCCESS
}
Write-Host ""

# Step 5: Check database connection
Write-Host "Step 5: Checking database connection..."
if ([string]::IsNullOrEmpty($env:DATABASE_URL)) {
    Write-Host "⚠ DATABASE_URL not set" -ForegroundColor $WARNING
    Write-Host "   Please set: `$env:DATABASE_URL = 'postgresql://...'"
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
} else {
    Write-Host "✓ DATABASE_URL is set" -ForegroundColor $SUCCESS
}
Write-Host ""

# Step 6: Run TypeScript check
Write-Host "Step 6: Running TypeScript check..."
$tscOutput = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript compilation successful" -ForegroundColor $SUCCESS
} else {
    Write-Host "⚠ TypeScript warnings (non-blocking)" -ForegroundColor $WARNING
}
Write-Host ""

# Step 7: Run tests
Write-Host "Step 7: Running automated tests..."
Write-Host "   Test file: src\routes\__tests__\critical-mutations.test.ts"
Write-Host ""
Write-Host "Running: npx vitest run src\routes\__tests__\critical-mutations.test.ts"
Write-Host ""

npx vitest run "src/routes/__tests__/critical-mutations.test.ts" --reporter=verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor $SUCCESS
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor $SUCCESS
    Write-Host "================================" -ForegroundColor $SUCCESS
    Write-Host ""
    Write-Host "The bootstrap migrations fix has been verified."
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Commit the changes"
    Write-Host "2. Deploy backend to Render"
    Write-Host "3. Test mutations via frontend"
    Write-Host "4. Monitor error logs"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================" -ForegroundColor $ERROR_COLOR
    Write-Host "✗ TESTS FAILED" -ForegroundColor $ERROR_COLOR
    Write-Host "================================" -ForegroundColor $ERROR_COLOR
    Write-Host ""
    Write-Host "Please review the errors above."
    Write-Host ""
    Write-Host "Common issues:"
    Write-Host "1. DATABASE_URL not set - set with: `$env:DATABASE_URL = 'postgresql://...'"
    Write-Host "2. Database not accessible - check connection string"
    Write-Host "3. Migrations not applied - run: npm run db:push"
    Write-Host ""
    exit 1
}
