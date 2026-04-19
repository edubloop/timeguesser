#!/usr/bin/env bash
# workspace-kit-source: .workspace-kit/packages/design/repos/timeguesser/.fabro/timeguesser-design/scripts/validate_design_approval.sh
# workspace-kit-sync: v1.5.0 | synced: 2026-04-18
set -euo pipefail

artifact_path="${1:-}"
expected_branch="${2:-}"

if [[ -z "$artifact_path" || -z "$expected_branch" ]]; then
  echo "usage: validate_design_approval.sh <design-approval.md> <approve|revise|stop>" >&2
  exit 1
fi

if [[ ! -f "$artifact_path" ]]; then
  echo "missing design approval artifact: $artifact_path" >&2
  exit 1
fi

latest_cycle="$(
  awk '
    /^## Review cycle / { block = $0 ORS; capture = 1; next }
    capture { block = block $0 ORS }
    END {
      if (block == "") {
        exit 1
      }
      printf "%s", block
    }
  ' "$artifact_path"
)"

if [[ -z "$latest_cycle" ]]; then
  echo "design approval artifact has no review cycle blocks" >&2
  exit 1
fi

require_line() {
  local pattern="$1"
  local message="$2"
  if ! printf '%s' "$latest_cycle" | rg -q --fixed-strings -- "$pattern"; then
    echo "$message" >&2
    exit 1
  fi
}

extract_section() {
  local heading="$1"
  printf '%s' "$latest_cycle" | awk -v heading="$heading" '
    $0 == heading { capture = 1; next }
    capture && /^### / { exit }
    capture { print }
  '
}

section_has_actionable_content() {
  local content="$1"
  local normalized
  normalized="$(printf '%s\n' "$content" | sed '/^[[:space:]]*$/d')"
  [[ -n "$normalized" ]] || return 1
  if printf '%s\n' "$normalized" | rg -q '^- (None|None specified|None yet)$'; then
    return 1
  fi
  if printf '%s\n' "$normalized" | rg -q 'Pending human decision'; then
    return 1
  fi
  return 0
}

case "$expected_branch" in
  approve)
    require_line '- Decision status: `Approve as-is`' 'latest review cycle must set Decision status to `Approve as-is` before using Approve As-Is'
    if ! printf '%s' "$latest_cycle" | rg -q -- '^- Approved direction: `.+`$'; then
      echo 'latest review cycle must set a concrete Approved direction before using Approve As-Is' >&2
      exit 1
    fi
    if printf '%s' "$latest_cycle" | rg -q --fixed-strings -- '- Approved direction: `Pending human decision`'; then
      echo 'latest review cycle still has a pending Approved direction' >&2
      exit 1
    fi
    if section_has_actionable_content "$(extract_section '### Required changes before approval')"; then
      echo 'Approve As-Is cannot be used while Required changes before approval contains actionable items' >&2
      exit 1
    fi
    ;;
  revise)
    require_line '- Decision status: `Revise with required changes`' 'latest review cycle must set Decision status to `Revise with required changes` before using Revise With Required Changes'
    if ! printf '%s' "$latest_cycle" | rg -q -- '^- Approved direction: `.+`$'; then
      echo 'latest review cycle must set a concrete Approved direction before using Revise With Required Changes' >&2
      exit 1
    fi
    if printf '%s' "$latest_cycle" | rg -q --fixed-strings -- '- Approved direction: `Pending human decision`'; then
      echo 'latest review cycle still has a pending Approved direction' >&2
      exit 1
    fi
    if ! section_has_actionable_content "$(extract_section '### Required changes before approval')"; then
      echo 'Revise With Required Changes requires at least one actionable item under `### Required changes before approval`' >&2
      exit 1
    fi
    ;;
  stop)
    require_line '- Decision status: `Stop with guidance only`' 'latest review cycle must set Decision status to `Stop with guidance only` before using Stop With Guidance Only'
    if ! section_has_actionable_content "$(extract_section '### Guidance before stopping')"; then
      echo 'Stop With Guidance Only requires actionable content under `### Guidance before stopping`' >&2
      exit 1
    fi
    ;;
  *)
    echo "unknown expected branch: $expected_branch" >&2
    exit 1
    ;;
esac
