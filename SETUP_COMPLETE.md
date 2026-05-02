# 🚀 Complete Project Setup Guide - SiRKP Banting

This guide provides comprehensive instructions to build and deploy the SiRKP Banting application on any machine or server.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Build & Deployment](#build--deployment)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **Node.js**: v20 or higher (v24.11.1 recommended)
- **npm**: v9 or higher
- **Database**: PostgreSQL 14+ (local install or Docker)
- **RAM**: 2GB minimum
- **Disk Space**: 1GB for project + dependencies

### Required Tools

- **Git**: For version control
- **PostgreSQL**: Database server (or Docker/Podman for containerized deployment)
- **Text Editor**: VS Code, WebStorm, or similar

---

## Quick Start

For experienced developers, here's the 5-minute setup:

```bash
# 1. Clone repository and install dependencies
git clone <your-repo>
cd SiRKPBanting/project
npm install

# 2. Create .env file (copy template and edit)
cp .env.example .env
# Edit .env with your PostgreSQL connection

# 3. Setup database (PostgreSQL must be running)
npx prisma migrate deploy    # Apply migrations
npx tsx prisma/seed.ts       # Seed initial data

# 4. Run development server
npm run dev

# Visit: http://localhost:5173
```

---

## Detailed Setup

### Option A: Local PostgreSQL Installation

#### Windows

```bash
# 1. Download PostgreSQL installer
# Visit: https://www.postgresql.org/download/windows/

# 2. Install with default settings:
#    - Port: 5432
#    - Password: (remember this!)
#    - Add to PATH: Yes

# 3. Verify installation
psql --version
psql -U postgres -c "SELECT version();"
```

#### macOS

```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Verify
psql --version
```

#### Linux (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version
```

### Option B: PostgreSQL via Docker/Podman (Recommended for Servers)

#### Using Docker

```bash
# Create a PostgreSQL container
docker run --name sirkp-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=sir_kp_banting \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:16-alpine

# Verify container is running
docker ps | grep postgres
```

#### Using Podman (Linux/Windows WSL)

```bash
# Create PostgreSQL container
podman run --name sirkp-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=sir_kp_banting \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:16-alpine

# Verify
podman ps | grep postgres

# Check logs if needed
podman logs sirkp-postgres
```

---

## Database Setup

### Create Database

#### Using psql (Command line)

```bash
# Connect to PostgreSQL
psql -U postgres -h 127.0.0.1

# Create database
CREATE DATABASE sir_kp_banting;

# Verify
\l

# Exit
\q
```

#### Using GUI (pgAdmin)

1. Install pgAdmin from https://www.pgadmin.org/
2. Login to pgAdmin web interface
3. Create new server: `localhost:5432`
4. Create database: `sir_kp_banting`

### Database Connection String

Your connection string format:

```
postgresql://username:password@host:port/database_name?schema=public
```

Examples:

```bash
# Local development
postgresql://postgres:yourpassword@127.0.0.1:5432/sir_kp_banting?schema=public

# Docker container
postgresql://postgres:yourpassword@localhost:5432/sir_kp_banting?schema=public

# Production server
postgresql://app_user:secure_password@prod-db.example.com:5432/sir_kp_banting?schema=public
```

---

## Environment Configuration

### Step 1: Create .env File

```bash
cd project
cp .env.example .env
```

### Step 2: Edit .env with Your Values

**`project/.env`**

```bash
# ============================
# DATABASE
# ============================
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:your_password@127.0.0.1:5432/sir_kp_banting?schema=public"

# ============================
# APPLICATION (Optional)
# ============================
NODE_ENV=development
```

### Step 3: Verify Connection

```bash
# Test PostgreSQL connection
psql "postgresql://postgres:your_password@127.0.0.1:5432/sir_kp_banting"

# You should see the psql prompt:
# sir_kp_banting=#

# Exit
\q
```

---

## Installation & Dependencies

### Install Dependencies

```bash
cd project

# Clean install (recommended for new setup)
rm -rf node_modules package-lock.json
npm install

# Or quick install
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Verify Installation

```bash
# Check versions
node --version          # Should be v20+
npm --version           # Should be v9+
npx prisma --version    # Should be 6.2.1

# List installed dependencies
npm ls
```

---

## Database Migration & Seeding

### Step 1: Apply Database Migrations

```bash
# Create or update database schema
npx prisma db push --skip-generate

# Output should show:
# "The database is already in sync with your Prisma schema"
# OR
# "Created X new tables..."
```

### Step 2: Seed Initial Data

```bash
# Seed all data (users, wilayah, WHO reference, etc.)
npx tsx prisma/seed.ts

# Output should show:
# ✅ Wilayah seeded.
# ✅ Users seeded.
```

### Step 3: Verify Database

```bash
# Check database contents
node debug-counts.cjs

# Output should show existing records
# WHO Reference count: 28
# User count: 4
# etc.
```

### Seed Data Included

After seeding, your database will have:

**Users (Login Credentials)**
| Role | Email | Password | Wilayah |
|------|-------|----------|---------|
| Admin (Puskesmas) | budi@puskesmas.com | puskesmas123 | Puskesmas Banting |
| Cadre (Kader) | aminah@cadre.com | cadre123 | Desa Banting Kidul |
| Parent | siti@parent.com | parent123 | Desa Banting Kidul |
| Parent | john@parent.com | parent123 | Desa Banting Utara |

**Wilayah (Regions) - 5 Options**

- Desa Banting Kidul
- Desa Banting Utara
- Desa Banting Timur
- Kelurahan Banting Barat
- Kelurahan Banting Tengah

**Initial Data**

- 28 WHO growth reference records (for z-score calculations)
- 2 sample growth records (pertumbuhan)
- 2 sample children (anak)

---

## Build & Deployment

### Development Server

```bash
# Start development server with hot reload
npm run dev

# Server will start at:
# http://localhost:5173

# Features:
# - Hot Module Replacement (HMR)
# - Source maps for debugging
# - CSS hot reload
# - TypeScript checking
```

### Type Checking

```bash
# Check TypeScript errors (without building)
npm run typecheck

# Recommended before committing code
```

### Production Build

```bash
# Build for production
npm run build

# Build output:
# - Server code: ./build/server/
# - Client code: ./build/client/
# - Compressed assets
# - Optimized for performance

# Build time: ~2-5 minutes
# Output size: ~15-20MB (with node_modules)
```

### Production Server

#### Option 1: Using npm start

```bash
# Start production server
npm run start

# Server runs at:
# http://localhost:3000
```

#### Option 2: Using PM2 (Recommended for Linux/Server)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "sirkp" -- start

# View logs
pm2 logs sirkp

# Monitor
pm2 monit

# Restart on reboot
pm2 startup
pm2 save
```

#### Option 3: Using systemd (Linux Server)

Create `/etc/systemd/system/sirkp.service`:

```ini
[Unit]
Description=SiRKP Banting Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sirkp-banting/project
EnvironmentFile=/opt/sirkp-banting/project/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable sirkp
sudo systemctl start sirkp
sudo systemctl status sirkp
```

#### Option 4: Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t sirkp-banting .
docker run -p 3000:3000 --env-file .env sirkp-banting
```

---

## Deployment Checklist

Before deploying to production, verify:

- [ ] PostgreSQL database is running and accessible
- [ ] .env file has correct DATABASE_URL
- [ ] NODE_ENV=production in .env
- [ ] Database migrations applied: `npx prisma db push --skip-generate`
- [ ] Initial seed data loaded: `npx tsx prisma/seed.ts`
- [ ] Production build successful: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] All dependencies installed: `npm install`
- [ ] Application starts without errors: `npm run start`

