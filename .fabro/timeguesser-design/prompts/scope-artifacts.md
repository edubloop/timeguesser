# Scope Artifacts Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Create or update the artifact scoping checklist for this design cycle.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/shape.md`
3. `$artifact_dir/design-approval.md` when it exists (for revision cycles)
4. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/artifact-scope.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write to: `$artifact_dir/artifact-scope.md`

## Requirements

If `artifact-scope.md` already exists, treat this as a confirm-or-modify pass:

- Preserve operator decisions unless new reviewer input requires a change
- Refresh recommendations and rationale for the current shape

Include all sections in order:

1. One-paragraph shape summary
2. Artifact type checklist where `[x]` means recommended now:
   - [ ] html-prototype -> `drafts/prototype-{ID}-{slug}.html`
   - [ ] interaction-flow -> `drafts/flow-{ID}-{slug}.md`
   - [ ] architecture-proposal -> `drafts/arch-{ID}-{slug}.md`
   - [ ] component-mockup -> `drafts/mockup-{ID}-{slug}.html`
   - [ ] data-flow-diagram -> `drafts/dataflow-{ID}-{slug}.md`
   - [ ] none-needed -> explicit opt-out for pure infra work
3. Space for operator notes and custom artifact types

Keep the checklist explicit enough that a human can directly toggle selections.
Do not generate artifact files in this stage.
