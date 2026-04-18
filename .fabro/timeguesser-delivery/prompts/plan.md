# Plan Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the implementation plan for this ticket.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/spec.md`
2. `$goal_file` (the ticket.md bridge artifact)
3. ADRs only when spec.md explicitly lists them under "Related ADRs"
4. `$workspace_root/TimeGuesser/AGENTS.md` only when policy-boundary confirmation is needed
5. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/plan.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write the implementation plan to: `$artifact_dir/plan.md`

## Requirements

- Include traceable implementation steps (P001, P002, etc.)
- Include file touchpoints, validation checkpoints, and decision boundaries
- Call out ask-first items explicitly
- Keep the plan specific enough that implementation can proceed without improvising
- Keep scoped to the approved experiment only
- Do not implement changes in this stage
