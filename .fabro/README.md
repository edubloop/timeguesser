# TimeGuesser Fabro Runtime

This directory holds the repo-local Fabro assets for TimeGuesser's two-workflow model:

1. **Design workflow** — turns a selected backlog item into a delivery-ready ticket package
2. **Delivery workflow** — turns the approved ticket package into spec, plan, code, review, and handoff artifacts

## Canonical entrypoints

Use the wrapper scripts from the repo root:

```sh
./scripts/run_fabro_design.sh <TICKET_ID> <SOURCE_FILE> [fabro args...]
./scripts/run_fabro_delivery.sh <TICKET_ID> <GOAL_FILE> [fabro args...]
```

Examples:

```sh
./scripts/run_fabro_design.sh TG-101 ../artifacts/tickets/TG-101/source.md --preflight
./scripts/run_fabro_design.sh TG-101 ../artifacts/tickets/TG-101/source.md
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --preflight
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md
```

## Operator flow

1. Seed `../artifacts/tickets/<TICKET_ID>/source.md` from a selected backlog item.
2. Run the Design workflow to produce:
   - `ticket.md`
   - `design-brief.md`
   - `design-review.md`
3. Use the local Fabro web UI to review the design outputs and approve or stop.
4. Run the Delivery workflow using `ticket.md` as the goal file.
5. Use the UI to approve the implementation plan, inspect logs, and follow verification.
6. Review all outputs under `../artifacts/tickets/<TICKET_ID>/`.

## Artifact contract

Each selected ticket directory should converge on:

- `source.md`
- `ticket.md`
- `design-brief.md`
- `design-review.md`
- `spec.md`
- `plan.md`
- `review.md`
- `handoff.md`

## Scope boundaries

- `AGENTS.md` remains the policy source of truth.
- Design stages prefer repo-native artifacts as durable outputs; OpenPencil is optional.
- Delivery stages should not reopen design exploration except for minimal clarification.
- TimeGuesser verification rules stay explicit:
  - default: `npm run check`
  - UI smoke: `npm run test:maestro:smoke:auto`
  - final UI handoff: `npm run test:maestro:auto`
