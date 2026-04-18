# Stop Guidance Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Record a durable stop decision for this design workflow run.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/design-approval.md` (authoritative stop decision)
2. `$goal_file` (the ticket.md bridge artifact)
3. `$artifact_dir/shape.md`
4. `$artifact_dir/design-review.md`
5. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to update `$goal_file`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Update `$goal_file` in place so it is clearly not ready for Delivery.

## Requirements

The latest review cycle in `design-approval.md` is the authoritative stop decision.
Preserve the original problem framing and current package references.
Ensure ticket.md reflects:

- Ticket title
- Status showing stopped in design guidance (not ready for delivery)
- Concise summary of why the run stopped
- Latest `Guidance before stopping`
- Any follow-up conditions for future restart

Do not mark as `Ready for Delivery`.
Do not silently discard existing design brief or review references.
Do not implement code changes in this stage.
