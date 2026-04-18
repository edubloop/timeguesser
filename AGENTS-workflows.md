# TimeGuesser AGENTS Companion — Workflows

Companion to `TimeGuesser/AGENTS.md`.

## Back To Index

- Core TimeGuesser index: `TimeGuesser/AGENTS.md`

## Fabro Workflows

For non-trivial feature work, use the Fabro-backed intake-first split workflow model.

### Intake workflow

Canonical stages:

1. `Load Intake Context`
2. `Propose Approach` — writes `artifacts/tickets/{ID}/inputs/approach-proposal.md` and seeds `intake.md`
3. `Refine Approach In Chat` — writes or updates `artifacts/tickets/{ID}/inputs/approach-alignment.md` after manual operator chat
4. `Classify Execution Path` — chooses exactly one `execution_path` value:
   - `design_then_delivery`
   - `delivery_only`
   - `quick_capture`
     and normalizes `ticket.md` only when the next phase can proceed

Preferred entrypoint:

- `./scripts/run_fabro_intake.sh <TICKET_ID> <INTAKE_FILE> [fabro args...]`

### Design workflow

Canonical stages:

1. `Load Classified Ticket`
2. `Design Explore` — writes `artifacts/tickets/{ID}/shape.md`
3. `Design Review` — writes `artifacts/tickets/{ID}/design-review.md`
4. `Stage Review Form` — writes or updates `artifacts/tickets/{ID}/design-approval.md`
5. `Human Approval Decision` — human gate in the Fabro local web UI
6. `Revise Per Reviewer Decision` — applies required reviewer changes when the gate selects revision
7. `Publish Ticket` — normalizes `ticket.md` for Delivery after approval as-is

`artifacts/tickets/{ID}/design-approval.md` is the authoritative reviewer decision log for the design chain. If the reviewer chooses revision, that artifact must contain required changes before the workflow can continue, and later design stages must treat its latest review cycle as binding input.

Preferred entrypoint:

- `./scripts/run_fabro_design.sh <TICKET_ID> <TICKET_FILE> [fabro args...]`

### Delivery workflow

Canonical stages:

1. `Spec` — `artifacts/tickets/{ID}/spec.md` (labeled requirements)
2. `Plan` — `artifacts/tickets/{ID}/plan.md` (traceable implementation steps)
3. `Approve` — plan approval and ask-first gate in the Fabro local web UI
4. `Implement` — execute the approved plan
5. `Verify` — run repo-defined checks and QA
6. `Review` — `artifacts/tickets/{ID}/review.md` (intent-aligned review)
7. `Handoff` — `artifacts/tickets/{ID}/handoff.md`

Preferred entrypoint:

- `./scripts/run_fabro_delivery.sh <TICKET_ID> <GOAL_FILE> [fabro args...]`

`ticket.md` is the canonical goal file for Delivery.
`ticket.md` remains required before Delivery even for `delivery_only` tickets.

For complex tickets, `inputs/approach-alignment.md` becomes the authoritative pre-shape intake evidence. Review other files in `inputs/` selectively during Intake only when classification or scope requires them; otherwise keep them indexed for later phases.

Legacy `/spec`, `/plan`, `/implement`, and `/pr-review` flows are migration fallbacks only.

Artifacts live at workspace level (`../artifacts/`). See `.workspace-kit/docs/delivery-chain.md`.
