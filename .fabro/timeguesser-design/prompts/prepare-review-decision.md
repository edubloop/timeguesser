# Prepare Review Decision Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the durable human review decision log for this ticket.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. All files in `$artifact_dir/drafts/` when present
5. `$artifact_dir/design-review.md`
6. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/design-approval.md`
- `glob` — only to list `$artifact_dir/drafts/*`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- Broad `glob` patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write to: `$artifact_dir/design-approval.md`

## Requirements

Treat `design-approval.md` as the authoritative reviewer decision log.
Preserve all prior review cycles. Append exactly one new review cycle section.

Each cycle must include:

- `## Review cycle N`
- Ticket id, updated date, package reviewed, artifacts reviewed
- Current package summary and recommended direction
- Design review verdict and delivery-readiness recommendation
- Gate note, decision status, approved direction
- `### Locked decisions`
- `### Required changes before approval`
- `### Explicitly rejected options`
- `### Allowed flexibility for next pass`

Decision semantics:

- `Approve as-is` — package approved including raised issues
- `Revise with required changes` — actionable items remain
- `Stop with guidance only` — design should not proceed to delivery

Do not implement code changes in this stage.
