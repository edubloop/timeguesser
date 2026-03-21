# TimeGuesser

TimeGuesser is an Expo React Native iOS game where players guess where and when a photo was taken.

## Quick Start

- Install deps: `npm install`
- Run app: `npm run ios` (or `npm run start`)
- Run static checks + unit tests: `npm run check`
- Run tests only: `npm run test`
- Run mobile QA flows (Maestro): `npm run test:maestro`

## Maestro QA Flows

- Canonical flow folder: `.maestro/`
- Run all flows in sequence: `npm run test:maestro`
- Screenshots from `takeScreenshot` are auto-archived to `.maestro/artifacts/<timestamp>/`
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
4. Make minimal scoped changes.
5. Run `npm run check` before handing off.

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
- Active performance plan and rationale: `PERFORMANCE_PLAN.md`
- Future non-scope items: `future_roadmap.md`
- Task-to-file routing: `AGENT_TASK_INDEX.md`
