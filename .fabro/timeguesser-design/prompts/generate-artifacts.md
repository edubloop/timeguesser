# Generate Artifacts Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Generate selected design draft artifacts for this ticket.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md` (for visual artifacts)
5. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create artifacts in `$artifact_dir/drafts/`
- `glob` — only to list specific directories when needed
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Generate only artifact types marked with `[x]` in `artifact-scope.md`.
Write to `$artifact_dir/drafts/` using the naming convention in artifact-scope.md.

After generating, append a `## Generated artifacts manifest` section to `artifact-scope.md` listing each created file path.

## Per-Type Guidance

- `html-prototype`: Self-contained HTML with representative states
- `interaction-flow`: Step-by-step markdown with triggers and error paths
- `architecture-proposal`: Boundaries, interfaces, event flow, tradeoffs
- `component-mockup`: Focused HTML mockups for key components
- `data-flow-diagram`: Text diagram and data movement narrative
- `none-needed`: Explain why artifacts are intentionally skipped

Do not implement production code changes in this stage.
