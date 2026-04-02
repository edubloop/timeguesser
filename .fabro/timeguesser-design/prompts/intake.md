Create or update the ticket intake brief for this run.

Requirements:

- Read `AGENTS.md`, `TIMEGUESSER_SPEC.md`, `TIMEGUESSER_DESIGN_SYSTEM.md`, and `BACKLOG.md` before writing.
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
  - handoff fields aligned to `.workspace-notes/mode-handoff-schema.md`
- Keep the scope minimal and decision-ready.

Do not implement code changes in this stage.
