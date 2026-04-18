# Spec Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the ticket spec for this run.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$workspace_root/TimeGuesser/AGENTS.md` (repo policy anchor)
3. `$workspace_root/TimeGuesser/TIMEGUESSER_SPEC.md`
4. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md`
5. Each file explicitly listed under "Required Reading" or "References" in the goal file
6. ADRs only when goal file explicitly lists them under "Related ADRs"
7. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/spec.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search` — no external documentation needed
- `glob` with broad patterns like `**/*.md` — files are enumerated above
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write the delivery spec to: `$artifact_dir/spec.md`

## Requirements

- Label all functional requirements with IDs (F001, F002, etc.)
- Treat ticket.md as the approved design/intake source for Delivery
- Keep scope minimal and experiment-oriented
- Make risks and open questions explicit
- Write `### Related ADRs` explicitly as concrete paths or `None`
- Do not reopen design exploration except to note blocking ambiguities
- Do not implement changes in this stage
