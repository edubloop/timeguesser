# TypeScript Coding Standards — TimeGuesser

This catalog provides citation-ready TypeScript standards for `TimeGuesser/`.

Use these IDs in specs, reviews, and implementation notes when you need to cite a repo rule precisely. Each entry declares its authority level so citations do not overstate what is mandatory.

Authority labels:

- `policy` — declared as a repo rule or required workflow
- `enforced` — backed directly by tooling or config in the repo
- `convention` — useful team guidance reflected in repo docs or established workflow, but not a hard gate by itself

## TGS-001 — Scoring constants are locked unless explicitly approved

- Authority: `policy`
- Rule: Do not change scoring constants, score formulas, or hint costs without explicit approval.
- Why: These values are load-bearing for game balance and are called out as hard constraints.
- Source anchors:
  - `AGENTS.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`

## TGS-002 — Use design-system tokens instead of hard-coded UI values

- Authority: `policy`
- Rule: Use repo design tokens for color, spacing, radius, and typography rather than introducing hard-coded values.
- Why: The repo treats the design system as the source of truth for UI consistency.
- Source anchors:
  - `AGENTS.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`

## TGS-003 — No new dependencies without approval

- Authority: `policy`
- Rule: Do not add packages or change dependency posture without explicit approval.
- Why: Dependency changes are an ask-first boundary in the repo workflow.
- Source anchors:
  - `AGENTS.md`

## TGS-004 — Keep the provider chain stable

- Authority: `policy`
- Rule: Do not reorder or casually alter the provider chain in `app/_layout.tsx`.
- Why: The provider order is treated as a load-bearing architectural invariant.
- Source anchors:
  - `AGENTS.md`

## TGS-005 — New external APIs or backend behavior are out of bounds without approval

- Authority: `policy`
- Rule: Do not add new external APIs, backend behavior, or network scope beyond the approved allowlist without explicit approval.
- Why: The app is intentionally on-device and the repo defines a narrow network boundary.
- Source anchors:
  - `AGENTS.md`

## TGS-006 — `npm run check` is the baseline quality gate

- Authority: `enforced`
- Rule: The baseline validation command is `npm run check`, which chains typecheck, lint, and unit tests.
- Why: The repo packages core validation into one standard command for local and CI use.
- Source anchors:
  - `package.json`
  - `.github/PULL_REQUEST_TEMPLATE.md`

## TGS-007 — ESLint warnings are treated as failing output

- Authority: `enforced`
- Rule: Lint output must stay warning-free under the repo command because `eslint . --max-warnings 0` treats warnings as failure.
- Why: The repo does not allow “warning-only” lint debt in the normal lint command.
- Source anchors:
  - `package.json`
  - `eslint.config.mjs`

## TGS-008 — Prettier formatting is part of the repo contract

- Authority: `enforced`
- Rule: Format TypeScript, JSON, and Markdown using the repo Prettier configuration and existing formatting commands/hooks.
- Why: Formatting behavior is codified in `.prettierrc.json`, `lint-staged`, and repo scripts.
- Source anchors:
  - `.prettierrc.json`
  - `package.json`

## TGS-009 — PRs stay focused and update changelog context

- Authority: `policy`
- Rule: Keep PR scope focused on one concern and update `CHANGELOG.md` under `[Unreleased]` when applicable.
- Why: The PR template makes both expectations explicit for normal contribution flow.
- Source anchors:
  - `.github/PULL_REQUEST_TEMPLATE.md`

## TGS-010 — Extract new complexity instead of growing `game.tsx`

- Authority: `policy`
- Rule: Do not make `app/(tabs)/game.tsx` larger; extract new logic into other components or modules instead.
- Why: The repo explicitly calls out this file as already too large and a refactoring candidate.
- Source anchors:
  - `AGENTS.md`

## TGS-011 — Respect React and TypeScript lint conventions in repo config

- Authority: `enforced`
- Rule: Follow the repo ESLint configuration, including React hooks rules, unused-variable handling, and the documented exceptions such as `@typescript-eslint/no-explicit-any` being a warning rather than an error.
- Why: Repo TypeScript standards are partially expressed through the lint configuration rather than prose alone.
- Source anchors:
  - `eslint.config.mjs`
