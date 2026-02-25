#!/usr/bin/env bash
# Optional local secret scan. Runs gitleaks if installed; no-op otherwise (exit 0).
# Usage: ./scripts/check-secrets.sh [path]
# From repo root: ./scripts/check-secrets.sh .
set -e
path="${1:-.}"
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source "$path" --no-git
else
  echo "gitleaks not installed; skipping secret scan."
fi
