# 📋 Pre-Installation Checklist - SiRKP Banting

Complete this checklist before starting installation to ensure smooth setup.

---

## System Requirements Verification

### Operating System

- [ ] Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- [ ] 64-bit architecture
- [ ] Administrator/sudo access available

### Hardware Requirements

- [ ] RAM: 2GB minimum (4GB recommended for development)
- [ ] Disk Space: 2GB available for project + dependencies
- [ ] Network: Internet connection (for npm package downloads)
- [ ] CPU: Dual-core processor minimum

### Internet & Network

- [ ] Stable internet connection available
- [ ] Can download ~500MB of npm packages
- [ ] Can access npm registry (npmjs.com)
- [ ] Can access GitHub (if cloning via git)
- [ ] Port 3000 available (for dev server)
- [ ] Port 5432 available (for PostgreSQL)

---

## Software Prerequisites

### Required Software

#### Node.js & npm

- [ ] Node.js v20+ installed
  - **Check**: Open terminal, run `node --version`
  - **Result**: Should show v20.x.x or higher
  - **Download**: https://nodejs.org/ (LTS version recommended)

- [ ] npm v9+ installed
  - **Check**: Open terminal, run `npm --version`
  - **Result**: Should show 9.x.x or higher
  - **Note**: npm comes with Node.js, no separate installation needed

#### PostgreSQL 14+

- [ ] PostgreSQL database server installed and running
  - **Check**: Open terminal, run `psql --version`
  - **Result**: Should show PostgreSQL version 14 or higher
  - **Download Options**:
    - Windows: https://www.postgresql.org/download/windows/
    - macOS: `brew install postgresql@16`
    - Linux: `sudo apt-get install postgresql postgresql-contrib`
    - Docker/Podman: See DOCKER_DEPLOYMENT.md

- [ ] PostgreSQL service is running
  - **Windows**: Check Services ("PostgreSQL Server" should be running)
  - **macOS**: `brew services list | grep postgresql`
  - **Linux**: `sudo systemctl status postgresql`
  - **Docker**: `docker ps | grep postgres`

#### Git (Optional, for cloning repo)

- [ ] Git installed (if cloning from repository)
  - **Check**: `git --version`
  - **Download**: https://git-scm.com/

### Recommended Tools (Optional)

- [ ] **Visual Studio Code** (text editor/IDE)
  - Download: https://code.visualstudio.com/

- [ ] **pgAdmin** (PostgreSQL GUI tool)
  - Download: https://www.pgadmin.org/
  - Useful for viewing/managing database

- [ ] **Postman** or **Insomnia** (API testing)
  - For testing API endpoints

- [ ] **PM2** (production process manager)
  - Install: `npm install -g pm2`
  - For running app in production

---

## Environment Setup

### Directories & File Structure

- [ ] Project directory created: `c:\Users\...\SiRKPBanting\project`
- [ ] Can write to project directory
- [ ] No special characters in path names
- [ ] Path length under 260 characters (Windows requirement)

### Files & Templates

- [ ] `.env.example` file exists in project root
  - Used to create `.env` configuration file
- [ ] `package.json` exists and is readable
- [ ] `prisma/schema.prisma` exists
- [ ] `prisma/seed.ts` exists

### Network & Ports

- [ ] Port 5173 is available (dev server)
  - **Check Windows**: `netstat -ano | findstr :5173`
  - **Check Mac/Linux**: `lsof -i :5173`
- [ ] Port 3000 is available (production server)
  - **Check Windows**: `netstat -ano | findstr :3000`
  - **Check Mac/Linux**: `lsof -i :3000`
- [ ] Port 5432 is available (PostgreSQL)
  - **Check Windows**: `netstat -ano | findstr :5432`
  - **Check Mac/Linux**: `lsof -i :5432`

---

## Database Preparation

### PostgreSQL Setup

- [ ] PostgreSQL installed and running
- [ ] PostgreSQL user `postgres` with password set
- [ ] Can connect to PostgreSQL locally
  - **Test**: `psql -U postgres -h 127.0.0.1 -c "SELECT 1"`
  - **Expected output**: `1`

### Database Creation (Optional - Will be created automatically)

- [ ] Database `sir_kp_banting` created (or will be created by Prisma)
- [ ] Have PostgreSQL admin credentials
- [ ] Know the password for `postgres` user

### Connection String Ready

- [ ] Have PostgreSQL connection string ready:
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://postgres:mypassword@127.0.0.1:5432/sir_kp_banting`

---

## Credentials & Configuration

### Database Credentials

- [ ] PostgreSQL host, port, username, and password sudah siap
- [ ] Nilai `DATABASE_URL` sudah disiapkan untuk file `.env`

### Default Test Credentials

- [ ] Note: Following seed credentials will be created:
  - Email: `siti@parent.com`
  - Password: `parent123`
  - **Change these after first login!**

---

## Workspace Preparation

