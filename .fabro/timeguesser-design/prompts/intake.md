# Intake Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the ticket intake brief for this run.

## Required Reading

Read exactly these files in order:

1. `$source_file` (the selected backlog item or source brief)
2. `$workspace_root/TimeGuesser/AGENTS.md`
3. `$workspace_root/TimeGuesser/TIMEGUESSER_SPEC.md`
4. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md`
5. `$workspace_root/TimeGuesser/BACKLOG.md`
6. ADRs only when the source file explicitly cites them
7. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/ticket.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns like `**/*.md`
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write the intake brief to: `$artifact_dir/ticket.md`

## Requirements

Convert the selected backlog item into a concise experiment-intake style ticket.
Include:

- Intent, user/problem/moment
- Product, UX, and technical hypotheses
- Success and failure signals
- Minimum experiment
- Constraints and non-goals
- Ask-first boundaries
- Implementation direction

Normalize routing hints:

- `Policy anchor: AGENTS.md`
- `Related ADRs:` with explicit paths or `None`

Keep scope minimal and decision-ready.
Do not implement code changes in this stage.
