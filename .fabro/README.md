# TimeGuesser Fabro Runtime

This directory holds the repo-local Fabro assets for TimeGuesser Delivery mode.

## Canonical entrypoint

Use the wrapper script from the repo root:

```sh
./scripts/run_fabro_delivery.sh <TICKET_ID> <GOAL_FILE> [fabro args...]
```

Examples:

```sh
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --preflight
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --dry-run
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md
```

## Operator flow

1. Start the run with the wrapper script.
2. Open the local Fabro web UI to approve the plan and inspect the run.
3. Use the UI or CLI to inspect logs, assets, and checkpoints.
4. Review outputs under `../artifacts/tickets/<TICKET_ID>/`.

## Scope boundaries

- `AGENTS.md` remains the policy source of truth.
- This directory only defines Delivery execution.
- TimeGuesser verification rules stay explicit:
  - default: `npm run check`
  - UI smoke: `npm run test:maestro:smoke:auto`
  - final UI handoff: `npm run test:maestro:auto`