### Project Folder

- [ ] Navigate to: `project/` folder
- [ ] Terminal/Command Prompt open in this directory
- [ ] `.env.example` visible in folder
- [ ] `package.json` visible in folder

### Terminal Setup

- [ ] Terminal/Command Prompt open
- [ ] Working directory set to project folder
- [ ] Can run commands (npm, node, git, etc.)
- [ ] Copy/paste works in terminal

---

## Knowledge Prerequisites

### Required Knowledge

- [ ] Can use terminal/command line
- [ ] Understand basic npm commands
- [ ] Can edit text files (create/modify .env)
- [ ] Know PostgreSQL basics (or willing to learn)

### Helpful Experience

- [ ] Familiar with Docker (for containerized deployment)
- [ ] Worked with React TypeScript projects
- [ ] Understands REST APIs
- [ ] Linux command line experience (for server deployment)

---

## Security Considerations

### Before Starting

- [ ] Have a secure password for PostgreSQL admin account
- [ ] Plan to change default seed credentials after setup
- [ ] Have plan for managing API keys securely
- [ ] Review security guidelines in SETUP_COMPLETE.md
- [ ] Understand RLS (Row Level Security) concepts

### Credentials Management

- [ ] `.env` file will NOT be committed to git
- [ ] `.env.example` shows template only
- [ ] Never share `.env` file contents
- [ ] Rotate credentials regularly in production

---

## Deployment Preparation (If planning to deploy)

### Hosting Platform

- [ ] Cloud provider selected (AWS, DigitalOcean, Linode, etc.)
- [ ] Have credentials/account access
- [ ] Know how to provision servers
- [ ] Have domain name (if needed)

### Production Environment

- [ ] Production PostgreSQL database planned
- [ ] Backup strategy documented
- [ ] Monitoring tools identified
- [ ] SSL certificate plan (for HTTPS)
- [ ] Load balancer plan (if needed)

---

## Quick Pre-Checklist (5 items must be YES)

Before you proceed, answer these:

1. **Is Node.js v20+ installed?**
   - [ ] Yes - Run: `node --version`
   - [ ] No - Download from nodejs.org

2. **Is PostgreSQL installed and running?**
   - [ ] Yes - Run: `psql --version`
   - [ ] No - See SETUP_COMPLETE.md section "Database Setup"

3. **Can you write files in project directory?**
   - [ ] Yes - You have full read/write access
   - [ ] No - Check folder permissions

4. **Are ports 3000, 5173, 5432 available?**
   - [ ] Yes - No other apps using these ports
   - [ ] No - Stop conflicting applications

5. **Do you have ~2GB free disk space?**
   - [ ] Yes - Available for project files
   - [ ] No - Free up disk space

**If ANY answer is NO - STOP and fix before proceeding!**

---

## Next Steps After Verification

1. ✅ All items checked above
2. 🚀 Run: `npm install`
3. ⚙️ Run: `npx prisma db push`
4. 🌱 Run: `npx tsx prisma/seed.ts`
5. 🎯 Run: `npm run dev`
6. 🌐 Open: http://localhost:5173

---

## Troubleshooting Pre-Installation

### Issue: Node.js not found

- Solution: Install from https://nodejs.org/
- Restart terminal after installation
- Verify: `node --version`

### Issue: npm not found

- Solution: npm comes with Node.js
- Reinstall Node.js completely
- Verify: `npm --version`

### Issue: PostgreSQL not running

- **Windows**: Open Services, start "PostgreSQL Server"
- **macOS**: `brew services start postgresql@16`
- **Linux**: `sudo systemctl start postgresql`
- **Docker**: `docker start sirkp-postgres`

### Issue: Port already in use

- Solution: Stop application using the port
- Windows: `taskkill /F /IM node.exe`
- Mac/Linux: `lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9`

### Issue: Permission denied on files

- **Windows**: Run Command Prompt as Administrator
- **macOS/Linux**: Use `sudo` (use cautiously)
- Or: Fix directory permissions: `chmod 755 project`

---

## Support Resources

- **Official Docs**: https://nodejs.org/docs/, https://www.postgresql.org/docs/
- **React Router**: https://reactrouter.com/docs/
- **Prisma**: https://www.prisma.io/docs/
- **Stack Overflow**: Search error messages for solutions

---

## Pre-Installation Sign-Off

Before installing, verify this section:

```
OS: _________________ (Windows/macOS/Linux)
RAM: _________________ GB (minimum 2GB, recommend 4GB)
Disk Space Available: _________________ GB
Node.js Version: _________________ (should be v20+)
PostgreSQL Version: _________________ (should be 14+)
Ready to proceed: ☐ YES ☐ NO

Date: _________________
Installer Name: _________________
```

---

**Document Version**: 1.0  
**Last Updated**: April 2026

✅ **Ready to install?** Proceed to SETUP_COMPLETE.md
