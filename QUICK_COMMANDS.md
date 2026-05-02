# Quick Reference - Build & Deployment Commands

Fast lookup for common build and deployment commands.

---

## Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Database](#database)
- [Build](#build)
- [Production](#production)
- [Docker](#docker)
- [Debugging](#debugging)

---

## Installation

```bash
# Fresh installation
cd project
npm install

# Clean reinstall
rm -rf node_modules package-lock.json
npm install
npm run typecheck

# Install specific dependency
npm install <package-name>

# Update all dependencies
npm update
```

---

## Development

```bash
# Start dev server (with hot reload)
npm run dev
# Access: http://localhost:5173

# Type checking only (no build)
npm run typecheck

# Format code with prettier
npx prettier --write .

# Lint check
npm run lint
```

---

## Database

### Migrations

```bash
# Apply migrations to database
npx prisma db push
npx prisma db push --skip-generate

# Create new migration
npx prisma migrate dev --name migration_name

# Check migration status
npx prisma migrate status

# View database schema
npx prisma studio
```

### Seeding

```bash
# Run seed script
npx tsx prisma/seed.ts

# Or with npm script (if configured)
npm run seed

# Reset database (⚠️ destructive!)
npx prisma db push --force-reset
```

### Database Verification

```bash
# Count records
node debug-counts.cjs

# Check connection
node check-db.cjs

# List all users
node list-users.cjs

# Verify login
node verify-login.cjs

# Verify new user
node verify-new-user.cjs
```

---

## Build

```bash
# Build for production
npm run build
# Output: ./build/

# Type check during build
npm run typecheck

# Check build size
du -sh build/
ls -lh build/

# Preview production build locally
npm run build
npm start
# Access: http://localhost:3000
```

---

## Production

### Run Production Server

```bash
# Standard npm start (port 3000)
npm start

# With custom port
PORT=8080 npm start

# With PM2 (recommended)
pm2 start npm --name "sirkp" -- start
pm2 logs sirkp
pm2 restart sirkp
pm2 stop sirkp
```

### Systemd Service

```bash
# Check status
sudo systemctl status sirkp

# Start service
sudo systemctl start sirkp

# Stop service
sudo systemctl stop sirkp

# Restart service
sudo systemctl restart sirkp

# View logs
sudo journalctl -u sirkp -f

# Enable on boot
sudo systemctl enable sirkp
```

---

## Docker

### Build & Run

```bash
# Build image
docker build -t sirkp-banting .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  sirkp-banting

# Run with docker-compose
docker-compose up -d
docker-compose down
```

### PostgreSQL Container

```bash
# Run PostgreSQL
docker run -d \
  --name sirkp-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:16-alpine

# Stop container
docker stop sirkp-postgres
docker start sirkp-postgres

# Remove container
docker rm sirkp-postgres
```

### Docker Compose Commands

```bash
# Start services
docker-compose up
docker-compose up -d          # Background

# Stop services
docker-compose down
docker-compose down -v        # Remove volumes

# View status
docker-compose ps
docker-compose logs
docker-compose logs -f app    # Follow logs

# Execute command
docker-compose exec app sh
docker-compose exec postgres psql -U postgres
```

---

## Debugging

### Environment & Version Check

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check installed dependencies
npm ls

# Print environment variables
printenv | grep DATABASE
echo $DATABASE_URL

# Check which npm packages are outdated
npm outdated
```

### Port Conflicts

```bash
# Find process using a port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Find process on Mac/Linux
lsof -i :3000
kill -9 <PID>

# Use different port temporarily
PORT=8080 npm run dev
```

### Database Debugging

```bash
# Test connection
psql $DATABASE_URL

# List all tables
psql $DATABASE_URL -c "\dt"

# Describe table
psql $DATABASE_URL -c "\d user"

# Count records in a table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"user\";"

# Query data
psql $DATABASE_URL -c "SELECT * FROM \"user\" LIMIT 5;"

# Export table to CSV
psql $DATABASE_URL -c "\COPY \"user\" TO 'users.csv' WITH CSV HEADER"
```

### Prisma Debugging

```bash
# Access Prisma Studio (live database editor)
npx prisma studio

# Regenerate Prisma client
npx prisma generate

# Check .prisma folder
ls -la node_modules/@prisma/client

# Debug queries
DEBUG=prisma* npm run dev
```

### TypeScript Debugging

```bash
# Type check only
npm run typecheck

# Check specific file
npx tsc --noEmit app/routes/api.auth.register.tsx

# Strict type checking
npx tsc --strict --noEmit
```

---

## Common Scenarios

### Deploy New Version to Production

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations
npx prisma db push --skip-generate

# 4. Build
npm run build

# 5. Restart service
pm2 restart sirkp
# OR
sudo systemctl restart sirkp
```

### Database Backup Before Update

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Or using docker
docker-compose exec postgres pg_dump -U postgres sir_kp_banting > backup.sql
```

### Test After Deployment

```bash
# Check server is running
curl http://localhost:3000

# Test API
curl http://localhost:3000/api/wilayah

# Check logs for errors
pm2 logs sirkp
# OR
sudo journalctl -u sirkp -f

# Verify database connection
node check-db.cjs
```

### Performance Optimization

```bash
# Analyze build size
npm run build
ls -lh build/

# Check dependency sizes
npm ls --depth=0

# Remove duplicate dependencies
npm dedupe

# Audit for security issues
npm audit
npm audit fix
```

---

## Environment Setup Reference

### .env File Template

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://postgres:password@localhost:5432/sir_kp_banting?schema=public"

# Application
NODE_ENV=development|production
PORT=3000

# Logging
DEBUG=
```

---

## npm Scripts Reference

From `package.json`:

```json
{
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc"
  }
}
```

---

## Emergency Commands

### Kill all Node processes

```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
killall node
```

### Force replace dist

```bash
rm -rf build/
npm run build
```

### Hard reset git state

```bash
git clean -fdx
git reset --hard origin/main
npm install
```

### Clear all Docker resources

```bash
# Remove stopped containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Remove dangling volumes
docker volume prune -f

# Full cleanup
docker system prune -a
```

---

## Performance Benchmarks

### Build Time

- Development: ~30 seconds (with hot reload)
- Production: ~2-5 minutes (first time), ~1 minute (cached)

### Startup Time

- Development server: ~5 seconds
- Production server: ~2-3 seconds

### Memory Usage

- Node process: ~150MB (idle), ~300MB (under load)
- Database: ~100MB (minimal query load)

---

## Support

Need help? Check:

1. **Logs**: Check error messages in console
2. **Database**: Verify PostgreSQL is running
3. **Environment**: Verify .env file settings
4. **Ports**: Check that ports 3000 and 5432 are available
5. **Dependencies**: Run `npm install` again

Full documentation: See `SETUP_COMPLETE.md` or `DOCKER_DEPLOYMENT.md`
