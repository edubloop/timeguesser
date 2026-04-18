# Publish Ticket Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Publish the approved design outcome into a delivery-ready goal file.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/shape.md`
3. `$artifact_dir/design-review.md`
4. `$artifact_dir/design-approval.md`
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

Update `$goal_file` in place so it becomes the canonical goal file for Delivery.

## Requirements

Treat the latest review cycle in `design-approval.md` as the authoritative human decision.
Preserve the original problem framing, but normalize for execution readiness.

Ensure the final ticket.md includes:

- Ticket title and status (`Ready for Delivery`)
- Policy anchor references
- Concise summary of the approved direction
- Constraints and non-goals
- Success criteria and validation expectations
- Explicit ask-first boundaries

Only use locked decisions and approved direction from the latest review cycle.
Do not reopen locked questions or restore rejected options.
If latest review cycle is not `Approve as-is`, do not silently mark ready.
Do not implement code changes in this stage.
