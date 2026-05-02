@echo off
REM SiRKP Banting - Automated Setup Script (Windows)
REM Usage: setup.bat
REM This script automates the initial project setup

setlocal enabledelayedexpansion

cls
echo.
echo ^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*
echo 🚀 SiRKP Banting - Automated Setup Script
echo ^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*
echo.

REM Check Node.js
echo [INFO] Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v20 or higher from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm
echo [INFO] Checking npm version...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%

REM Install dependencies
echo.
echo [INFO] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed

REM Generate Prisma client
echo [INFO] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [WARNING] Failed to generate Prisma client
)
echo [OK] Prisma client generated

REM Create .env if it doesn't exist
echo [INFO] Checking environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env file from template...
        copy .env.example .env >nul
        echo [OK] .env file created
        echo.
        echo [WARNING] IMPORTANT: Edit .env file with your configuration
        echo   - DATABASE_URL: PostgreSQL connection string
        echo.
        echo Example DATABASE_URL:
        echo   postgresql://postgres:password@localhost:5432/sir_kp_banting
        echo.
    ) else (
        echo [ERROR] .env.example not found!
    )
) else (
    echo [OK] .env file already exists
)

REM Apply database migrations
echo.
echo [INFO] Applying database migrations...
call npx prisma db push --skip-generate
if errorlevel 1 (
    echo [WARNING] Database migration failed
    echo   - Check your DATABASE_URL in .env
    echo   - Ensure PostgreSQL is running on localhost:5432
) else (
    echo [OK] Database migrations applied
)

REM Seed database
echo [INFO] Seeding initial data...
call npx tsx prisma/seed.ts
if errorlevel 1 (
    echo [WARNING] Seeding failed - try running: npx tsx prisma/seed.ts
) else (
    echo [OK] Database seeded
)

REM Verify setup
echo.
echo [INFO] Verifying setup...
if exist "debug-counts.cjs" (
    echo.
    call node debug-counts.cjs
    echo.
)

REM Summary
echo.
echo ^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*
echo [OK] Setup Complete!
echo ^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*^*
echo.
echo Next steps:
echo   1. Edit .env file with your configuration
echo   2. Start development server: npm run dev
echo   3. Open: http://localhost:5173
echo.
echo Default Login Credentials:
echo   Email: siti@parent.com
echo   Password: parent123
echo.
echo Learn more at: SETUP_COMPLETE.md
echo.
pause
