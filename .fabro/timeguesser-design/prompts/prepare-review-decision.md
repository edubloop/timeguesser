Create or update the durable human review decision log for this ticket.

Requirements:

- Read `ticket.md`, `design-brief.md`, and `design-review.md` before writing.
- Read the repo policy anchor from `ticket.md` only when policy context is needed to explain a decision boundary or conflict.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before writing.
- Write to `$artifact_dir/design-approval.md`.
- Treat `design-approval.md` as the authoritative reviewer decision log for the design workflow.
- Preserve all prior review cycles. Do not delete or rewrite older cycle sections except for minor factual corrections.
- Append exactly one new review cycle section for the current package if the latest cycle does not already correspond to the current `design-review.md` update.
- In the new review cycle, prefill:
  - ticket id
  - updated date
  - package reviewed paths
  - current package summary
  - current recommended direction
  - current design-review verdict and delivery-readiness recommendation
- Leave the human-owned decision fields clearly marked for operator completion.
- Decision semantics must be explicit in the artifact:
  - `Approve as-is` means the package is approved including issues raised in the latest
    `design-review.md` for that cycle.
  - `Revise with required changes` means actionable items remain under `### Required changes before approval`.
  - `Stop with guidance only` means design should not proceed to delivery until a new decision cycle changes that state.
- Use this structure for each cycle:
  - `## Review cycle N`
  - `- Updated:`
  - `- Package reviewed:`
  - `- Current package summary:`
  - `- Current recommended direction:`
  - `- Design review verdict:`
  - `- Delivery readiness recommendation:`
  - `- Gate note:`
  - `- Decision status:`
  - `- Approved direction:`
  - `### Locked decisions`
  - `### Required changes before approval`
  - `### Explicitly rejected options / decisions`
  - `### Allowed flexibility for next pass`
  - `### Guidance for Delivery`
  - `### Guidance before stopping`
  - `### Notes`
- Set default placeholders so validation can distinguish incomplete reviewer input:
  - `Gate note`: `Optional supplementary note from Fabro UI; this artifact remains authoritative.`
  - `Decision status`: `Pending human decision`
  - `Approved direction`: `Pending human decision`
  - `Required changes before approval`: `- None`
  - `Guidance for Delivery`: `- None`
  - `Guidance before stopping`: `- None`
- Add a short instruction near the top of the file telling the human to complete the latest cycle before selecting a branch in the Fabro UI.

Do not implement code changes in this stage.