---

## Testing & Verification

### Test Development Server

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
# http://localhost:5173

# 3. Test login
# Email: siti@parent.com
# Password: parent123

# 4. Check console for errors
# Press F12 → Console tab
```

### Test Database Connection

```bash
# Run database check script
node check-db.cjs

# Or test users
node list-users.cjs

# Or verify login
node verify-login.cjs
```

### Test API Endpoints

```bash
# Get wilayah list (regions)
curl http://localhost:5173/api/wilayah

# Should return:
# [
#   {"id":"desa-id-1","nama_wilayah":"Desa Banting Kidul","tipe":"desa"},
#   ...
# ]
```

---

## Project Structure

```
project/
├── app/
│   ├── components/          # React components
│   ├── routes/              # Page routes and API endpoints
│   ├── styles/              # Global styles and theming
│   ├── utils/               # Utility functions (auth, db, etc.)
│   ├── db/                  # Database services
│   ├── hooks/               # React hooks
│   └── data/                # Static data
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Initial seeding script
│   └── migrations/          # Database migration history
├── docs/                    # Documentation
├── public/                  # Static files (images, etc.)
├── build/                   # Production build output (after npm run build)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── .env                     # Environment variables (create from .env.example)
```

---

## Key Features & Technology Stack

### Backend

- **Runtime**: Node.js v24+
- **Framework**: React Router 7.13
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.2.1
- **Authentication**: JWT + bcryptjs
- **API**: RESTful endpoints

### Frontend

- **Library**: React 19
- **Framework**: React Router 7.13 (SSR)
- **Styling**: CSS Modules + Radix UI
- **Forms**: React Hook Form
- **Charts**: Recharts
- **UI Components**: Radix UI + custom built

### Features

- ✅ Role-based access control (3 roles: Parents, Cadre, Puskesmas)
- ✅ Child growth tracking with WHO z-score calculation
- ✅ Immunization records management
- ✅ Regional (Wilayah) management
- ✅ Multi-language support (Indonesian)
- ✅ Responsive mobile design
- ✅ Row-level security (RLS) support

---

## Environment Variables Reference

### Required

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db_name
```

### Optional

Tidak ada environment variable tambahan wajib selain `DATABASE_URL` dan `NODE_ENV`.

### Application

```bash
NODE_ENV=development|production
```

