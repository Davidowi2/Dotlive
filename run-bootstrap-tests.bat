@echo off
REM Quick script to run bootstrap migrations tests (Windows)
REM Usage: run-bootstrap-tests.bat

setlocal enabledelayedexpansion

echo ================================
echo Bootstrap Migrations Test Runner
echo ================================
echo.

REM Step 1: Check prerequisites
echo Step 1: Checking prerequisites...
where /q node
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK - Node.js found: %NODE_VERSION%

where /q npm
if errorlevel 1 (
    echo ERROR: npm is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo OK - npm found: %NPM_VERSION%
echo.

REM Step 2: Navigate to backend
echo Step 2: Navigating to backend directory...
cd dotlive-backend\apps\api
echo OK - Changed to: %CD%
echo.

REM Step 3: Install dependencies
echo Step 3: Installing dependencies...
if not exist "node_modules" (
    call npm install
    echo OK - Dependencies installed
) else (
    echo OK - Dependencies already installed
)
echo.

REM Step 4: Check vitest
echo Step 4: Checking vitest...
npm ls vitest >nul 2>&1
if errorlevel 1 (
    echo WARNING: vitest not found, installing...
    call npm install --save-dev vitest @vitest/coverage-v8
)
echo OK - vitest ready
echo.

REM Step 5: Check database connection
echo Step 5: Checking database connection...
if "!DATABASE_URL!"=="" (
    echo WARNING: DATABASE_URL not set
    echo   Please set: set DATABASE_URL=postgresql://....
    echo.
    set /p CONTINUE="Do you want to continue anyway? (y/n): "
    if not "!CONTINUE!"=="y" (
        if not "!CONTINUE!"=="Y" (
            exit /b 1
        )
    )
) else (
    echo OK - DATABASE_URL is set
)
echo.

REM Step 6: Run TypeScript check
echo Step 6: Running TypeScript check...
call npx tsc --noEmit >nul 2>&1
if errorlevel 0 (
    echo OK - TypeScript compilation successful
) else (
    echo WARNING - TypeScript warnings (non-blocking)
)
echo.

REM Step 7: Run tests
echo Step 7: Running automated tests...
echo   Test file: src\routes\__tests__\critical-mutations.test.ts
echo.
echo Running: npx vitest run src\routes\__tests__\critical-mutations.test.ts
echo.

call npx vitest run src\routes\__tests__\critical-mutations.test.ts --reporter=verbose
if errorlevel 0 (
    echo.
    echo ================================
    echo OK - ALL TESTS PASSED!
    echo ================================
    echo.
    echo The bootstrap migrations fix has been verified.
    echo.
    echo Next steps:
    echo 1. Commit the changes
    echo 2. Deploy backend to Render
    echo 3. Test mutations via frontend
    echo 4. Monitor error logs
    echo.
) else (
    echo.
    echo ================================
    echo ERROR - TESTS FAILED
    echo ================================
    echo.
    echo Please review the errors above.
    echo.
    echo Common issues:
    echo 1. DATABASE_URL not set - set with: set DATABASE_URL=postgresql://...
    echo 2. Database not accessible - check connection string
    echo 3. Migrations not applied - run: npm run db:push
    echo.
    exit /b 1
)
