# TimeGuesser AGENTS Companion — QA And CI

Companion to `TimeGuesser/AGENTS.md`.

## Back To Index

- Core TimeGuesser index: `TimeGuesser/AGENTS.md`

## Reference Documents

- **Product & Technical Spec**: [`TIMEGUESSER_SPEC.md`](./TIMEGUESSER_SPEC.md)
- **Design System**: [`TIMEGUESSER_DESIGN_SYSTEM.md`](./TIMEGUESSER_DESIGN_SYSTEM.md)
- **Future Roadmap**: [`future_roadmap.md`](./future_roadmap.md)

## QA Execution Defaults

- For UI validation during implementation, use smoke flow first: `npm run test:maestro:smoke:auto`
- Before final handoff for UI/navigation changes, run full suite: `npm run test:maestro:auto`
- These scripts auto-start Metro when needed and keep it running for iterative QA loops

## CI Pipeline

- **`validate`** job runs on every push to `main` and every PR: typecheck, lint, tests, `npm audit`
- **`maestro-smoke`** job runs **only on release tags** (`v*`): builds a release iOS app on simulator and runs Maestro photo-viewer flow
- Maestro does **not** run on regular pushes or PRs — run it locally during development with the commands above
- To trigger a release CI run: `git tag v1.x.x && git push origin v1.x.x`
