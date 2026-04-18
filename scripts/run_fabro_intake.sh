#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/run_fabro_intake.sh <TICKET_ID> <INTAKE_FILE> [fabro args...]

Examples:
  ./scripts/run_fabro_intake.sh TG-101 ../artifacts/tickets/TG-101/intake.md --preflight
  ./scripts/run_fabro_intake.sh TG-101 ../artifacts/tickets/TG-101/intake.md --dry-run
  ./scripts/run_fabro_intake.sh TG-101 ../artifacts/tickets/TG-101/intake.md
EOF
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

ticket_id="$1"
intake_file="$2"
shift 2

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_root="$(cd "$repo_root/.." && pwd)"
workflow_dir="$repo_root/.fabro/timeguesser-intake"
artifact_dir="$repo_root/../artifacts/tickets/$ticket_id"
fabro_bin="${FABRO_BIN:-}"
cadence_script="$workspace_root/.workspace-notes/cadence_due_check.sh"
healthcheck_script="$workspace_root/.workspace-notes/harness_healthcheck.sh"

run_operator_preflight() {
  if [[ ! -x "$cadence_script" ]]; then
    echo "warning: cadence preflight script not found or not executable: $cadence_script" >&2
    return
  fi

  local preflight_output
  local preflight_status
  set +e
  preflight_output="$(cd "$workspace_root" && bash "$cadence_script" 2>&1)"
  preflight_status=$?
  set -e

  printf '%s\n' "$preflight_output"

  if [[ $preflight_status -eq 2 ]]; then
    echo "preflight notice: cadence review is due." >&2
    echo "recommended next step: (cd \"$workspace_root\" && bash \"$healthcheck_script\")" >&2
    echo "continuing with Fabro run; cadence is enforced at operator preflight, not inside workflow stages." >&2
  elif [[ $preflight_status -ne 0 ]]; then
    echo "warning: cadence preflight returned status $preflight_status; continuing with Fabro run." >&2
  fi
}

if [[ -z "$fabro_bin" ]]; then
  if command -v fabro >/dev/null 2>&1; then
    fabro_bin="$(command -v fabro)"
  elif [[ -x "$HOME/.fabro/bin/fabro" ]]; then
    fabro_bin="$HOME/.fabro/bin/fabro"
  else
    echo "fabro not found on PATH and ~/.fabro/bin/fabro is not executable" >&2
    exit 1
  fi
fi

if [[ ! -f "$intake_file" ]]; then
  echo "intake file not found: $intake_file" >&2
  exit 1
fi

run_operator_preflight

mkdir -p "$artifact_dir"
intake_file="$(cd "$(dirname "$intake_file")" && pwd)/$(basename "$intake_file")"
artifact_dir="$(cd "$artifact_dir" && pwd)"
goal_file="$artifact_dir/ticket.md"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/timeguesser-fabro-intake-${ticket_id}.XXXXXX")"
tmp_toml="$tmp_dir/run.toml"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cat >"$tmp_toml" <<EOF
version = 1
graph = "$workflow_dir/workflow.fabro"
goal = "Run Intake mode for ticket $ticket_id in TimeGuesser"
directory = "$repo_root"

[sandbox]
provider = "local"

[sandbox.local]
worktree_mode = "always"

[vars]
ticket_id = "$ticket_id"
workspace_root = "$workspace_root"
artifact_dir = "$artifact_dir"
source_file = "$intake_file"
goal_file = "$goal_file"

[checkpoint]
exclude_globs = ["node_modules/**", ".git/**", ".expo/**", "dist/**"]
EOF

exec "$fabro_bin" run "$tmp_toml" "$@"
