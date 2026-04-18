# Design Explore Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the design exploration brief for this ticket.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/intake.md` when the ticket references unresolved intake evidence
3. `$artifact_dir/inputs/approach-alignment.md` when present (treat as authoritative)
4. `$workspace_root/TimeGuesser/AGENTS.md`
5. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md`
6. `$workspace_root/TimeGuesser/TIMEGUESSER_SPEC.md`
7. Each file explicitly cited by ticket.md under "Required Reading" or "References"
8. ADRs only when ticket.md explicitly lists them
9. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/shape.md`
- `glob` — only to list specific directories when explicitly needed
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns like `**/*.md`
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write the design brief to: `$artifact_dir/shape.md`

## Requirements

- Produce 2-3 plausible directions or one refined direction when scope is narrow
- Record: design intent, candidate directions, tradeoffs, recommended direction
- Record: recommended artifact types for Artifact Scoping gate
- Record: risks, unresolved questions, what should carry forward
- If design-approval.md exists with "Revise" decision, treat that cycle as binding
- Do not implement code changes in this stage
