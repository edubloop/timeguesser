Apply the latest binding reviewer decision to the design package.

Requirements:

- Read `ticket.md`, `design-brief.md`, `design-review.md`, and `design-approval.md` before writing.
- Read the repo policy anchor from `ticket.md` when reviewer changes may conflict with policy constraints.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md` explicitly lists them; if it says `None`, do not read architecture docs.
- Treat the latest review cycle in `design-approval.md` as the highest-priority instruction source for this stage.
- Write primarily to `$artifact_dir/design-brief.md`.
- Update `$artifact_dir/ticket.md` only if needed to keep the design package internally consistent while the ticket remains in design; do not publish it as delivery-ready in this stage.
- The latest reviewer decision is binding:
  - keep the approved direction fixed unless the reviewer explicitly changed it
  - preserve locked decisions as locked
  - treat explicitly rejected options or decisions as closed
  - implement all required changes before the next design review pass
- Add a concise `Reviewer decision response` section to `design-brief.md` that maps each required change to the revision made.
- If a required change conflicts with an existing repo policy or ticket constraint, state that conflict explicitly in `design-brief.md` rather than silently reinterpreting the reviewer decision.
- Keep the revision bounded to the current ticket scope.
- Do not reopen already locked questions or restore rejected alternatives unless the latest reviewer decision explicitly reopens them.

Do not implement code changes in this stage.
