# 🏥 SiRKP Banting - Complete Setup & Deployment Guide

**SiRKP Banting** adalah sistem informasi registrasi kesehatan anak ibu untuk pemantauan pertumbuhan dan perkembangan anak secara komprehensif.

English: **SiRKP Banting** is a health information system for mothers to monitor child growth and development comprehensively.

---

## 📚 Documentation Index

### Quick Start (Choose One)

| Document                                                       | Purpose                       | Time   | Audience               |
| -------------------------------------------------------------- | ----------------------------- | ------ | ---------------------- |
| [PRE_INSTALLATION_CHECKLIST.md](PRE_INSTALLATION_CHECKLIST.md) | ✅ Verify system requirements | 10 min | Everyone               |
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md)                         | 📖 Complete setup guide       | 30 min | New installations      |
| [QUICK_COMMANDS.md](QUICK_COMMANDS.md)                         | ⚡ Command reference          | 5 min  | Experienced developers |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)                   | 🐳 Container deployment       | 20 min | Server/DevOps          |

### Installation

1. **First time?** → Read [PRE_INSTALLATION_CHECKLIST.md](PRE_INSTALLATION_CHECKLIST.md)
2. **Ready to install?** → Follow [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
3. **Need quick commands?** → Check [QUICK_COMMANDS.md](QUICK_COMMANDS.md)

### Deployment

1. **Local development?** → Use `npm run dev`
2. **Production server?** → See "Build & Production" in [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
3. **Docker/Container?** → Read [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## 🚀 Quick Start (5 minutes)

### For Experienced Developers

```bash
# 1. Clone and enter directory
cd project

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your PostgreSQL connection string:
# DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/sir_kp_banting?schema=public"

# 4. Setup database
npx prisma db push --skip-generate
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:5173

# Login with:
# Email: siti@parent.com
# Password: parent123
```

### For New Developers

**STOP!** Before running commands above:

1. ✅ Read [PRE_INSTALLATION_CHECKLIST.md](PRE_INSTALLATION_CHECKLIST.md) first (10 min)
2. ✅ Verify all requirements checked
3. ✅ Then follow [SETUP_COMPLETE.md](SETUP_COMPLETE.md) (30 min)

---

## 📋 System Requirements

| Component      | Minimum          | Recommended  | Notes                   |
| -------------- | ---------------- | ------------ | ----------------------- |
| **Node.js**    | v20              | v24.11.1     | Check: `node --version` |
| **npm**        | v9               | v10+         | Check: `npm --version`  |
| **PostgreSQL** | v14              | v16 (Alpine) | Check: `psql --version` |
| **RAM**        | 2GB              | 4GB          | More for production     |
| **Disk**       | 2GB              | 5GB          | Includes dependencies   |
| **Ports**      | 3000, 5173, 5432 | -            | Must be available       |

**Full details:** See [SETUP_COMPLETE.md - System Requirements](SETUP_COMPLETE.md#system-requirements)

---

## 🔧 Installation Methods

### Option 1: Automated Setup (Recommended for Windows)

```bash
# Run setup script
setup.bat

# Or on Mac/Linux:
bash setup.sh
```

**Advantages:**

- ✅ Checks for required software automatically
- ✅ Handles all installation steps
- ✅ Provides guided configuration
- ✅ Shows summary at end

### Option 2: Manual Setup (Full Control)

Follow step-by-step instructions in [SETUP_COMPLETE.md](SETUP_COMPLETE.md):

1. [Database Setup](SETUP_COMPLETE.md#database-setup)
2. [Environment Configuration](SETUP_COMPLETE.md#environment-configuration)
3. [Installation & Dependencies](SETUP_COMPLETE.md#installation--dependencies)
4. [Database Migration & Seeding](SETUP_COMPLETE.md#database-migration--seeding)

### Option 3: Docker Container (Best for Servers)

```bash
# Using docker-compose
docker-compose up -d

# Access at http://localhost:3000
```

**Advantages:**

- ✅ No local PostgreSQL installation needed
- ✅ Consistent environment across machines
- ✅ Easy to scale and manage
- ✅ Perfect for production

**See:** [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## 🎯 Common Tasks

### Verify Installation

```bash
# Check if everything is working
npm run build
npm run typecheck

# Or run individual checks in this order:
node --version                    # Should be v20+
npm --version                     # Should be v9+
psql --version                    # Should be 14+
npm ls                           # Should list packages

# Database check
node check-db.cjs                # Test connection
node debug-counts.cjs            # Show record counts
```

### Start Development

```bash
npm run dev
# Open http://localhost:5173
# HMR enabled - changes auto-reload
```

### Create Production Build

```bash
# Build
npm run build

# Run locally
npm start
# Open http://localhost:3000

# Or deploy to server
# See "Production Server" in SETUP_COMPLETE.md
```

### Database Management

```bash
# View database in GUI
npx prisma studio

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Execute migration
npx prisma db push

# Check migration status
npx prisma migrate status

# Seed initial data
npx tsx prisma/seed.ts
```

**More commands:** See [QUICK_COMMANDS.md](QUICK_COMMANDS.md)

---

## 🗂️ Project Structure

```
project/
├── app/
│   ├── routes/              # Page routes & API endpoints
│   ├── components/          # React components
│   ├── styles/              # CSS & theming
│   ├── utils/               # Database, auth, utilities
│   └── db/                  # Database services
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Initial data
│   └── migrations/          # Migration history
├── docs/                    # Additional documentation
├── public/                  # Static files (images)
├── build/                   # Production build (after npm run build)
├── SETUP_COMPLETE.md        # Complete installation guide
├── DOCKER_DEPLOYMENT.md     # Docker setup
├── QUICK_COMMANDS.md        # Command reference
├── PRE_INSTALLATION_CHECKLIST.md  # Pre-setup checklist
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── .env.example             # Environment template
├── setup.bat                # Windows setup script
└── setup.sh                 # Mac/Linux setup script
```

---

## 🔐 Initial Login Credentials

After seeding, these accounts are available:

| Role       | Email              | Password     | Wilayah            | Purpose                 |
| ---------- | ------------------ | ------------ | ------------------ | ----------------------- |
| **Parent** | siti@parent.com    | parent123    | Desa Banting Kidul | Monitor child           |
| **Parent** | john@parent.com    | parent123    | Desa Banting Utara | Monitor child           |
| **Cadre**  | aminah@cadre.com   | cadre123     | Desa Banting Kidul | Community health worker |
| **Admin**  | budi@puskesmas.com | puskesmas123 | Puskesmas Banting  | System administrator    |

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

**Default Region (Wilayah) Options:**

- Desa Banting Kidul
- Desa Banting Utara
- Desa Banting Timur
- Kelurahan Banting Barat
- Kelurahan Banting Tengah

---

## 🐛 Troubleshooting

### Installation Issues

| Problem                      | Solution                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------- |
| "npm not found"              | Install Node.js from nodejs.org                                                   |
| "PostgreSQL not running"     | See [SETUP_COMPLETE.md](SETUP_COMPLETE.md#option-a-local-postgresql-installation) |
| "Port already in use"        | Check [QUICK_COMMANDS.md - Port Conflicts](QUICK_COMMANDS.md#port-conflicts)      |
| "Database connection failed" | Verify DATABASE_URL in .env file                                                  |
| TypeScript errors            | Run `npm run typecheck` to see errors                                             |

**More solutions:** See [SETUP_COMPLETE.md - Troubleshooting](SETUP_COMPLETE.md#troubleshooting)

### Runtime Issues

| Problem         | Solution                       |
| --------------- | ------------------------------ |
| Can't login     | Check seeded users above       |
| Database empty  | Run `npx tsx prisma/seed.ts`   |
| Page crashes    | Check browser console (F12)    |
| API returns 404 | Verify route exists in routes/ |

---

## 📦 Technology Stack

### Backend

- **Node.js** v24.11.1
- **React Router** 7.13.0 (SSR)
- **Prisma** 6.2.1 (ORM)
- **PostgreSQL** 16 (Database)
- **TypeScript** 5.9.3

### Frontend

- **React** 19.2.4
- **React Router** 7.13.0
- **Radix UI** (Components)
- **CSS Modules** (Styling)
- **Recharts** (Data visualization)
- **React Hook Form** (Forms)

### Features

- ✅ Server-side rendering (SSR)
- ✅ Role-based access control (3 roles)
- ✅ JWT authentication
- ✅ Z-score calculations (WHO standards)
- ✅ Child growth tracking
- ✅ Immunization records
- ✅ Multi-language support (Indonesian)
- ✅ Responsive mobile design

---

## 🚢 Deployment Options

### Development

```bash
npm run dev
# http://localhost:5173
# Hot reload enabled
```

### Production (Local)

```bash
npm run build
npm start
# http://localhost:3000
```

### Production (Linux Server with PM2)

```bash
npm run build
pm2 start npm --name "sirkp" -- start
pm2 save
# Application runs in background
```

### Production (Docker)

```bash
docker-compose up -d
# http://localhost:3000
# Full stack: postgres + app
```

**Detailed instructions:** [SETUP_COMPLETE.md - Build & Deployment](SETUP_COMPLETE.md#build--deployment)

---

## 📖 Environment Variables

### Required

```bash
# PostgreSQL connection string (MUST be set)
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/sir_kp_banting?schema=public"
```

### Optional

Tidak ada variabel tambahan wajib selain `DATABASE_URL`, `NODE_ENV`, dan `PORT`.

### Application

```bash
NODE_ENV=development|production
PORT=3000
```

**Full reference:** [SETUP_COMPLETE.md - Environment Configuration](SETUP_COMPLETE.md#environment-configuration)

---

## 🔍 Database Schema

### Key Tables

- **users**: Login accounts (roles: orang_tua, kader, puskesmas)
- **anak**: Children being monitored
- **pertumbuhan**: Growth measurements with z-scores
- **wilayah**: Geographic regions (desa, kelurahan, puskesmas)
- **who_reference**: WHO growth standard data for z-score calculations

### Important Fields

- **z-scores**: Height/Age, Weight/Age, Weight/Height (TB/U, BB/U, BB/TB)
- **kategori**: Nutrition status (Stunted, Underweight, Overweight, etc.)
- **wilayah_id**: Links users to their region
- **role**: Access level (determines what user can see/do)

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] PostgreSQL database created and accessible
- [ ] .env file configured with real credentials
- [ ] NODE_ENV set to "production"
- [ ] All npm packages installed: `npm install`
- [ ] Database migrations applied: `npx prisma db push --skip-generate`
- [ ] Initial seed data loaded: `npx tsx prisma/seed.ts`
- [ ] Build succeeds without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Application starts: `npm start` (no errors in console)
- [ ] Test login with seeded credentials
- [ ] Backup strategy documented
- [ ] Monitoring/logging configured
- [ ] Change default credentials
- [ ] SSL/TLS enabled (if public-facing)

---

## 🆘 Getting Help

### Documentation

1. **Installation issues?** → [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
2. **Need commands?** → [QUICK_COMMANDS.md](QUICK_COMMANDS.md)
3. **For containers?** → [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
4. **Pre-setup?** → [PRE_INSTALLATION_CHECKLIST.md](PRE_INSTALLATION_CHECKLIST.md)

### External Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **React Router**: https://reactrouter.com/
- **Prisma**: https://www.prisma.io/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **TypeScript**: https://www.typescriptlang.org/docs/

### Debug Steps

1. Check error messages in console
2. Verify database connection: `node check-db.cjs`
3. Check database records: `node debug-counts.cjs`
4. Verify environment variables: `echo $DATABASE_URL`
5. Try clean install: `rm -rf node_modules && npm install`

---

## 📝 Version Information

**Project Version**: 1.0  
**Last Updated**: April 2026  
**Tested On**: Node.js v24.11.1, PostgreSQL 16, npm v10+

---

## 🎓 Next Steps After Setup

1. ✅ **Installation Complete**
   - System running on http://localhost:5173 (dev) or http://localhost:3000 (prod)

2. 🔍 **Explore Application**
   - Try logging in with test accounts
   - Add test child records
   - Check all three roles (parent, cadre, admin)

3. 🎨 **Customize**
   - Update branding in `app/styles/theme.css`
   - Add organization logo in `public/`
   - Update color scheme

4. 👥 **Add Users**
   - Create real user accounts
   - Import wilayah data
   - Train end-users

5. 🚀 **Deploy**
   - Set up production PostgreSQL database
   - Configure SSL/TLS
   - Deploy to production server
   - Set up monitoring and backups

6. 📊 **Monitor**
   - Track database size
   - Monitor application logs
   - Review user analytics
   - Plan scaling strategy

---

## 💡 Tips & Best Practices

### Development

- Use `npm run dev` for development with hot reload
- Keep browser DevTools open (F12) for debugging
- Use TypeScript for type safety
- Test on mobile viewport (responsive design)

### Production

- Always back up database before updates
- Use PM2 or systemd for process management
- Enable SSL/TLS for data security
- Monitor server resources
- Set up automated backup schedule

### Database

- Regularly vacuum PostgreSQL: `VACUUM ANALYZE`
- Create appropriate indexes for queries
- Monitor query performance
- Archive old data periodically
- Keep migrations in version control

---

## 📞 Support Contacts

For technical support or questions:

1. Check documentation files in this project
2. Review troubleshooting section of setup guide
3. Search GitHub issues or Stack Overflow
4. Contact development team if available

---

**That's it! You're ready to get started. Read the appropriate guide above and follow the steps. For best results, start with the Quick Start or follow the automated setup script.**

🎉 **Happy coding!**

---

## Document Reference

| Document                                                                     | Purpose                                    | Read Time |
| ---------------------------------------------------------------------------- | ------------------------------------------ | --------- |
| [PRE_INSTALLATION_CHECKLIST.md](PRE_INSTALLATION_CHECKLIST.md)               | System requirements verification           | 10 min    |
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md)                                       | Complete installation and deployment guide | 30 min    |
| [QUICK_COMMANDS.md](QUICK_COMMANDS.md)                                       | Command reference for common tasks         | 5 min     |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)                                 | Container and production deployment        | 20 min    |
| README.md                                                                    | This file - overview and index             | 10 min    |
| [docs/SETUP_DATABASE.md](docs/SETUP_DATABASE.md)                             | Database-specific documentation            | 10 min    |

**📌 Bookmark this page for future reference!**
