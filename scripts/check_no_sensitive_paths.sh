#!/usr/bin/env bash
# check_no_sensitive_paths.sh
#
# Exits non-zero if any staged or changed files contain a forbidden path pattern.
# Use as a pre-commit hook or CI step to prevent sensitive local directories from
# appearing in commits or diffs.
#
# Usage:
#   bash scripts/check_no_sensitive_paths.sh
#
# Configuration:
#   Set FORBIDDEN_PATTERNS to a space-separated list of patterns to block.
#   Patterns are matched as substrings against file paths using grep -F (literal match).
#   Override by setting the env variable before calling the script:
#
#     FORBIDDEN_PATTERNS="local_data secrets_dir" bash scripts/check_no_sensitive_paths.sh
#
# Exit codes:
#   0  — no forbidden paths found
#   1  — one or more forbidden paths found (lists offending files)
#   2  — usage error

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────

# Default forbidden patterns. Override via environment variable.
FORBIDDEN_PATTERNS="${FORBIDDEN_PATTERNS:-iaps_records local_data_dir}"

# ── Helpers ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # no colour

error() { echo -e "${RED}ERROR:${NC} $*" >&2; }
warn()  { echo -e "${YELLOW}WARN:${NC}  $*" >&2; }

# ── Collect changed files ─────────────────────────────────────────────────────

# In a git repo: use staged files (pre-commit context) or all changed files (CI context).
# Falls back to empty list if not in a git repo.
if git rev-parse --git-dir > /dev/null 2>&1; then
  # Staged files (pre-commit) — also catches unstaged changes for CI safety
  STAGED=$(git diff --cached --name-only 2>/dev/null || true)
  # In CI, compare against the base branch
  CI_CHANGED=$(git diff --name-only "origin/${BASE_BRANCH:-main}...HEAD" 2>/dev/null || true)
  CHANGED_FILES=$(printf '%s\n%s\n' "$STAGED" "$CI_CHANGED" | sort -u | grep -v '^$' || true)
else
  warn "Not inside a git repository. Skipping staged file check."
  exit 0
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files detected. Nothing to check."
  exit 0
fi

# ── Check each pattern ────────────────────────────────────────────────────────

FOUND=0

for pattern in $FORBIDDEN_PATTERNS; do
  matches=$(echo "$CHANGED_FILES" | grep -F "$pattern" || true)
  if [ -n "$matches" ]; then
    error "Forbidden path pattern '${pattern}' found in changed files:"
    echo "$matches" | while read -r f; do
      echo "  $f"
    done
    FOUND=1
  fi
done

# ── Result ────────────────────────────────────────────────────────────────────

if [ "$FOUND" -ne 0 ]; then
  echo ""
  error "Commit blocked: changed files include a forbidden path pattern."
  echo "  If this is a false positive, update FORBIDDEN_PATTERNS in this script"
  echo "  or set the environment variable before running:"
  echo "    FORBIDDEN_PATTERNS=\"pattern1 pattern2\" bash scripts/check_no_sensitive_paths.sh"
  exit 1
fi

echo "check_no_sensitive_paths: OK"
exit 0
