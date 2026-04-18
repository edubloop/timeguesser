# AGENTS.md — TimeGuesser

<!-- workspace-kit-sync: v1.4.0 | synced: 2026-04-02 -->

## Architecture

TimeGuesser is a React Native (Expo SDK 54) iOS game. Players view a photo and guess where and when it was taken. Scoring rewards proximity to the actual location and year.

**Stack**: Expo Router (file-based), react-native-maps, react-native-reanimated, AsyncStorage. No backend — all logic runs on-device.

**Provider chain** (defined in `app/_layout.tsx`):
ThemeProvider → SettingsProvider → GameProvider → NavThemeProvider → Stack

**Game flow**: Home (`app/(tabs)/index.tsx`) → `startGame()` loads 5 rounds via `buildRoundsForGame()` → Game screen (`app/(tabs)/game.tsx`) cycles rounds → player places pin + picks year → `submitGuess()` scores via `lib/scoring.ts` → ScoreReveal overlay → after 5 rounds → Results screen (`app/(tabs)/results.tsx`) → reset.

**Photo pipeline** (`lib/photos.ts`): Fetches from Wikimedia Commons API, filters by metadata/category/quality, caches locally (max 50 images), tracks seen rounds via ledger, enforces era/geo diversity per game.

**Hints** (`lib/hints.ts`): 5 deterministic tiers — region → 1000km circle → 250km circle → exact location → full answer. No LLM dependency. Tier 1 free, tiers 2–5 cost −1,000 each.

**Settings** (`lib/SettingsContext.tsx`): Persisted to AsyncStorage under key `timeguesser.settings.v1`. Covers map provider, timer, photo source, filters, hint config, diagnostics.

**Design system**: All spacing, radii, and type scales are tokens in `constants/theme.ts`. Colors in `constants/Colors.ts`. See `TIMEGUESSER_DESIGN_SYSTEM.md` for rationale, anti-patterns, composition rules, and visual references.

**Orientation**: Portrait locked globally. Only `app/photo-viewer.tsx` unlocks landscape.

## Workspace session-start check

From `TimeGuesser/`, run:

```sh
bash ../.workspace-notes/cadence_due_check.sh
```

If output is `[DUE]`, run `bash ../.workspace-notes/harness_healthcheck.sh` and append a row in `../WORKSPACE_AUDIT.md` under `Cadence Log`.

---

## Key Files

**Reading order**: For any change, read the spec first (`TIMEGUESSER_SPEC.md`), then the file(s) for the area you're touching, then check the hard constraints below.

| Area           | File                             | Why                                                                                            |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| Spec           | `TIMEGUESSER_SPEC.md`            | Authoritative product/technical spec                                                           |
| Design         | `TIMEGUESSER_DESIGN_SYSTEM.md`   | Colors, typography, spacing, component specs                                                   |
| Scoring        | `constants/scoring.ts`           | All scoring constants and hint costs                                                           |
| Scoring logic  | `lib/scoring.ts`                 | Haversine distance, score formulas                                                             |
| Game state     | `lib/gameState.tsx`              | Reducer actions, RoundData/RoundResult types                                                   |
| Photo pipeline | `lib/photos.ts`                  | Wikimedia fetch, cache, diversity, filters                                                     |
| Hints          | `lib/hints.ts`                   | Tier logic, macro-regions, circle generation                                                   |
| Settings       | `lib/SettingsContext.tsx`        | All persisted settings, defaults, migration                                                    |
| Design tokens  | `constants/theme.ts`             | Spacing, Radius, Layout, TypeScale                                                             |
| Colors         | `constants/Colors.ts`            | Light/dark palettes                                                                            |
| Standards      | `TYPESCRIPT_CODING_STANDARDS.md` | Citation-ready TypeScript standards catalog for reviews, specs, and agent guidance             |
| Game screen    | `app/(tabs)/game.tsx`            | Main gameplay (940 lines, most complex screen — refactoring candidate, avoid making it larger) |
| Deferred work  | `future_roadmap.md`              | Items intentionally out of scope                                                               |

## Further Reading

- Hard constraints and ask-first boundaries: `TimeGuesser/AGENTS-constraints.md`
- Fabro intake/design/delivery workflows: `TimeGuesser/AGENTS-workflows.md`
- QA defaults and CI pipeline: `TimeGuesser/AGENTS-operations.md`
