# Propose Approach Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the initial intake approach proposal for this ticket.

## Required Reading

Read exactly these files in order:

1. `$source_file` (the source backlog item or brief)
2. `$workspace_root/TimeGuesser/AGENTS.md`
3. `$workspace_root/TimeGuesser/TIMEGUESSER_SPEC.md`
4. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md`
5. `$workspace_root/TimeGuesser/BACKLOG.md`
6. ADRs only when explicitly cited by the source file
7. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/inputs/approach-proposal.md` and `$artifact_dir/intake.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns like `**/*.md`
- `shell` commands
- `edit_file` or `apply_patch`

## Output

1. Write initial proposal to: `$artifact_dir/inputs/approach-proposal.md`
2. Seed `$artifact_dir/intake.md` with machine-readable metadata:
   - `Execution path`: pending
   - `Decision reason`: not classified yet
   - `Decision confidence`: low
   - `Artifact applicability`: intake.md=in_progress, ticket.md=pending
   - `Skipped artifacts`: none yet
   - `Runtime provenance`: intake=in_progress

## Requirements

- Treat this stage as proposal-first, not classification-first
- Summarize the goal from the backlog item
- Propose a likely implementation or shaping approach
- Note key uncertainties and constraints
- Recommend a likely next path without locking it yet
- Include recommended discussion points for manual operator chat
- Explicitly state that approach refinement is in progress and `ticket.md` must not be created yet
- Do not implement code changes in this stage
