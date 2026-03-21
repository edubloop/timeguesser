# Agent Task Index

Use this index to route common requests quickly.

- Scoring constants and hint costs -> `constants/scoring.ts`
- Score calculation and distance math -> `lib/scoring.ts`
- Game reducer, round/result types, flow state -> `lib/gameState.tsx`
- Photo fetch, filtering, cache, diversity -> `lib/photos.ts`
- Hint generation and reveal tiers -> `lib/hints.ts`
- Persisted settings and defaults -> `lib/SettingsContext.tsx`
- Theme tokens and layout scales -> `constants/theme.ts`
- Color palettes -> `constants/Colors.ts`
- Main game screen behavior -> `app/(tabs)/game.tsx`
- Results and end-of-game flow -> `app/(tabs)/results.tsx`
- Settings UI and controls -> `app/(tabs)/settings.tsx`
- Provider composition -> `app/_layout.tsx`
- UI regression / e2e QA flows -> `.maestro/*.yaml`; smoke `npm run test:maestro:smoke:auto`, full `npm run test:maestro:auto`
- Performance plan, decisions, and metrics -> `PERFORMANCE_PLAN.md`

## Recommended Read Order For Any Task

1. `AGENTS.md`
2. `TIMEGUESSER_SPEC.md`
3. `TIMEGUESSER_DESIGN_SYSTEM.md`
4. Area files from the index above
