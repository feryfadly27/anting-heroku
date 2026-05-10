#!/usr/bin/env bash
# Run script for this project (database + app)
# - Starts PostgreSQL container in Podman (if present)
# - Ensures dependencies are installed
# - Ensures Prisma client is generated
# - Optionally applies schema to DB (prisma db push)
# - Runs dev server
#
# Usage:
#   bash runningscrpt.sh
#   bash runningscrpt.sh --install
#   bash runningscrpt.sh --db-start
#   bash runningscrpt.sh --db-push
#   bash runningscrpt.sh --db-seed
#   bash runningscrpt.sh --port 5173 --host 127.0.0.1
#   bash runningscrpt.sh --skip-db
#
# Notes:
# - This script does NOT modify application source code.
# - It assumes you already have a valid .env (DATABASE_URL, etc.).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { echo "[INFO] $*"; }
ok() { echo "[OK]   $*"; }
warn() { echo "[WARN] $*"; }
err() { echo "[ERR]  $*" >&2; }

default_db_container_name() {
  # Prefer a project-specific container if it exists
  if command -v podman >/dev/null 2>&1; then
    if podman container exists anting-postgres-local >/dev/null 2>&1; then
      echo "anting-postgres-local"
      return
    fi
  fi
  echo ""
}

PORT="${PORT:-5173}"
HOST="${HOST:-127.0.0.1}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-$(default_db_container_name)}"

DO_INSTALL=0
DO_DB_START=0
DO_DB_PUSH=0
DO_DB_SEED=0
SKIP_DB=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install) DO_INSTALL=1; shift ;;
    --db-start) DO_DB_START=1; shift ;;
    --db-push) DO_DB_PUSH=1; shift ;;
    --db-seed) DO_DB_SEED=1; shift ;;
    --skip-db) SKIP_DB=1; shift ;;
    --host)
      [[ -n "${2:-}" ]] || { err "--host membutuhkan nilai"; exit 1; }
      HOST="$2"; shift 2 ;;
    --port)
      [[ -n "${2:-}" ]] || { err "--port membutuhkan nilai"; exit 1; }
      PORT="$2"; shift 2 ;;
    --db-container)
      [[ -n "${2:-}" ]] || { err "--db-container membutuhkan nama container"; exit 1; }
      DB_CONTAINER_NAME="$2"; shift 2 ;;
    --help|-h)
      cat <<EOF
Usage: bash runningscrpt.sh [options]

Options:
  --install        Run npm install when needed
  --db-start       Start PostgreSQL Podman container (if configured)
  --db-push        Apply Prisma schema to database (npx prisma db push)
  --db-seed        Run seed script (npx tsx prisma/seed.ts)
  --skip-db        Skip all DB actions
  --db-container N Use a specific Podman container name for Postgres
  --host H         Host for dev server (default: 127.0.0.1)
  --port P         Port for dev server (default: 5173)

Environment variables:
  HOST, PORT, DB_CONTAINER_NAME

Examples:
  bash runningscrpt.sh --db-start --install
  bash runningscrpt.sh --db-start --db-push --db-seed
  HOST=0.0.0.0 PORT=5173 bash runningscrpt.sh --db-start
EOF
      exit 0
      ;;
    *)
      err "Argumen tidak dikenal: $1 (pakai --help)"
      exit 1
      ;;
  esac
done

command -v node >/dev/null || { err "Node.js tidak ditemukan"; exit 1; }
command -v npm >/dev/null || { err "npm tidak ditemukan"; exit 1; }
ok "Node $(node -v) | npm $(npm -v)"

if [[ ! -f .env ]]; then
  err "File .env tidak ditemukan. Buat/salin dulu dari .env.example dan sesuaikan DATABASE_URL."
  exit 1
fi
ok "File .env ada"

if [[ "$SKIP_DB" != 1 ]]; then
  if [[ "$DO_DB_START" == 1 ]]; then
    command -v podman >/dev/null || { err "podman tidak ditemukan"; exit 1; }

    if [[ -z "$DB_CONTAINER_NAME" ]]; then
      err "Tidak menemukan nama container Postgres otomatis. Jalankan dengan --db-container <nama>."
      info "Lihat daftar: podman ps -a"
      exit 1
    fi

    info "Menyalakan container Postgres: $DB_CONTAINER_NAME"
    podman start "$DB_CONTAINER_NAME" >/dev/null
    ok "Container DB berjalan"

    info "Status container (ringkas):"
    podman ps --filter "name=${DB_CONTAINER_NAME}" || true
  fi
fi

if [[ ! -d node_modules ]] || [[ "$DO_INSTALL" == 1 ]]; then
  info "Menyiapkan dependency (npm install)..."
  npm install
  ok "Dependency siap"
fi

info "Prisma generate..."
npx prisma generate
ok "Prisma client siap"

if [[ "$SKIP_DB" != 1 ]]; then
  if [[ "$DO_DB_PUSH" == 1 ]]; then
    info "Menerapkan schema ke DB (npx prisma db push)..."
    npx prisma db push
    ok "Schema diterapkan"
  fi

  if [[ "$DO_DB_SEED" == 1 ]]; then
    info "Menjalankan seed (npx tsx prisma/seed.ts)..."
    npx tsx prisma/seed.ts
    ok "Seed selesai"
  fi
fi

BASE_URL="http://${HOST}:${PORT}"
info "Menjalankan dev server: ${BASE_URL}"
info "Tekan Ctrl+C untuk berhenti"

# Run in foreground so logs are visible
npm run dev -- --host "$HOST" --port "$PORT"
