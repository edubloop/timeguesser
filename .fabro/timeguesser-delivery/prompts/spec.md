Create or update the ticket spec for this run.

Requirements:

- Read `ticket.md` first.
- Read the repo policy anchor from `ticket.md`. Default: `AGENTS.md`.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md` explicitly lists them; if it says `None`, do not read architecture docs.
- Read `TIMEGUESSER_SPEC.md` and `TIMEGUESSER_DESIGN_SYSTEM.md` before writing.
- Treat the provided `ticket.md` goal file as the approved design/intake source for Delivery.
- Treat the repo policy anchor as the primary policy source of truth for this stage.
- Write to the ticket's `spec.md` in the workspace artifact directory.
- Use the labeled requirement structure from the workspace-kit spec template.
- Keep scope minimal and experiment-oriented.
- Make risks and open questions explicit.
- Write `### Related ADRs` explicitly as concrete paths or `None`.
- Do not reopen design exploration except to note a blocking ambiguity that requires escalation.

Do not implement changes in this stage.
