#!/usr/bin/env bash
set -euo pipefail

artifact_scope_path="${1:-}"

if [[ -z "$artifact_scope_path" ]]; then
  echo "usage: validate_artifact_scope.sh <artifact-scope.md>" >&2
  exit 1
fi

if [[ ! -f "$artifact_scope_path" ]]; then
  echo "missing artifact scope file: $artifact_scope_path" >&2
  exit 1
fi

has_selection=0
while IFS= read -r line; do
  case "$line" in
    *"[x]"*"html-prototype"*|*"[x]"*"interaction-flow"*|*"[x]"*"architecture-proposal"*|*"[x]"*"component-mockup"*|*"[x]"*"data-flow-diagram"*|*"[x]"*"none-needed"*)
      has_selection=1
      break
      ;;
  esac
done < "$artifact_scope_path"

if [[ "$has_selection" -ne 1 ]]; then
  echo "artifact scope must select at least one artifact type with [x] (including none-needed when appropriate)" >&2
  exit 1
fi

exit 0
