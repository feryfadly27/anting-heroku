# Docker Deployment Guide - SiRKP Banting

Complete guide for deploying SiRKP Banting using Docker containers.

---

## Prerequisites

- Docker installed ([get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (comes with Docker Desktop)
- 2GB available RAM
- 1GB disk space

---

## Quick Start with Docker Compose

### Step 1: Create `docker-compose.yml`

Save this file in your project root:

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: sirkp-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password_here
      POSTGRES_DB: sir_kp_banting
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - sirkp-network

  # Node.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sirkp-app
    environment:
      NODE_ENV: production
      DATABASE_URL: "postgresql://postgres:your_secure_password_here@postgres:5432/sir_kp_banting?schema=public"
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./project:/app/project
      - /app/node_modules
    restart: unless-stopped
    networks:
      - sirkp-network
    command: >
      sh -c "cd project &&
             npm install &&
             npx prisma db push --skip-generate &&
             npx tsx prisma/seed.ts &&
             npm run build &&
             npm start"

volumes:
  postgres_data:

networks:
  sirkp-network:
    driver: bridge
```

### Step 2: Create `Dockerfile`

```dockerfile
# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built app from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["npm", "start"]
```

### Step 3: Create `.env.docker`

```bash
# Database - Use service name 'postgres' in Docker network
DATABASE_URL="postgresql://postgres:your_secure_password_here@postgres:5432/sir_kp_banting?schema=public"

# Application
NODE_ENV=production
```

### Step 4: Start Services

```bash
# Build images
docker-compose build

# Start services (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### Step 5: Verify

```bash
# Check running containers
docker-compose ps

# Access application
http://localhost:3000

# Check logs
docker-compose logs app

# Connect to database
docker-compose exec postgres psql -U postgres -d sir_kp_banting
```

---

## Manual Docker Build & Run

### Build Image

```bash
docker build -t sirkp-banting:latest .
```

### Run PostgreSQL Container

```bash
docker run -d \
  --name sirkp-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=sir_kp_banting \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Run Application Container

```bash
docker run -d \
  --name sirkp-app \
  --link sirkp-postgres:postgres \
  -e DATABASE_URL="postgresql://postgres:your_password@postgres:5432/sir_kp_banting" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  sirkp-banting:latest
```

---

## Deployment on Cloud Servers

### AWS EC2 with Docker

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t2.medium (2GB RAM minimum)
   - Security group: Allow 80, 443, 5432

2. **Install Docker**

   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose

   # Enable Docker
   sudo systemctl enable docker
   sudo systemctl start docker

   # Add user to docker group
   sudo usermod -aG docker ubuntu
   ```

3. **Deploy Application**

   ```bash
   # Clone repository
   git clone <your-repo> sirkp-banting
   cd sirkp-banting/project

   # Copy compose file
   cp docker-compose.yml.example docker-compose.yml

   # Edit with your settings
   nano docker-compose.yml

   # Start services
   docker-compose up -d
   ```

### Linode/DigitalOcean with Docker

Similar process:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# Then follow AWS steps above
```

## Using Nginx as Reverse Proxy

### Docker Compose with Nginx

Add to `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: sirkp-nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - app
  networks:
    - sirkp-network
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        client_max_body_size 100M;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## Database Backup & Restore

### Backup Database

```bash
# Backup to SQL file
docker-compose exec postgres pg_dump -U postgres sir_kp_banting > backup.sql

# Backup to compressed format
docker-compose exec postgres pg_dump -U postgres sir_kp_banting | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from SQL file
docker-compose exec -T postgres psql -U postgres sir_kp_banting < backup.sql

# Restore from compressed file
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U postgres sir_kp_banting
```

### Automated Daily Backup

Create `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/sirkp"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres sir_kp_banting | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

Add to crontab:

```bash
0 2 * * * cd /opt/sirkp-banting && bash backup.sh
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs (tail -f)
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Timestamp included
docker-compose logs -t app
```

### Resource Usage

```bash
# CPU and memory usage
docker stats

# View container details
docker inspect sirkp-app
```

### Health Checks

```bash
# Verify database is healthy
docker-compose exec postgres pg_isready -U postgres

# Test application
curl http://localhost:3000

# Check API
curl http://localhost:3000/api/wilayah
```

---

## Production Checklist

- [ ] Change default PostgreSQL password in docker-compose.yml
- [ ] Change all default credentials in seed.ts
- [ ] Enable SSL/TLS with Nginx reverse proxy
- [ ] Set up automated backups
- [ ] Configure monitoring tools (e.g., Prometheus, Grafana)
- [ ] Enable Docker restart policies (`restart: unless-stopped`)
- [ ] Set resource limits:
  ```yaml
  resources:
    limits:
      cpus: "1"
      memory: 512M
  ```
- [ ] Enable container logging driver
- [ ] Set up log rotation
- [ ] Document recovery procedures
- [ ] Test backup/restore process

---

## Troubleshooting Docker

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
netstat -an | grep 3000

# Rebuild images
docker-compose build --no-cache
```

### Database connection failed

```bash
# Verify connection string
echo $DATABASE_URL

# Test connection from app container
docker-compose exec app psql $DATABASE_URL -c "SELECT 1"

# Check if postgres is running and healthy
docker-compose ps
```

### Out of disk space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
df -h
docker system df
```

### Performance issues

```bash
# Check resource usage
docker stats

# Increase memory/CPU limits in docker-compose.yml
# Restart services
docker-compose down
docker-compose up -d
```

---

## Version History

- **v1.0**: Initial Docker setup guide
- **Tested**: Docker 24.0+, Docker Compose 2.20+

---

## Support

For issues with Docker setup:

1. Check official Docker docs: https://docs.docker.com/
2. Review container logs: `docker-compose logs`
3. Test database connection separately
4. Verify environment variables match docker-compose.yml
