# AGENTS.md — TimeGuesser

<!-- workspace-kit: v1.2.0 | synced: 2026-03-16 -->

## Architecture

TimeGuesser is a React Native (Expo SDK 54) iOS game. Players view a photo and guess where and when it was taken. Scoring rewards proximity to the actual location and year.

**Stack**: Expo Router (file-based), react-native-maps, react-native-reanimated, AsyncStorage. No backend — all logic runs on-device.

**Provider chain** (defined in `app/_layout.tsx`):
ThemeProvider → SettingsProvider → GameProvider → NavThemeProvider → Stack

**Game flow**: Home (`app/(tabs)/index.tsx`) → `startGame()` loads 5 rounds via `buildRoundsForGame()` → Game screen (`app/(tabs)/game.tsx`) cycles rounds → player places pin + picks year → `submitGuess()` scores via `lib/scoring.ts` → ScoreReveal overlay → after 5 rounds → Results screen (`app/(tabs)/results.tsx`) → reset.

**Photo pipeline** (`lib/photos.ts`): Fetches from Wikimedia Commons API, filters by metadata/category/quality, caches locally (max 50 images), tracks seen rounds via ledger, enforces era/geo diversity per game.

**Hints** (`lib/hints.ts`): 5 deterministic tiers — region → 1000km circle → 250km circle → exact location → full answer. No LLM dependency. Tier 1 free, tiers 2–5 cost −1,000 each.

**Settings** (`lib/SettingsContext.tsx`): Persisted to AsyncStorage under key `timeguesser.settings.v1`. Covers map provider, timer, photo source, filters, hint config, diagnostics.

**Design system**: All spacing, radii, and type scales are tokens in `constants/theme.ts`. Colors in `constants/Colors.ts`. See `TIMEGUESSER_DESIGN_SYSTEM.md` for rationale.

**Orientation**: Portrait locked globally. Only `app/photo-viewer.tsx` unlocks landscape.

---

## Key Files

**Reading order**: For any change, read the spec first (`TIMEGUESSER_SPEC.md`), then the file(s) for the area you're touching, then check the hard constraints below.

| Area           | File                           | Why                                                                                            |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Spec           | `TIMEGUESSER_SPEC.md`          | Authoritative product/technical spec                                                           |
| Design         | `TIMEGUESSER_DESIGN_SYSTEM.md` | Colors, typography, spacing, component specs                                                   |
| Scoring        | `constants/scoring.ts`         | All scoring constants and hint costs                                                           |
| Scoring logic  | `lib/scoring.ts`               | Haversine distance, score formulas                                                             |
| Game state     | `lib/gameState.tsx`            | Reducer actions, RoundData/RoundResult types                                                   |
| Photo pipeline | `lib/photos.ts`                | Wikimedia fetch, cache, diversity, filters                                                     |
| Hints          | `lib/hints.ts`                 | Tier logic, macro-regions, circle generation                                                   |
| Settings       | `lib/SettingsContext.tsx`      | All persisted settings, defaults, migration                                                    |
| Design tokens  | `constants/theme.ts`           | Spacing, Radius, Layout, TypeScale                                                             |
| Colors         | `constants/Colors.ts`          | Light/dark palettes                                                                            |
| Game screen    | `app/(tabs)/game.tsx`          | Main gameplay (940 lines, most complex screen — refactoring candidate, avoid making it larger) |
| Deferred work  | `future_roadmap.md`            | Items intentionally out of scope                                                               |

---

## Hard Constraints

These values are load-bearing for game balance, UX consistency, or spec compliance. **Do not change without explicit approval.**

### Scoring formula (`constants/scoring.ts`, `lib/scoring.ts`)

