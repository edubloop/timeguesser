# Canonical Contract — TimeGuesser Design System

## Source Of Truth

- Canonical design tokens: `constants/Colors.ts`, `constants/theme.ts`
- Canonical design package entrypoint: `TimeGuesser Design System/README.md`
- Canonical prototype behavior/layout reference: `TimeGuesser Design System/ui_kits/mobile_app/*`

## Derived Artifacts (Generated)

- `TimeGuesser Design System/colors_and_type.css`
- `TimeGuesser Design System/ui_kits/mobile_app/tokens.json`
- `TimeGuesser Design System/ui_kits/mobile_app/tokens.js`

Do not hand-edit generated files.

## Authoritative (Human-Maintained)

- `TimeGuesser Design System/README.md`
- `TimeGuesser Design System/ui_kits/mobile_app/components.jsx` (structure/behavior)
- `TimeGuesser Design System/ui_kits/mobile_app/index.html` (prototype shell)
- `TimeGuesser Design System/assets/*` (approved design assets)

## Workflow

1. Update tokens in `constants/Colors.ts` or `constants/theme.ts`.
2. Run `npm run design:tokens:build`.
3. Validate guardrails with `npm run design:guardrails:check`.
4. Validate full checks with `npm run check`.
5. Commit source and regenerated artifacts together.

## CI Contract

- `npm run design:tokens:check` fails if generated artifacts drift from TS token sources.
- `npm run design:guardrails:check` fails if prototype token wiring or settings ordering guardrails regress.
