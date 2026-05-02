#!/usr/bin/env bash
set -euo pipefail

# Push branch yang sama ke origin (GitHub) lalu ke Heroku.
# Jalankan dari mana saja; skrip akan cd ke root aplikasi (folder berisi package.json).
#
#   bash deploy-heroku/scripts/push-all.sh
#   bash deploy-heroku/scripts/push-all.sh main
#   bash deploy-heroku/scripts/push-all.sh --allow-dirty
#
# Tanpa commit: skrip berhenti jika working tree kotor (supaya tidak lupa commit).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

ALLOW_DIRTY=0
BRANCH=""

for arg in "$@"; do
  if [[ "$arg" == "--allow-dirty" ]]; then
    ALLOW_DIRTY=1
  elif [[ -z "$BRANCH" && "$arg" != --* ]]; then
    BRANCH="$arg"
  fi
done

cd "$APP_DIR"

if [[ ! -f package.json ]]; then
  echo "error: package.json tidak ada di $APP_DIR" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: bukan repo Git" >&2
  exit 1
fi

if [[ -z "$BRANCH" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  if [[ "$ALLOW_DIRTY" != 1 ]]; then
    echo "error: ada perubahan belum di-commit (working tree atau index tidak bersih)." >&2
    echo "       Commit/stash dulu, atau jalankan dengan: --allow-dirty" >&2
    exit 1
  fi
  echo "warning: working tree tidak bersih; push hanya mengirim commit yang sudah ada." >&2
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error: remote 'origin' tidak ada. Tambahkan: git remote add origin <url-repo>" >&2
  exit 1
fi

if ! git remote get-url heroku >/dev/null 2>&1; then
  echo "error: remote 'heroku' tidak ada. Contoh: heroku git:remote -a nama-app" >&2
  exit 1
fi

GIT_TOPLEVEL="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -n "$GIT_TOPLEVEL" && "$GIT_TOPLEVEL" != "$APP_DIR" ]]; then
  echo "warning: root Git ($GIT_TOPLEVEL) bukan $APP_DIR — pastikan ini repo yang benar untuk Heroku." >&2
fi

echo "=== Push origin + heroku (branch: $BRANCH) dari $(pwd) ==="
echo "-> git push origin $BRANCH"
git push origin "$BRANCH"
echo "-> git push heroku $BRANCH"
git push heroku "$BRANCH"
echo "=== Selesai ==="
