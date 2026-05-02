#!/usr/bin/env bash
# Alias: skrip utama ada di root bernama jalankansistem.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "${ROOT}/jalankansistem.sh" "$@"
