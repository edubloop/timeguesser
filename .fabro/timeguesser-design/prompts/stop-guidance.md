Record a durable stop decision for this design workflow run.

Requirements:

- Read `ticket.md`, `shape.md`, `design-review.md`, and `design-approval.md` before writing.
- Read the repo policy anchor from `ticket.md` only when policy constraints affect the stop guidance.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- The latest review cycle in `design-approval.md` is the authoritative stop decision.
- Update `$artifact_dir/ticket.md` in place so it is clearly not ready for Delivery.
- Preserve the original problem framing and current package references.
- Ensure `ticket.md` reflects:
  - ticket title
  - status showing the package stopped in design guidance rather than ready for delivery
  - concise summary of why the run stopped
  - the latest `Guidance before stopping`
  - any follow-up conditions required before a future design restart
- Do not mark the ticket as `Ready for Delivery`.
- Do not silently discard the existing design brief or design review references.

Do not implement code changes in this stage.
