Write or update the design review artifact for this ticket.

Requirements:

- Read `ticket.md` and `shape.md` first.
- Read the repo policy anchor from `ticket.md` when policy or bounded-scope constraints materially affect the review.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md` explicitly lists them; if it says `None`, do not read architecture docs.
- Read `TIMEGUESSER_DESIGN_SYSTEM.md` before writing.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before writing handoff fields.
- Use `.maestro/design-taste.yaml` as a reference for taste and consistency expectations when relevant.
- Read `design-approval.md` when it exists.
- Focus on scope fit, taste/system consistency, clarity of the chosen direction, and readiness for Delivery.
- Write to `$artifact_dir/design-review.md`.
- If `design-approval.md` exists and its latest review cycle chose `Revise with required changes`, review against that reviewer decision explicitly.
- Include:
  - scope reviewed
  - prioritized findings with evidence
  - simplification options when the direction is too broad
  - verdict: `Proceed`, `Proceed with changes`, or `Re-scope`
  - whether the ticket is ready for Delivery now or should stop at design guidance
  - explicit status for each required reviewer change: `Satisfied`, `Partially satisfied`, `Not satisfied`, or `In conflict with constraints`
  - handoff fields aligned to `$workspace_root/.workspace-notes/mode-handoff-schema.md`

Do not implement code changes in this stage.
