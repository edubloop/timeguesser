Publish the approved design outcome into a delivery-ready goal file.

Requirements:

- Read `ticket.md`, `design-brief.md`, `design-review.md`, and `design-approval.md` before writing.
- Read the repo policy anchor from `ticket.md` when policy constraints affect the delivery-ready contract.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md` explicitly lists them; if it says `None`, do not read architecture docs.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before normalizing delivery handoff fields.
- Update `ticket.md` in place so it becomes the canonical goal file for the Delivery workflow.
- Treat the latest review cycle in `design-approval.md` as the authoritative human decision.
- Preserve the original problem framing, but normalize the document for execution readiness.
- Ensure the final `ticket.md` includes:
  - ticket title and status (`Ready for Delivery`)
  - `Policy anchor: AGENTS.md`
  - optional `Workspace policy anchor: <path>` only when relevant
  - `Related ADRs:` with explicit paths or `None`
  - concise summary of the approved direction
  - constraints and non-goals
  - success criteria and validation expectations
  - relevant evidence paths (design references, explorations, Maestro taste flow, pipeline-inspector evidence when applicable)
  - explicit ask-first boundaries
  - Delivery handoff fields aligned to `$workspace_root/.workspace-notes/mode-handoff-schema.md`
- Only use locked decisions and approved direction from the latest review cycle when normalizing the delivery goal.
- Do not reopen already locked questions or restore explicitly rejected options unless the latest review cycle explicitly reopens them.
- If the latest review cycle is not `Approve as-is`, or if the design review recommended guidance-only output or re-scope, do not silently mark the ticket ready.

Do not implement code changes in this stage.
