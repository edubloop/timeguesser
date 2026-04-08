Create or update the design exploration brief for this ticket.

Requirements:

- Read `ticket.md` first.
- Read the repo policy anchor from `ticket.md` only when policy constraints materially affect the design output.
- Read `Workspace policy anchor` only when `ticket.md` explicitly includes one.
- Read `Related ADRs` only when `ticket.md` explicitly lists them; if it says `None`, do not read architecture docs.
- Read `TIMEGUESSER_DESIGN_SYSTEM.md`, `design-references/`, `design-explorations/`, and `.maestro/design-taste.yaml` when relevant to the selected ticket.
- Read `$workspace_root/.workspace-notes/mode-handoff-schema.md` before writing handoff fields.
- Read `tools/pipeline-inspector/` only when the ticket touches content quality or internal tooling.
- Read `design-approval.md` when it exists.
- Write to `$artifact_dir/shape.md`.
- Prefer repo-native outputs as the durable artifact. OpenPencil may be referenced or recommended, but the workflow must remain valid without it.
- Produce 2-3 plausible directions or one refined direction when the scope is already narrow.
- If `design-approval.md` exists and its latest review cycle chose `Revise with required changes`, treat that cycle as binding reviewer input:
  - preserve the approved direction unless the reviewer explicitly changed it
  - preserve locked decisions as fixed
  - keep rejected options closed
  - only use `Allowed flexibility for next pass` as the permitted space for reinterpretation
- Add a concise section in `shape.md` explaining how the current brief responds to the latest reviewer decision when applicable.
- Record:
  - design intent and target user moment
  - relevant references/evidence paths
  - candidate directions and tradeoffs
  - recommended direction
  - risks, unresolved questions, and what should carry forward
  - handoff fields for Design Review aligned to `$workspace_root/.workspace-notes/mode-handoff-schema.md`
- If the work is not primarily visual, keep this artifact compact and focus on interaction, evidence, and UX implications.

Do not implement code changes in this stage.
