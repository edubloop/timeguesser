# Changelog

All notable changes to TimeGuesser will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-source image pipeline: Wikimedia Commons + Library of Congress + Europeana
- Gap-driven cache fill algorithm with era-targeted query dispatch and per-era pagination
- Reverse geocoding for photo location labels (Nominatim fallback)
- ESLint + Prettier (`eslint.config.mjs`, `.prettierrc.json`) with TypeScript and React rules
- Pre-commit hooks via `lint-staged` + `simple-git-hooks` — auto-format and lint on commit
- `npm audit` step in CI to catch high-severity dependency vulnerabilities
- PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- Workspace-level `AGENTS.md` and `WORKSPACE_AUDIT.md` at repository root

### Changed

- CI: maestro-smoke now only runs on release tags (`v*`) with `--configuration Release`
- Cache target raised to 120 images with proportional era/region diversity caps

### Fixed

- Score display: removed dot thousands separator
- Map resets to default view when advancing to next round
- Result map auto-fits to show both pins and distance line
- `RoundTimer`: moved `useThemeColor` hook call above early-return guard (rules-of-hooks violation)
- `+not-found`: escaped apostrophe in JSX text (`doesn't` → `doesn&apos;t`)
