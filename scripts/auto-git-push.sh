#!/usr/bin/env bash

set -euo pipefail

COMMIT_MESSAGE="${1:-}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this directory is not a git repository."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Error: remote 'origin' is not configured."
  exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes to commit."
  exit 0
fi

if [[ -z "$COMMIT_MESSAGE" ]]; then
  echo "Masukkan pesan commit:"
  read -r COMMIT_MESSAGE
fi

if [[ -z "$COMMIT_MESSAGE" ]]; then
  echo "Error: pesan commit tidak boleh kosong."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" == "HEAD" ]]; then
  echo "Error: detached HEAD state. Checkout a branch first."
  exit 1
fi

echo "Staging changes..."
git add -A

echo "Committing with message: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

echo "Siap push ke origin/$CURRENT_BRANCH. Lanjutkan? [Y/n]"
read -r CONFIRM_PUSH

if [[ "${CONFIRM_PUSH:-Y}" =~ ^[Nn]$ ]]; then
  echo "Push dibatalkan oleh user."
  exit 0
fi

echo "Pushing branch '$CURRENT_BRANCH' to origin..."
git push -u origin "$CURRENT_BRANCH"

echo "Done: changes pushed successfully."