---

## Troubleshooting

### Issue: "Cannot find module 'react-router'"

**Solution:**

```bash
npm install
npx prisma generate
npm run typecheck
```

### Issue: PostgreSQL Connection Error

**Check:**

```bash
# Test connection
psql -U postgres -h 127.0.0.1

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Check PostgreSQL is running
# Windows: Services app → PostgreSQL Server
# Linux: sudo systemctl status postgresql
# Docker: docker ps | grep postgres
```

### Issue: "The database is not in sync with your Prisma schema"

**Solution:**

```bash
# Backup first (if production)
# Then push migrations
npx prisma db push
npx prisma generate
npm run typecheck
```

### Issue: Seed script fails

**Solution:**

```bash
# Check database schema is created
npx prisma db push

# Run seed again
npx tsx prisma/seed.ts

# If still fails, check migration status
npx prisma migrate status
```

### Issue: Build fails with TypeScript errors

**Solution:**

```bash
# Check types
npm run typecheck

# Fix errors shown, then:
npm run build

# If specific file has issues:
npx tsc --noEmit
```

### Issue: Port 5173 already in use

**Solution - Windows:**

```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 5174
```

**Solution - Linux:**

```bash
# Find process
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

### Issue: "wilayah_id does not exist" during user creation

**Solution:**

```bash
# Ensure wilayah table is seeded
npx prisma db push

# Seed data
npx tsx prisma/seed.ts

# Verify
node verify-new-user.cjs
```

### Issue: Build size too large

**Solution:**

```bash
# Analyze bundle
npm run build

# Check build output size
ls -lh build/

# Production build should be compressed automatically
```

---

## Performance Optimization

### Development

- HMR enabled for instant updates
- Source maps for debugging
- TypeScript incremental compilation

### Production

- Minified and tree-shaken
- CSS modules extracted
- Assets optimized
- Gzip compression ready

### Database

- Indexes on frequently-queried columns
- Pagination implemented for list views
- Connection pooling with Prisma

---

## Security Notes

1. **Environment Variables**
   - Never commit `.env` to version control
   - Use `.env.example` for documentation
   - Rotate credentials regularly

2. **Database**
   - Use strong PostgreSQL passwords
   - Enable SSL connections in production
   - Restrict database access by IP

3. **Authentication**
   - JWT tokens validated on every request
   - Password hashed with bcryptjs
   - Role-based authorization enforced

4. **API**
   - CORS configured for same-domain requests
   - No sensitive data in URLs
   - Input validation on all endpoints

---

## Support & Debugging

### Enable Debug Logging

```bash
# Set debug environment
DEBUG=* npm run dev

# Or for specific modules
DEBUG=prisma* npm run dev
```

### Check Application Logs

```bash
# Development
npm run dev
# Logs print to console

# Production (with PM2)
pm2 logs sirkp

# Production (with systemd)
sudo journalctl -u sirkp -f
```

### Database Debugging

```bash
# Check all database tables
psql sir_kp_banting -c "\dt"

# Query user count
psql sir_kp_banting -c "SELECT COUNT(*) FROM \"user\";"

# Export data for inspection
psql sir_kp_banting -c "\COPY \"user\" TO 'users.csv' WITH CSV HEADER"
```

---

## Additional Resources

- **React Router Docs**: https://reactrouter.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

## Quick Commands Reference

```bash
# Installation
npm install                           # Install dependencies
npx prisma generate                  # Generate Prisma client

# Database
npx prisma db push                    # Apply migrations
npx prisma migrate status             # Check migration status
npx tsx prisma/seed.ts               # Seed initial data

# Development
npm run dev                           # Start dev server (port 5173)
npm run typecheck                     # Check TypeScript errors

# Production
npm run build                         # Build for production
npm start                             # Start production server (port 3000)

# Debugging
node debug-counts.cjs                # Check database record counts
node check-db.cjs                    # Test database connection
node list-users.cjs                  # List all users
node verify-login.cjs                # Test login

# Testing
npm run test                          # Run tests (if configured)
```

---

## Version Information (Working Configuration)

- **Node.js**: v24.11.1
- **npm**: Latest (v10+)
- **React**: 19.2.4
- **React Router**: 7.13.0
- **Prisma**: 6.2.1
- **PostgreSQL**: 16 (Alpine recommended)
- **TypeScript**: 5.9.3

---

## Next Steps After Setup

1. ✅ Create database and apply migrations
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Seed initial data
5. ✅ Start development server
6. 🔄 Create additional wilayah records (regions) as needed
7. 🔄 Customize styling and branding in `app/styles/theme.css`
8. 🔄 Add your organization's users
9. 🔄 Deploy to production

---

## Getting Help

If issues persist:

1. **Check logs** for error messages
2. **Verify environment** (.env file, NODE_ENV, etc.)
3. **Test database** connection separately
4. **Check PostgreSQL** version and availability
5. **Review schema** with `npx prisma studio`

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Project**: SiRKP Banting - Child Growth Monitoring System
