#!/bin/bash
# SiRKP Banting - Automated Setup Script
# Usage: ./setup.sh or bash setup.sh
# This script automates the initial project setup

set -e

echo "🚀 SiRKP Banting - Automated Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js
print_info "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js v20 or higher from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
print_status "Node.js found: $NODE_VERSION"

# Check npm
print_info "Checking npm version..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_status "npm found: $NPM_VERSION"

# Check PostgreSQL connection
print_info "Checking PostgreSQL connection..."
read -p "PostgreSQL user (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

# Try to connect to PostgreSQL
if command -v psql &> /dev/null; then
    if psql -U "$DB_USER" -h 127.0.0.1 -c "SELECT 1" &> /dev/null; then
        print_status "PostgreSQL connection successful"
    else
        print_warning "PostgreSQL not accessible at localhost:5432"
        print_info "Make sure PostgreSQL is running"
    fi
else
    print_warning "psql not found in PATH - skipping validation"
fi

# Install dependencies
print_info "Installing dependencies..."
npm install
print_status "Dependencies installed"

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env file created (please edit with your database credentials)"
        print_warning "IMPORTANT: Edit .env file with your PostgreSQL connection string"
        print_warning "DATABASE_URL=\"postgresql://user:password@localhost:5432/sir_kp_banting\""
    else
        print_error ".env.example not found!"
    fi
else
    print_status ".env file already exists"
fi

# Apply database migrations
print_info "Applying database migrations..."
if npx prisma db push --skip-generate; then
    print_status "Database migrations applied"
else
    print_warning "Database migration failed - check your DATABASE_URL in .env"
fi

# Seed database
print_info "Seeding initial data..."
if npx tsx prisma/seed.ts; then
    print_status "Database seeded"
else
    print_warning "Seeding failed - try running: npx tsx prisma/seed.ts"
fi

# Verify setup
print_info "Verifying setup..."
if [ -f "debug-counts.cjs" ]; then
    echo ""
    node debug-counts.cjs
    echo ""
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Start development server: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
echo "🔐 Default Login Credentials:"
echo "  Email: siti@parent.com"
echo "  Password: parent123"
echo ""
echo "📚 Learn more at: docs/SETUP_COMPLETE.md"
echo ""
