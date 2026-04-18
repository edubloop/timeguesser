# Implement Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Implement the approved plan.

## Hard Constraints

- Do not change scoring constants, formulas, or hint costs without explicit approval
- Do not add dependencies without explicit approval
- Do not change `app.json` or `eas.json` without explicit approval
- Do not change AsyncStorage keys without explicit approval
- Do not change the provider order in `app/_layout.tsx`
- Do not add new external APIs beyond the approved allowlist
- Do not grow `app/(tabs)/game.tsx` if new logic can be extracted

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/plan.md` (the approved implementation plan)
2. `$artifact_dir/spec.md` (for requirement traceability)
3. `$workspace_root/TimeGuesser/AGENTS.md`
4. Each file explicitly listed in plan.md as a target for modification
5. No other files unless explicitly required for implementation

## Allowed Tools

You may use the full tool suite as needed:

- `read_file`, `write_file`, `edit_file`/`apply_patch` — file operations
- `grep`, `glob` — discovery and search (use sparingly, prefer explicit paths)
- `shell` — commands as specified in plan.md

## Output

- Implement all steps from the approved plan.md
- Keep changes minimal and traceable
- Update existing files before creating new ones where practical
- Do not run repo-wide verification commands in this stage
- If an ask-first boundary is required, stop and summarize it
