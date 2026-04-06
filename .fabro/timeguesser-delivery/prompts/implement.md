Implement the approved plan.

Hard constraints to respect:

- Do not change scoring constants, formulas, or hint costs without explicit approval.
- Do not add dependencies without explicit approval.
- Do not change `app.json` or `eas.json` without explicit approval.
- Do not change AsyncStorage keys without explicit approval.
- Do not change the provider order in `app/_layout.tsx`.
- Do not add new external APIs beyond the approved allowlist.
- Do not grow `app/(tabs)/game.tsx` if new logic can be extracted.

Execution requirements:

- Read `plan.md` first.
- Read the repo policy anchor from `ticket.md` or `spec.md`. Default: `AGENTS.md`.
- Read `Workspace policy anchor` only when `ticket.md` or `spec.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md`, `spec.md`, or `plan.md` explicitly lists them; if they say `None`, do not read architecture docs.
- Follow the approved `plan.md`.
- Keep changes minimal and traceable.
- Update existing files before creating new ones where practical.
- Do not run repo-wide verification commands in this stage; implementation should stop at code and direct local reasoning, and the dedicated Verify stage should own repo checks.
- If an ask-first boundary is required, stop and summarize it instead of pushing through.
