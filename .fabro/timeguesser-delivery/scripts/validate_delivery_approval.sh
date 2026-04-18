#!/usr/bin/env bash
# workspace-kit-source: .workspace-kit/templates/fabro/scripts/validate_delivery_approval.sh.tpl
# workspace-kit-sync: v1.5.0 | synced: 2026-04-18
set -euo pipefail

goal_file="${1:-}"
plan_file="${2:-}"
approval_file="${3:-}"

if [[ -z "$goal_file" || -z "$plan_file" || -z "$approval_file" ]]; then
  echo "usage: validate_delivery_approval.sh <ticket.md> <plan.md> <delivery-approval.md>" >&2
  exit 1
fi

for path in "$goal_file" "$plan_file" "$approval_file"; do
  if [[ ! -f "$path" ]]; then
    echo "missing required delivery artifact: $path" >&2
    exit 1
  fi
done

if ! rg -q '^# [A-Za-z]{2}-[0-9]+ ' "$goal_file"; then
  echo "ticket goal file is not a valid published delivery ticket: $goal_file" >&2
  exit 1
fi

if ! rg -q --fixed-strings '**Decision:** Approve Plan' "$approval_file"; then
  echo "delivery approval artifact must record \`Approve Plan\` before starting from implement" >&2
  exit 1
fi

if ! rg -q --fixed-strings '**Status:** `Ready for approval`' "$plan_file"; then
  echo "plan.md must remain the approved plan artifact before starting from implement" >&2
  exit 1
fi
