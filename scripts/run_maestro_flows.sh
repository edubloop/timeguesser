#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLOW_DIR="$ROOT_DIR/.maestro"
ARTIFACTS_DIR="$FLOW_DIR/artifacts"
ARTIFACT_RETENTION_DAYS="${MAESTRO_ARTIFACT_RETENTION_DAYS:-14}"

FLOWS=(
  "photo-viewer.yaml"
  "game-full-round.yaml"
  "hint-tiers.yaml"
  "settings-navigation.yaml"
)

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

for flow in "${FLOWS[@]}"; do
  if [[ ! -f "$FLOW_DIR/$flow" ]]; then
    echo "Error: Missing flow file: $FLOW_DIR/$flow"
    exit 1
  fi
done

collect_screenshot_basenames
cleanup_root_screenshots
RUN_DIR="$ARTIFACTS_DIR/$(date +%Y%m%d_%H%M%S)"

echo "Running Maestro flows from $FLOW_DIR"

for flow in "${FLOWS[@]}"; do
  printf '\n=== Running %s ===\n' "$flow"
  maestro test "$FLOW_DIR/$flow"
done

printf '\nAll Maestro flows passed.\n'
echo "Artifacts saved to: $RUN_DIR"