- `MAX_LOCATION_SCORE = 5000`, `MAX_TIME_SCORE = 5000`, `MAX_ROUND_SCORE = 10000`
- `ROUNDS_PER_GAME = 5`, `MAX_GAME_SCORE = 50000`
- `MAX_DISTANCE_KM = 12000`, `LOCATION_SCORE_CURVE_POWER = 2`
- `MAX_YEARS_DIFF = 120`, `TIME_SCORE_CURVE_POWER = 2.0`
- Location score: `5000 * max(0, 1 - (distance / 12000))^2`
- Time score: `5000 * max(0, 1 - (yearDiff / 120))^2`
- Score floor: round total never below 0

### Hint tier costs (`constants/scoring.ts`)

- `HINT_TIER_COSTS = [0, 1000, 1000, 1000, 1000]`
- Tier 4 → location score forced to 0
- Tier 5 → round total forced to 0
- `HINT_TIER2_RADIUS_KM = 1000`, `HINT_TIER3_RADIUS_KM = 250`

### Diversity thresholds (`lib/photos.ts`)

- `ROUND_DIVERSITY_STAGES`: strict 30y/1000km → relaxed 20y/700km → 10y/400km → fallback
- `MIN_CONSECUTIVE_YEAR_GAP = 30`
- `GEO_BUCKET_DEGREES = 1.5`
- `DIVERSITY_YEAR_WEIGHT = 120`
- `MAX_CACHE_PER_ERA = 12` (per era bucket out of 50-image cache)
- `MAX_CACHE_OLDER_BAND = 14`, `MAX_CACHE_NEWER_BAND = 20`
- Era buckets: pre-1950, 1950–1979, 1980–1999, 2000–2014, 2015+
- `PUBLIC_CACHE_MAX = 50`

### Design tokens (`constants/theme.ts`, `constants/Colors.ts`)

- Spacing scale: xs(4) sm(8) md(12) buttonY(14) lg(16) xl(24) xxl(32) xxxl(48) — 4px base unit (buttonY is the sole exception)
- Radius: sm(4) md(6) lg(8) sheet(12) pill(999)
- TypeScale: 13 named sizes from displayLg(52px) to caption2(11px) — do not add or remove levels
- Layout: `photoMaxHeight = '40%'`, `minTouchTarget = 44`
- Accent tint: light `#1A8A7D`, dark `#2BBFAD`

### Architecture invariants

- No backend — all logic runs on-device
- No LLM/AI API calls in current scope (deterministic hints only)
- Portrait locked globally, landscape only in photo-viewer
- Apple Maps is the default map provider (Google Maps requires API key)

---

## Don't Do Without Asking

These actions require explicit approval before proceeding:

- **Adding dependencies** — no new packages in `package.json` without approval
- **Creating top-level directories** — the current structure (`app/`, `components/`, `lib/`, `constants/`, `assets/`) is intentional; don't add new top-level dirs
- **Changing the provider chain** — the order in `app/_layout.tsx` (Theme → Settings → Game → NavTheme → Stack) is load-bearing
- **Modifying `eas.json` or `app.json`** — build config and app identity; changes affect CI/CD and App Store
- **Adding external API calls** — the app is fully on-device by design; no network calls beyond Wikimedia Commons and Open-Meteo geocoding
- **Changing AsyncStorage keys** — key changes break existing users' persisted data (`timeguesser.settings.v1`, `timeguesser.public.cache.v3`, `timeguesser.theme.preference`)
- **Growing `game.tsx`** — this file is already 940 lines and is a refactoring candidate; extract new logic into components or lib modules instead

---

## Reference Documents

- **Product & Technical Spec**: [`TIMEGUESSER_SPEC.md`](./TIMEGUESSER_SPEC.md)
- **Design System**: [`TIMEGUESSER_DESIGN_SYSTEM.md`](./TIMEGUESSER_DESIGN_SYSTEM.md)
- **Future Roadmap**: [`future_roadmap.md`](./future_roadmap.md)

## QA Execution Defaults

- For UI validation during implementation, use smoke flow first: `npm run test:maestro:smoke:auto`
- Before final handoff for UI/navigation changes, run full suite: `npm run test:maestro:auto`
- These scripts auto-start Metro when needed and keep it running for iterative QA loops
