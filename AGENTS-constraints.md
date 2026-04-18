# TimeGuesser AGENTS Companion — Constraints

Companion to `TimeGuesser/AGENTS.md`.

## Back To Index

- Core TimeGuesser index: `TimeGuesser/AGENTS.md`

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

## Don't Do Without Asking

These actions require explicit approval before proceeding:

- **Adding dependencies** — no new packages in `package.json` without approval
- **Creating top-level directories** — the current structure (`app/`, `components/`, `lib/`, `constants/`, `assets/`) is intentional; don't add new top-level dirs. The Fabro delivery runtime directory (`.fabro/`) is the approved exception for this repo.
- **Changing the provider chain** — the order in `app/_layout.tsx` (Theme → Settings → Game → NavTheme → Stack) is load-bearing
- **Modifying `eas.json` or `app.json`** — build config and app identity; changes affect CI/CD and App Store
- **Adding external API calls** — the app is fully on-device by design; no new network calls beyond the approved allowlist (Wikimedia Commons, Library of Congress, Europeana, Open-Meteo, Nominatim) without explicit approval
- **Changing AsyncStorage keys** — key changes break existing users' persisted data (`timeguesser.settings.v1`, `timeguesser.public.cache.v3`, `timeguesser.theme.preference`)
- **Growing `game.tsx`** — this file is already 940 lines and is a refactoring candidate; extract new logic into components or lib modules instead
