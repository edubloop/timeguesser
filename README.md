# TimeGuesser

TimeGuesser is an Expo React Native iOS game where players guess where and when a photo was taken.

## Quick Start

- Install deps: `npm install`
- Run app: `npm run ios` (or `npm run start`)
- Run static checks + unit tests: `npm run check`
- Run tests only: `npm run test`
- Run mobile QA smoke flow (Maestro): `npm run test:maestro:smoke`
- Run mobile QA full suite (Maestro): `npm run test:maestro`
- Auto-start Metro + run smoke (keeps Metro running): `npm run test:maestro:smoke:auto`
- Auto-start Metro + run full suite (keeps Metro running): `npm run test:maestro:auto`
- Launch the Fabro Intake wrapper: `npm run fabro:intake -- <TICKET_ID> <INTAKE_FILE>`
- Launch the Fabro Design wrapper: `npm run fabro:design -- <TICKET_ID> <TICKET_FILE>`
- Launch the Fabro Delivery wrapper: `npm run fabro:delivery -- <TICKET_ID> <GOAL_FILE>`

## Maestro QA Flows

- Canonical flow folder: `.maestro/`
- Smoke flow (fast): `npm run test:maestro:smoke`
- Run all flows in sequence: `npm run test:maestro`
- One-shot with automatic Metro startup: append `:auto` script variants
- Requires Metro/dev client running first (for dev builds): `npm run ios`
- Screenshots from `takeScreenshot` are auto-archived to `.maestro/artifacts/<timestamp>/`
- **CI:** Maestro runs automatically only on release tags (`v*`). Run locally for PR validation.
- Current canonical flows:
  - `.maestro/photo-viewer.yaml`
  - `.maestro/game-full-round.yaml`
  - `.maestro/hint-tiers.yaml`
  - `.maestro/settings-navigation.yaml`

## Architecture At A Glance

- App shell and routing: `app/`
- Reusable UI: `components/`
- Domain logic and state: `lib/`
- Design and scoring constants: `constants/`

Provider chain (load-bearing):

`ThemeProvider -> SettingsProvider -> GameProvider -> NavThemeProvider -> Stack`

## Agent Workflow

1. Read `AGENTS.md` first for hard constraints.
2. Read `TIMEGUESSER_SPEC.md` and `TIMEGUESSER_DESIGN_SYSTEM.md`.
3. Map request to files via `AGENT_TASK_INDEX.md`.
4. For non-trivial work, seed `../artifacts/tickets/<ID>/intake.md` from the selected backlog item.
5. Run the Fabro Intake workflow from `./scripts/run_fabro_intake.sh`.
6. If `execution_path=design_then_delivery`, run the Fabro Design workflow from `./scripts/run_fabro_design.sh` using `ticket.md`.
7. Review `ticket.md`, `shape.md`, `design-review.md`, and `design-approval.md` in the Fabro UI when design is applicable.
8. Run the Fabro Delivery workflow from `./scripts/run_fabro_delivery.sh` using `ticket.md` after intake classifies the ticket as `delivery_only`, or after design is approved and published for `design_then_delivery`.
9. Use the control plane operator shell to approve the plan and inspect the run.
10. Make minimal scoped changes.
11. Run `npm run check` before handing off.

## Safe To Edit

- `components/**`
- Most of `lib/**` for feature work
- `app/(tabs)/**` for screen behavior

## Requires Explicit Approval

- Adding dependencies in `package.json`
- Creating new top-level directories
- Changing provider order in `app/_layout.tsx`
- Editing `app.json` or `eas.json`
- Changing AsyncStorage keys
- Increasing complexity in `app/(tabs)/game.tsx` (prefer extraction)

## Key Docs

- Constraints and guardrails: `AGENTS.md`
- Product and technical spec: `TIMEGUESSER_SPEC.md`
- Design tokens and rules: `TIMEGUESSER_DESIGN_SYSTEM.md`
- Fabro runtime docs: `.fabro/README.md`
- Repo backlog: `BACKLOG.md`
- Active performance plan and rationale: `PERFORMANCE_PLAN.md`
- Future non-scope items: `future_roadmap.md`
- Task-to-file routing: `AGENT_TASK_INDEX.md`
