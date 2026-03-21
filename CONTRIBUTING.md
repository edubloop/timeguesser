# Contributing

## Development Setup

- Install dependencies with `npm install`
- Start local development with `npm run ios` or `npm run start`
- Run static checks with `npm run check`

## Branch and Commit Conventions

- Branch naming: `feature/<short-topic>`, `fix/<short-topic>`, `chore/<short-topic>`
- Commit messages should be concise and explain intent (why), not only file changes

## Pull Request Expectations

- Keep PR scope focused to one concern
- Include a short summary and test/verification notes
- Confirm hard constraints in `AGENTS.md` were preserved
- Add an entry to `CHANGELOG.md` under `[Unreleased]` for every PR

## File Ownership Guide

- Gameplay flow and UI: `app/(tabs)/`
- Shared UI pieces: `components/`
- Core logic (scoring, hints, photos, settings): `lib/`
- Global design and scoring constants: `constants/`

## Agent-Friendly Change Rules

- Prefer editing existing files over creating new structure
- Extract new logic from large files instead of growing them (`app/(tabs)/game.tsx`, `lib/photos.ts`)
- Do not introduce new dependencies or top-level folders without explicit approval

## Code Quality

- **Format:** run `npm run format` before committing. Pre-commit hooks enforce this automatically
  (installed via `npm install` — hooks are set up by `simple-git-hooks`).
- **Lint:** `npm run lint` must report zero errors and zero warnings.
- **Types:** `npm run typecheck` must pass with no errors.
- **Tests:** all existing tests must pass; new behaviour requires a new test.
- **Maestro UI QA:** when a PR changes UI or navigation behavior, run smoke `npm run test:maestro:smoke:auto`; run full `npm run test:maestro:auto` before merge and include results in PR notes.

Run `npm run check` to execute typecheck + lint + tests in one step.

## Performance Regression Checklist

When a PR touches performance-sensitive areas (`app/(tabs)/game.tsx`, `components/MapView/**`,
`components/ScoreReveal/**`, `components/RoundTimer/**`, `lib/SettingsContext.tsx`), run this
quick manual pass in simulator before opening the PR:

- Enable Performance Monitor (simulator: `Cmd + D` -> `Show Performance Monitor`).
- Flow 1: Home -> Start Game -> Game ready.
- Flow 2: Map interaction + hints modal open/close.
- Flow 3: Submit guess -> score reveal -> details expand/collapse.
- Record lowest observed UI/JS FPS and brief notes.
- Add results to `PERFORMANCE_PLAN.md` Execution Log (before/after if available).

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]

### Added

- Short description of new feature

### Fixed

- Short description of bug fix

### Changed

- Short description of behaviour change
```

## Dependency Updates

- Pin dependencies to known-good versions.
- Run `npm audit` after any dependency update.
- Document accepted CVEs or known-unfixable vulnerabilities with an inline comment.
- Do not introduce new dependencies without explicit approval (see `AGENTS.md`).

<!-- TimeGuesser is non-safety-critical (Tier 1). Safety-critical section not applicable. -->
<!-- If this project ever adds safety-critical modules, add a section here referencing  -->
<!-- workspace-kit/docs/safety-critical-changes.md for the full review pattern.         -->

## Questions

Open an issue or start a discussion on GitHub. Do not include credentials or personal
information in issues, discussions, or PRs.
