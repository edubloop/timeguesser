# Design Review Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Write or update the design review artifact for this ticket.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. All files in `$artifact_dir/drafts/` when the directory exists
5. `$workspace_root/TimeGuesser/TIMEGUESSER_DESIGN_SYSTEM.md`
6. `$artifact_dir/design-approval.md` when it exists
7. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/design-review.md`
- `glob` — only to list `$artifact_dir/drafts/*`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- Broad `glob` patterns beyond the specific drafts directory
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write to: `$artifact_dir/design-review.md`

## Requirements

Include:

- Scope reviewed
- Artifact coverage assessment across selected artifact types
- Artifact quality findings with evidence
- Missing artifact flags when expected artifacts are absent
- Prioritized findings with evidence
- Simplification options when direction is too broad
- Verdict: `Proceed`, `Proceed with changes`, or `Re-scope`
- Whether the ticket is ready for Delivery
- Handoff fields aligned to mode-handoff-schema

Focus on scope fit, taste/system consistency, clarity of chosen direction.
Do not implement code changes in this stage.
