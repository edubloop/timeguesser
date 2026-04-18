# Apply Reviewer Revisions Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Apply the latest binding reviewer decision to the design package.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/design-approval.md` (treat latest cycle as highest priority)
2. `$goal_file` (the ticket.md bridge artifact)
3. `$artifact_dir/shape.md`
4. `$artifact_dir/artifact-scope.md`
5. All files in `$artifact_dir/drafts/` when present
6. `$artifact_dir/design-review.md`
7. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to update design artifacts
- `glob` — only to list `$artifact_dir/drafts/*`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- Broad `glob` patterns
- `shell` commands
- `edit_file` (use write_file for artifact updates)

## Output

- Update `$artifact_dir/shape.md`
- Update `$artifact_dir/ticket.md` only if needed for consistency
- Update files under `$artifact_dir/drafts/` if required revisions change artifact content

## Requirements

The latest reviewer decision is binding:

- Keep the approved direction fixed unless reviewer explicitly changed it
- Preserve locked decisions as locked
- Treat explicitly rejected options as closed
- Implement all required changes before next design review pass

Add a `Reviewer decision response` section mapping each required change to revision made.
If a required change conflicts with policy, state the conflict explicitly.
Keep revision bounded to current ticket scope.
Do not reopen locked questions or restore rejected alternatives.
Do not implement code changes in this stage.
