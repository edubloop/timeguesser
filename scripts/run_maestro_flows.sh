#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLOW_DIR="$ROOT_DIR/.maestro"
ARTIFACTS_DIR="$FLOW_DIR/artifacts"
ARTIFACT_RETENTION_DAYS="${MAESTRO_ARTIFACT_RETENTION_DAYS:-14}"
AUTO_START_METRO="${MAESTRO_AUTO_START_METRO:-0}"
KEEP_METRO="${MAESTRO_KEEP_METRO:-0}"
METRO_PID=""
METRO_STARTED_BY_SCRIPT=0

FULL_FLOWS=(
  "photo-viewer.yaml"
  "game-full-round.yaml"
  "hint-tiers.yaml"
  "settings-navigation.yaml"
)

SMOKE_FLOWS=(
  "photo-viewer.yaml"
)

FLOW_SET="${MAESTRO_FLOW_SET:-full}"
FLOWS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --smoke)
      FLOW_SET="smoke"
      ;;
    --full)
      FLOW_SET="full"
      ;;
    --auto-metro)
      AUTO_START_METRO=1
      ;;
    --keep-metro)
      KEEP_METRO=1
      ;;
    *)
      echo "Error: Unknown argument '$1'"
      echo "Usage: run_maestro_flows.sh [--smoke|--full] [--auto-metro] [--keep-metro]"
      exit 1
      ;;
  esac
  shift
done

if [[ "$FLOW_SET" == "smoke" ]]; then
  FLOWS=("${SMOKE_FLOWS[@]}")
elif [[ "$FLOW_SET" == "full" ]]; then
  FLOWS=("${FULL_FLOWS[@]}")
else
  echo "Error: Unknown flow set '$FLOW_SET'. Use full or smoke."
  exit 1
fi

SCREENSHOT_BASENAMES=()
RUN_DIR=""

collect_screenshot_basenames() {
  if ! command -v grep >/dev/null 2>&1 || ! command -v sed >/dev/null 2>&1; then
    return
  fi

  SCREENSHOT_BASENAMES=()
  while IFS= read -r basename; do
    SCREENSHOT_BASENAMES+=("$basename")
  done < <(
    grep -hE "^- takeScreenshot:" "$FLOW_DIR"/*.yaml \
      | sed -E "s/^- takeScreenshot:[[:space:]]*['\"]?([^'\"]+)['\"]?$/\1/" \
      | sed -E '/^[[:space:]]*$/d' \
      | sort -u
  )
}

cleanup_root_screenshots() {
  for basename in "${SCREENSHOT_BASENAMES[@]:-}"; do
    rm -f "$ROOT_DIR/$basename.png"
  done
}

archive_root_screenshots() {
  local destination_dir="$1"
  mkdir -p "$destination_dir"

  for basename in "${SCREENSHOT_BASENAMES[@]:-}"; do
    if [[ -f "$ROOT_DIR/$basename.png" ]]; then
      mv "$ROOT_DIR/$basename.png" "$destination_dir/$basename.png"
    fi
  done
}

cleanup_old_artifacts() {
  if [[ -d "$ARTIFACTS_DIR" ]]; then
    find "$ARTIFACTS_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$ARTIFACT_RETENTION_DAYS" -exec rm -rf {} +
  fi
}

on_exit() {
  if [[ "$METRO_STARTED_BY_SCRIPT" == "1" && "$KEEP_METRO" != "1" && -n "$METRO_PID" ]]; then
    kill "$METRO_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$RUN_DIR" ]]; then
    archive_root_screenshots "$RUN_DIR"
  fi
  cleanup_root_screenshots
  cleanup_old_artifacts
}

trap on_exit EXIT

if ! command -v maestro >/dev/null 2>&1; then
  echo "Error: Maestro CLI is not installed or not on PATH."
  echo "Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required for Metro preflight check."
  exit 1
fi

metro_running() {
  local status
  status="$(curl -fsS "http://127.0.0.1:8081/status" 2>/dev/null || true)"
  [[ "$status" == "packager-status:running" ]]
}

start_metro() {
  echo "Metro not detected. Starting Expo dev server..."
  (cd "$ROOT_DIR" && npx expo start --dev-client --non-interactive >/tmp/timeguesser-metro.log 2>&1) &
  METRO_PID=$!
  METRO_STARTED_BY_SCRIPT=1

  local attempt
  for attempt in {1..45}; do
    if metro_running; then
      echo "Metro is running."
      return
    fi
    sleep 1
  done

  echo "Error: Metro did not start in time."
  echo "Check logs: /tmp/timeguesser-metro.log"
  exit 1
}

if [[ "${MAESTRO_SKIP_METRO_CHECK:-0}" != "1" ]]; then
  if ! metro_running; then
    if [[ "$AUTO_START_METRO" == "1" ]]; then
      start_metro
    else
      echo "Error: Metro bundler is not running on http://127.0.0.1:8081"
      echo "Start it first in another terminal: npm run ios"
      echo "Or run this script with --auto-metro"
      echo "If intentionally testing without Metro, set MAESTRO_SKIP_METRO_CHECK=1"
      exit 1
    fi
  fi
fi

for flow in "${FLOWS[@]}"; do
  if [[ ! -f "$FLOW_DIR/$flow" ]]; then
    echo "Error: Missing flow file: $FLOW_DIR/$flow"
    exit 1
  fi
done

collect_screenshot_basenames
cleanup_root_screenshots
RUN_DIR="$ARTIFACTS_DIR/$(date +%Y%m%d_%H%M%S)"

echo "Running Maestro flows from $FLOW_DIR (set: $FLOW_SET)"

for flow in "${FLOWS[@]}"; do
  printf '\n=== Running %s ===\n' "$flow"
  maestro test "$FLOW_DIR/$flow"
done

printf '\nAll Maestro flows passed.\n'
echo "Artifacts saved to: $RUN_DIR"
