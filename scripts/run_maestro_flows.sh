#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLOW_DIR="$ROOT_DIR/.maestro"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Error: Maestro CLI is not installed or not on PATH."
  echo "Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  exit 1
fi

FLOWS=(
  "photo-viewer.yaml"
  "game-full-round.yaml"
  "hint-tiers.yaml"
  "settings-navigation.yaml"
)

for flow in "${FLOWS[@]}"; do
  if [[ ! -f "$FLOW_DIR/$flow" ]]; then
    echo "Error: Missing flow file: $FLOW_DIR/$flow"
    exit 1
  fi
done

echo "Running Maestro flows from $FLOW_DIR"

for flow in "${FLOWS[@]}"; do
  echo "\n=== Running $flow ==="
  maestro test "$FLOW_DIR/$flow"
done

echo "\nAll Maestro flows passed."
