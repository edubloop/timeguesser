Create or update the implementation plan for this ticket.

Requirements:

- If `AGENTS.md` requires the workspace session-start check, run `bash $workspace_root/.workspace-notes/cadence_due_check.sh`. If that reports `[DUE]`, then run `bash $workspace_root/.workspace-notes/harness_healthcheck.sh` and follow the logging instruction in `AGENTS.md`.
- Read the current `spec.md` before writing.
- Include traceable implementation steps, file touchpoints, validation checkpoints, and decision boundaries.
- Call out any ask-first items explicitly.
- Keep the plan specific enough that implementation can proceed without improvising.
- Keep the plan scoped to the approved experiment only.

Do not implement changes in this stage.
