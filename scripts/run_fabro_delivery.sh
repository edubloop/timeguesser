#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/run_fabro_delivery.sh <TICKET_ID> <GOAL_FILE> [fabro args...]

Examples:
  ./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --preflight
  ./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --dry-run
  ./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md
EOF
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

ticket_id="$1"
goal_file="$2"
shift 2

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow_dir="$repo_root/.fabro/timeguesser-delivery"
artifact_dir="../artifacts/tickets/$ticket_id"
fabro_bin="${FABRO_BIN:-}"

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

if [[ ! -f "$goal_file" ]]; then
  echo "goal file not found: $goal_file" >&2
  exit 1
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/timeguesser-fabro-${ticket_id}.XXXXXX")"
tmp_toml="$tmp_dir/run.toml"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cat >"$tmp_toml" <<EOF
version = 1
graph = "$workflow_dir/workflow.fabro"
goal = "Run Delivery mode for ticket $ticket_id in TimeGuesser"
directory = "$repo_root"

[sandbox]
provider = "local"

[sandbox.local]
worktree_mode = "always"

[vars]
ticket_id = "$ticket_id"
artifact_dir = "$artifact_dir"
goal_file = "$goal_file"

[checkpoint]
exclude_globs = ["node_modules/**", ".git/**", ".expo/**", "dist/**"]
EOF

exec "$fabro_bin" run "$tmp_toml" "$@"
