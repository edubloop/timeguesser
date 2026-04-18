# Classify Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Classify the aligned intake and normalize the bridge artifact for the next phase.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/intake.md`
2. `$artifact_dir/inputs/approach-alignment.md` (must exist before classifying)
3. `$workspace_root/TimeGuesser/AGENTS.md` when policy constraints affect classification
4. ADRs only when intake.md explicitly lists them
5. No other files unless classification requires deeper evidence

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/intake.md` and `$artifact_dir/ticket.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Update `$artifact_dir/intake.md` and create/update `$artifact_dir/ticket.md`.

## Classification Requirements

Choose exactly one `execution_path`:

- `design_then_delivery`
- `delivery_only`
- `quick_capture`

When path is `design_then_delivery` or `delivery_only`:

- Create/update `$artifact_dir/ticket.md` as the canonical bridge artifact
- Add `Approach evidence` reference pointing to `inputs/approach-alignment.md`

When path is `quick_capture`:

- Preserve the intake decision
- Do not pretend the ticket is ready for design or delivery

Record in both files:

- Decision reason
- Decision confidence
- Artifact applicability (done/pending/not_applicable)
- Skipped artifacts
- Per-phase runtime provenance

Keep `ticket.md` concise — frame the work for the next phase, not duplicate intake.
Do not implement code changes in this stage.
