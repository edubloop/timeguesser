Create or update the ticket spec for this run.

Requirements:

- If `AGENTS.md` requires the workspace session-start check, run `bash $workspace_root/.workspace-notes/cadence_due_check.sh`. If that reports `[DUE]`, then run `bash $workspace_root/.workspace-notes/harness_healthcheck.sh` and follow the logging instruction in `AGENTS.md`.
- Read `AGENTS.md`, `TIMEGUESSER_SPEC.md`, and `TIMEGUESSER_DESIGN_SYSTEM.md` before writing.
- Treat the provided `ticket.md` goal file as the approved design/intake source for Delivery.
- Treat `AGENTS.md` as the policy source of truth.
- Write to the ticket's `spec.md` in the workspace artifact directory.
- Use the labeled requirement structure from the workspace-kit spec template.
- Keep scope minimal and experiment-oriented.
- Make risks and open questions explicit.
- Do not reopen design exploration except to note a blocking ambiguity that requires escalation.

Do not implement changes in this stage.
