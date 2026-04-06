Create or update the ticket intake brief for this run.

Requirements:

- Read repo `AGENTS.md`, `TIMEGUESSER_SPEC.md`, `TIMEGUESSER_DESIGN_SYSTEM.md`, and `BACKLOG.md` before writing.
- Read workspace `AGENTS.md` only when the selected source item is workspace-level, cross-repo, or explicitly cites a workspace policy anchor.
- Read ADRs only when the selected source input explicitly cites them; if it does not, do not scan `artifacts/architecture/`.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before writing handoff fields.
- Treat `AGENTS.md` as the policy source of truth.
- Read the selected source input at `$source_file`.
- Write to the ticket's `ticket.md` in the workspace artifact directory.
- Convert the selected backlog item or source brief into a concise experiment-intake style ticket.
- Include:
  - intent
  - user/problem/moment
  - product, UX, and technical hypotheses
  - success and failure signals
  - minimum experiment
  - constraints and non-goals
  - ask-first boundaries
  - implementation direction
  - handoff fields aligned to `$workspace_root/.workspace-notes/mode-handoff-schema.md`
- Normalize the routing hints in `ticket.md`:
  - `Policy anchor: AGENTS.md`
  - optional `Workspace policy anchor: <path>` only when relevant
  - `Related ADRs:` with explicit paths or `None`
- Keep the scope minimal and decision-ready.

Do not implement code changes in this stage.
