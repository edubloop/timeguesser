Implement the approved plan.

Hard constraints to respect:

- If `AGENTS.md` requires the workspace session-start check, run `bash $workspace_root/.workspace-notes/cadence_due_check.sh`. If that reports `[DUE]`, then run `bash $workspace_root/.workspace-notes/harness_healthcheck.sh` and follow the logging instruction in `AGENTS.md`.
- Do not change scoring constants, formulas, or hint costs without explicit approval.
- Do not add dependencies without explicit approval.
- Do not change `app.json` or `eas.json` without explicit approval.
- Do not change AsyncStorage keys without explicit approval.
- Do not change the provider order in `app/_layout.tsx`.
- Do not add new external APIs beyond the approved allowlist.
- Do not grow `app/(tabs)/game.tsx` if new logic can be extracted.

Execution requirements:

- Follow the approved `plan.md`.
- Keep changes minimal and traceable.
- Update existing files before creating new ones where practical.
- If an ask-first boundary is required, stop and summarize it instead of pushing through.
