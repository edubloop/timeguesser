Publish the approved design outcome into a delivery-ready goal file.

Requirements:

- Read `ticket.md`, `design-brief.md`, and `design-review.md` before writing.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before normalizing delivery handoff fields.
- Update `ticket.md` in place so it becomes the canonical goal file for the Delivery workflow.
- Preserve the original problem framing, but normalize the document for execution readiness.
- Ensure the final `ticket.md` includes:
  - ticket title and status (`Ready for Delivery`)
  - concise summary of the approved direction
  - constraints and non-goals
  - success criteria and validation expectations
  - relevant evidence paths (design references, explorations, Maestro taste flow, pipeline-inspector evidence when applicable)
  - explicit ask-first boundaries
  - Delivery handoff fields aligned to `$workspace_root/.workspace-notes/mode-handoff-schema.md`
- If the design review recommended guidance-only output or re-scope, do not silently mark the ticket ready.

Do not implement code changes in this stage.
