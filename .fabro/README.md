# TimeGuesser Fabro Runtime

This directory holds the repo-local Fabro assets for TimeGuesser's approach-first intake and split workflow model:

1. **Intake workflow** — proposes an approach from a backlog item, refines it through manual chat, then classifies and normalizes `ticket.md` when the next phase can proceed
2. **Design workflow** — turns the classified ticket into an approved shaping package when `execution_path=design_then_delivery`
3. **Delivery workflow** — turns the approved or explicitly delivery-only ticket package into spec, plan, code, review, and handoff artifacts

## Canonical entrypoints

Use the wrapper scripts from the repo root:

```sh
./scripts/run_fabro_intake.sh <TICKET_ID> <INTAKE_FILE> [fabro args...]
./scripts/run_fabro_design.sh <TICKET_ID> <TICKET_FILE> [fabro args...]
./scripts/run_fabro_delivery.sh <TICKET_ID> <GOAL_FILE> [fabro args...]
```

Examples:

```sh
./scripts/run_fabro_intake.sh TG-101 ../artifacts/tickets/TG-101/intake.md --preflight
./scripts/run_fabro_intake.sh TG-101 ../artifacts/tickets/TG-101/intake.md
./scripts/run_fabro_design.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --preflight
./scripts/run_fabro_design.sh TG-101 ../artifacts/tickets/TG-101/ticket.md
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md --preflight
./scripts/run_fabro_delivery.sh TG-101 ../artifacts/tickets/TG-101/ticket.md
```

## Operator flow

1. Seed `../artifacts/tickets/<TICKET_ID>/intake.md` from a selected backlog item.
2. Run the Intake workflow to:
   - generate `inputs/approach-proposal.md`
   - refine the approach with the operator in manual chat
   - generate `inputs/approach-alignment.md`
   - classify `execution_path`
   - write explicit applicability and provenance metadata
   - normalize `ticket.md` only after the aligned approach exists and Design or Delivery should start next
3. If `execution_path=design_then_delivery`, run the Design workflow to produce:
   - `ticket.md`
   - `shape.md`
   - `design-review.md`
   - `design-approval.md`
4. Use the control plane operator shell (with Fabro UI as needed) to review the design outputs.
5. Complete the latest review cycle in `design-approval.md`, then choose a branch in the design approval gate.
6. Run the Delivery workflow using `ticket.md` as the goal file:
   - immediately after Intake when `execution_path=delivery_only`
   - only after `Approve As-Is` and `Publish Ticket` when `execution_path=design_then_delivery`
7. Use the control plane operator shell to approve the implementation plan, inspect logs, and follow verification.
8. Review all outputs under `../artifacts/tickets/<TICKET_ID>/`.

## Artifact contract

Each selected ticket directory should converge on:

- `intake.md`
- `inputs/approach-proposal.md`
- `inputs/approach-alignment.md`
- `ticket.md`
- `shape.md`
- `design-review.md`
- `design-approval.md`
- `spec.md`
- `plan.md`
- `delivery-approval.md`
- `review.md`
- `handoff.md`

Design artifacts are allowed to be `not_applicable` for `delivery_only` tickets. `ticket.md` remains the canonical bridge artifact before Delivery in every non-quick-capture path, but it should only be created after the aligned intake approach exists.

## Authoritative doc loading

TimeGuesser Fabro prompts follow a minimum authoritative-doc contract:

- Always read the current stage's required ticket artifacts.
- Read repo `AGENTS.md` when the stage may shape scope, constraints, implementation, or
  review judgment.
- Read workspace `AGENTS.md` only when `ticket.md` explicitly includes a
  `Workspace policy anchor`.
- Read ADRs only when `ticket.md` or `spec.md` explicitly lists them under
  `Related ADRs`.

The ticket package carries those routing hints:

- `Policy anchor: AGENTS.md`
- optional `Workspace policy anchor: <path>`
- optional `Related ADRs:` section with explicit paths or `None`

## Routing Contract Adoption

TimeGuesser adopts the workspace routing contract in
`.workspace-kit/docs/fabro-model-routing-contract.md` by tagging workflow stages with
shared stage classes (for native Fabro routing) and by using the same classes as the
advisory mapping for manual Codex/Claude runs.

If native routing is unavailable in a future environment, use repo-local run-config
fallbacks that preserve the same stage-class vocabulary rather than inventing new
per-repo class names.

## Scope boundaries

- `AGENTS.md` remains the policy source of truth.
- Design stages prefer repo-native artifacts as durable outputs; OpenPencil is optional.
- `design-approval.md` is the authoritative human decision record for design approval loops.
- `Approve As-Is` at design gates means approve with the latest design-review issues included.
- Supplementary Fabro UI gate notes are optional, but they do not replace the artifact.
- Delivery stages should not reopen design exploration except for minimal clarification.
- Intake should start from the backlog item, write the durable approach pack under `inputs/`, and use manual Codex/Claude chat to converge before classification.
- `inputs/approach-alignment.md` is the authoritative pre-shape intake artifact for complex tickets.
- Intake should review other files in `inputs/` only when classification or scope requires them; otherwise index them for later phases.
- Manual chat refinement must be recorded as manual runtime provenance and must not imply Fabro runtime advancement.
- TimeGuesser verification rules stay explicit:
  - default: `npm run check`
  - UI smoke: `npm run test:maestro:smoke:auto`
  - final UI handoff: `npm run test:maestro:auto`
