# Changelog

All notable changes to TimeGuesser will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ESLint + Prettier (`eslint.config.mjs`, `.prettierrc.json`) with TypeScript and React rules
- Pre-commit hooks via `lint-staged` + `simple-git-hooks` — auto-format and lint on commit
- `npm audit` step in CI to catch high-severity dependency vulnerabilities
- PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- Workspace-level `AGENTS.md` and `WORKSPACE_AUDIT.md` at repository root

### Fixed

- `RoundTimer`: moved `useThemeColor` hook call above early-return guard (rules-of-hooks violation)
- `+not-found`: escaped apostrophe in JSX text (`doesn't` → `doesn&apos;t`)
