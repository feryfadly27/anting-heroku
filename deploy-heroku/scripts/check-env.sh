#!/usr/bin/env bash
set -euo pipefail

# Cek login Heroku CLI dan remote git di root aplikasi.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Heroku CLI ==="
if command -v heroku >/dev/null 2>&1; then
  heroku --version
  if heroku auth:whoami 2>/dev/null; then
    echo "(login OK)"
  else
    echo "Belum login. Jalankan: heroku login"
  fi
else
  echo "heroku CLI tidak ditemukan di PATH"
fi

echo ""
echo "=== Git (root aplikasi) ==="
if [[ -d "$APP_DIR" ]]; then
  cd "$APP_DIR"
  if GIT_TOPLEVEL="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Git toplevel: $GIT_TOPLEVEL"
    git remote -v 2>/dev/null || true
    if git remote get-url heroku >/dev/null 2>&1; then
      echo "Remote heroku: $(git remote get-url heroku)"
    else
      echo "Remote 'heroku' belum di-set."
    fi
  else
    echo "Bukan repo Git di $APP_DIR"
  fi
else
  echo "Folder tidak ada: $APP_DIR"
fi
