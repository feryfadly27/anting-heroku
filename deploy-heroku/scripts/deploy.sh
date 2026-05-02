#!/usr/bin/env bash
set -euo pipefail

# Jalankan dari root aplikasi (folder yang berisi package.json dan deploy-heroku/).
# Contoh: bash deploy-heroku/scripts/deploy.sh main

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BRANCH="${1:-main}"

cd "$APP_DIR"

if [[ ! -f package.json ]]; then
  echo "error: package.json tidak ada di $APP_DIR (jalankan dari repo aplikasi)" >&2
  exit 1
fi

GIT_TOPLEVEL="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${GIT_TOPLEVEL}" ]]; then
  echo "error: bukan dalam working tree Git" >&2
  exit 1
fi

if [[ "$GIT_TOPLEVEL" != "$APP_DIR" ]]; then
  echo "warning: root Git ($GIT_TOPLEVEL) bukan $APP_DIR." >&2
  echo "         Heroku Node buildpack membutuhkan package.json di root tree yang di-push." >&2
  echo "         Lihat deploy-heroku/README.md (bagian root deploy)." >&2
fi

if ! git remote get-url heroku >/dev/null 2>&1; then
  echo "error: remote 'heroku' belum dikonfigurasi. Contoh: heroku git:remote -a nama-app" >&2
  exit 1
fi

echo "Push branch '$BRANCH' ke remote heroku dari $(pwd) ..."
git push heroku "$BRANCH"
