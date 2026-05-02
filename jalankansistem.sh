#!/usr/bin/env bash
# SI Banting — jalankan sistem (dev server) + uji coba ringan
# Usage:
#   ./jalankansistem.sh
#   bash jalankansistem.sh --install
#   bash jalankansistem.sh --port 5174
#   bash jalankansistem.sh --skip-db-check
#
# Prasyarat: Node.js, npm, file .env, PostgreSQL jalan (lihat DOCKER_DEPLOYMENT.md)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { echo -e "\033[0;34mℹ\033[0m $*"; }
ok() { echo -e "\033[0;32m✓\033[0m $*"; }
warn() { echo -e "\033[1;33m⚠\033[0m $*"; }
err() { echo -e "\033[0;31m✗\033[0m $*" >&2; }

PORT="${PORT:-5173}"
HOST="${HOST:-127.0.0.1}"
DO_INSTALL=0
SKIP_DB_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install) DO_INSTALL=1; shift ;;
    --skip-db-check) SKIP_DB_CHECK=1; shift ;;
    --port)
      if [[ -z "${2:-}" ]]; then err "Opsi --port membutuhkan nomor, contoh: --port 5173"; exit 1; fi
      PORT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: ./jalankansistem.sh [--install] [--port N] [--skip-db-check]"
      echo "     bash jalankansistem.sh [--install] [--port N] [--skip-db-check]"
      echo "Env: PORT=5174 HOST=127.0.0.1 ./jalankansistem.sh"
      echo "Atau: npm run jalankansistem"
      exit 0
      ;;
    *)
      err "Argumen tidak dikenal: $1 (pakai --help)"
      exit 1
      ;;
  esac
done

command -v node >/dev/null || { err "Node.js tidak ditemukan."; exit 1; }
command -v npm >/dev/null || { err "npm tidak ditemukan."; exit 1; }
ok "Node $(node -v) | npm $(npm -v)"

if [[ ! -f .env ]]; then
  err "File .env tidak ada. Salin dari .env.example lalu sesuaikan DATABASE_URL."
  exit 1
fi
ok "File .env ada"

if [[ ! -d node_modules ]] || [[ "$DO_INSTALL" == 1 ]]; then
  info "npm install..."
  npm install
  ok "Dependensi siap"
fi

info "Prisma generate..."
npx prisma generate
ok "Prisma client siap"

if [[ "$SKIP_DB_CHECK" != 1 ]]; then
  info "Cek koneksi database (prisma db execute)..."
  if echo "SELECT 1" | npx prisma db execute --stdin >/dev/null 2>&1; then
    ok "Database merespons"
  else
    warn "Database tidak bisa diuji lewat Prisma (server tetap dijalankan). Pastikan PostgreSQL jalan."
  fi
fi

BASE_URL="http://${HOST}:${PORT}"
DEV_PID=""

cleanup() {
  if [[ -n "$DEV_PID" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
    info "Menghentikan dev server (PID $DEV_PID)..."
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

info "Menjalankan dev server di ${BASE_URL} ..."
npm run dev -- --host "$HOST" --port "$PORT" &
DEV_PID=$!

info "Menunggu server siap (maks ~90 dtk)..."
READY=0
for i in $(seq 1 90); do
  if curl -sf --max-time 2 "${BASE_URL}/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [[ "$READY" != 1 ]]; then
  err "Server tidak merespons di ${BASE_URL} dalam batas waktu."
  exit 1
fi
ok "Server hidup"

smoke() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}${path}" || echo "000")
  if [[ "$code" =~ ^(200|302|307|308)$ ]]; then
    ok "GET ${path} → ${code}"
  else
    warn "GET ${path} → ${code} (periksa route atau auth)"
  fi
}

echo ""
info "Uji coba HTTP ringan:"
smoke "/"
smoke "/login"
smoke "/m/parent/dashboard"

info "Uji login API (user seed: siti@parent.com)..."
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 -X POST "${BASE_URL}/api/auth/login" \
  -F "email=siti@parent.com" \
  -F "password=parent123" || echo "000")
if [[ "$LOGIN_CODE" == "200" ]]; then
  ok "POST /api/auth/login → 200 (kredensial seed valid)"
elif [[ "$LOGIN_CODE" == "401" ]]; then
  warn "POST /api/auth/login → 401 (jalankan seed: npx tsx prisma/seed.ts)"
else
  warn "POST /api/auth/login → ${LOGIN_CODE}"
fi

echo ""
ok "Selesai. Dev server masih jalan di ${BASE_URL}"
echo "    Akun contoh (setelah seed): siti@parent.com / parent123"
echo "    Tekan Ctrl+C di terminal ini untuk menghentikan server."
echo ""

wait "$DEV_PID"
