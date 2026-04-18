# Refine Approach Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the aligned intake approach after manual chat refinement.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/intake.md`
2. `$artifact_dir/inputs/approach-proposal.md`
3. `$artifact_dir/inputs/approach-alignment.md` when it already exists
4. Additional authoritative docs only when explicitly cited by the proposal
5. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/inputs/approach-alignment.md` and `$artifact_dir/intake.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

1. Write or update: `$artifact_dir/inputs/approach-alignment.md`
2. Update: `$artifact_dir/intake.md`

## Requirements

In `approach-alignment.md`, capture:

- Chosen direction
- Accepted tradeoffs
- Rejected directions
- Open questions that remain intentionally unresolved
- What Design should treat as fixed

In `intake.md`, record:

- Aligned approach status
- Whether `inputs/` needs further review
- What is fixed for downstream phases
- What remains intentionally unresolved
- Updated machine-readable metadata

Do not create or normalize `ticket.md` in this stage.
Do not implement code changes in this stage.
