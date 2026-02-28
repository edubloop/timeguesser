# TimeGuesser — Product & Technical Specification

## Overview

TimeGuesser is a mobile game where players view a photo and guess both **where** and **when** it was taken. Players place a pin on an interactive map for location and select a year for time. Scoring is based on proximity to the actual location and date. The current hint system is deterministic and map-based.

---

## Platform & Tech Stack

- **Framework**: React Native with Expo
- **Target**: iOS (iPhone + iPad), deployed via TestFlight
- **CI/CD**: GitHub Actions → EAS Build → TestFlight
- **Orientation**: Portrait locked globally, except full-screen photo viewer which supports landscape
- **Theme**: System default with light/dark toggle in settings
- **Responsive**: Must work across all current iPhone models (SE through 16 Pro Max) and all current iPad models (Mini through Pro 13")

---

## Core Game Loop

1. Player starts a game (5 rounds)
2. Each round: a photo is displayed (stripped of metadata)
3. Player drops a pin on the map for their location guess
4. Player taps "Guess" to confirm location and enter their year guess
5. Reveal animation shows results and score
6. After 5 rounds: summary screen with total score and per-round breakdown

---

## Scoring

- **Max per round**: 10,000 points (5,000 location + 5,000 time)
- **Max per game**: 50,000 points (5 rounds × 10,000)
- **Location score**: `5000 * (max(0, 1 - (distanceKm / maxDistanceKm))^2)` where maxDistanceKm ≈ 12,000
- **Time score**: `5000 * (max(0, 1 - (abs(guessYear - actualYear) / maxYearsDiff)))^2` where maxYearsDiff ≈ 120 (quadratic curve, matching location scoring shape)
- **Hint penalties**: Hint 1 is free. Hints 2–3 cost -1,000 each (deducted from round total).
- **Hint scoring overrides**:
  - Tier 4 (exact location reveal): **location score is forced to 0** regardless of guess accuracy
  - Tier 5 (full answer reveal): **round total is forced to 0** regardless of all other components
- **Floor**: Score per round never goes below 0

---

## Screen Layout — Game Screen (All Devices, Portrait)

```
┌─────────────────────────┐
│                         │
│   Photo (max 40%)       │  ← pinch to zoom inline
│                         │  ← double-tap opens full-screen viewer
│                         │
├─────────────────────────┤
│  [🔍]            [💡]   │  ← floating icons: search (left), hint (right)
│                         │
│   Interactive Map       │  ← tap to drop/move pin
│                         │
│                         │
│                         │
│  ┌───────────────────┐  │
│  │      GUESS        │  │  ← disabled until pin is placed
│  └───────────────────┘  │
└─────────────────────────┘
```

### Photo Area (top, max 40% of screen height)
- Displays the round's photo, scaled to fit within the area
- Pinch-to-zoom supported inline
- Double-tap opens full-screen photo viewer (see below)
- No single-tap interaction on the photo
- In public-source rounds, allow a "Refresh Photo" action once per round before Guess is locked

### Map Area (bottom, remaining ~60%)
- Interactive map (Google Maps or Apple Maps, selectable in settings)
- Tap anywhere on map to drop a pin
- Tap elsewhere to reposition pin (only one pin at a time, freely movable until Guess is pressed)
- Floating magnifying glass icon (🔍) in top-left corner of map area:
  - Tap to expand a search bar overlay
  - Type a location → map flies to that location
  - Search bar collapses back to icon after selection
- Floating hint icon (💡) in top-right corner of map area

### Guess Button (bottom of screen)
- Disabled/dimmed until a pin has been placed
- Tapping Guess:
  1. Locks in the player's location (pin can no longer be moved)
  2. Opens date input (year picker) — presentation TBD (bottom sheet, modal, or inline)
  3. Player selects a year and confirms
  4. Triggers the reveal sequence

---

## Full-Screen Photo Viewer

- Triggered by double-tapping the photo in the game screen
- Full-screen with dark background
- Supports pinch-to-zoom
- **Supports landscape orientation** (unlike the rest of the app which is portrait-locked)
- Swipe down or tap X to dismiss
- Share icon or long-press triggers native iOS share sheet (Save to Photos, AirDrop, Copy, etc.)

---

## Hint System

The hint system has 5 tiers. All tiers are **deterministic** (no LLM dependency). Tiers 1–3 progressively reveal the target location on the map. Tiers 4–5 reveal exact answers with scoring consequences.

| Tier | Type | Cost | Map effect | Scoring effect |
|------|------|------|------------|----------------|
| 1 | Coarse location | Free | Zoom to continent/sub-continent region containing target | None |
| 2 | Regional radius | -1,000 | Show ~1,000 km radius circle; target is inside but not centered | None (standard hint penalty) |
| 3 | Tight radius | -1,000 | Show ~250 km radius circle; target is inside but not centered | None (standard hint penalty) |
| 4 | Exact location | -1,000 | Drop answer pin on exact location | **Location score forced to 0** |
| 5 | Full answer | -1,000 | Show exact location + year; skip year picker on submit | **Round total forced to 0** |

### Hint Interaction
- Tapping the hint button opens a **Hint Modal** (not an inline card).
- The modal shows: next tier number, what it reveals, and its point cost.
- Player chooses `Cancel` or `Get Hint`.
- Tapping `Get Hint` applies the tier effect, closes the modal.
- Requesting a hint does **not** force-open any panel.
- A separate `Show hints` / `Hide hints` toggle controls visibility of hint history.
- Hint history panel, when open, is compact and scrollable so map remains usable.
- Tiers are sequential — must use Tier 1 before Tier 2, etc.

### Hint Map Reveals
- **Tier 1**: Map camera fits to a predefined macro-region bounding box derived from the target coordinates (e.g., North America, Western Europe, Southeast Asia). The target is somewhere within this region.
- **Tier 2**: A translucent circle (~1,000 km radius) appears on the map. The circle contains the target but the target is offset from center (random bearing, 200–600 km offset) so the exact location is not given away.
- **Tier 3**: Same as Tier 2 but with ~250 km radius and 50–150 km offset.
- **Tier 4**: Exact answer pin drops on the map. Location score for this round becomes 0.
- **Tier 5**: Year is revealed in a persistent banner. Year picker is skipped on guess submission. Round total becomes 0.

### Guess Flow with Hints
- If Tier 5 has been used, pressing `GUESS` skips the year picker and auto-submits with the revealed year.
- If Tier 4 has been used, location score is 0 regardless of where the player placed their pin.
- Hint reveals (map overlays, year banner) persist through submission and into the score reveal phase.

---

## Photo Sources

Two sources are supported:
- Wikimedia Commons (public, primary)
- User uploads (personal)

### Wikimedia Commons (Primary Source)

#### API Access
- Free, no API key required
- MediaWiki API: `https://commons.wikimedia.org/w/api.php`
- Geosearch endpoint for coordinate-based queries
- Category-based queries for thematic browsing

#### Target Categories (High Guessability)
Goal: photos with environmental context clues such as people, architecture, signage, vehicles, vegetation, and infrastructure.

Crawl subcategories recursively from these parent groups:

- **Street-level & urban**
  - Streetscapes (including by country, decade, century)
  - Street photography by city
  - Pedestrian streets by country
  - Sidewalks by country
  - Urban squares by country
  - Marketplaces by country
  - Shopping streets by country

- **Transportation & infrastructure**
  - Road signs by country
  - Traffic signs by country
  - Bus stops by country
  - Railway stations by country
  - Tram stops by country
  - Airports by country
  - Ports and harbours by country
  - Vehicles by country

- **Architecture & built environment**
  - Buildings by country
  - Houses by country
  - Churches by country
  - Schools by country
  - Storefronts by country
  - Restaurants by country
  - Hotels by country

- **People & daily life**
  - People by country
  - Crowds by country
  - Festivals by country
  - Parades by country
  - Markets by country
  - Street vendors by country

- **Landscapes with context**
  - Panoramics by country
  - Beaches by country
  - Parks by country
  - Harbours by country
  - Cityscapes by country
  - Skylines by country

- **Historical (by decade)**
  - Street scenes by decade (1900s through 2020s)
  - Photographs by year
  - Photographs by decade

#### Metadata Requirements
Every photo must have:
- GPS coordinates (Location template or EXIF geodata)
- Date (EXIF `DateTimeOriginal`, category date hint, or structured description)
- Minimum resolution: longest edge >= 1024px
- File type: JPEG or PNG only (exclude SVG/PDF/TIFF/OGG)
- License: Creative Commons or Public Domain only

#### Metadata Provenance & Confidence
- For each candidate, track provenance and confidence for both year and location:
  - `yearValue`, `yearSource`, `yearConfidence`
  - `locationValue`, `locationSource`, `locationConfidence`
- Year source priority:
  1. `capture_exif` (highest)
  2. `structured_metadata`
  3. `content_inferred` (title/category cues)
  4. `upload_timestamp` (lowest, last resort)
- Public gameplay selection should prefer medium/high-confidence metadata and reject low-confidence mismatches.

#### Exclusion Filters (Automated)
Reject photos matching these patterns:
- Categories containing terms such as logos, diagrams, maps, charts, flags, coats of arms, icons, symbols, paintings, drawings, illustrations, scans, screenshots, studio, still life, microscopy, x-ray, satellite
- File names containing terms such as logo, icon, diagram, map, chart, flag, coat_of_arms
- Images with no identifiable outdoor/environmental context

#### Consistency Safeguards (Public Mode)
- Reject if year is only inferred from upload timestamp and content indicates historical context.
- Reject if inferred content year and selected year conflict beyond threshold (default: 20 years).
- Reject if inferred location text strongly conflicts with GPS region/country.
- Reject if year/location confidence is below public minimum threshold.

Suggested reject reason labels:
- `year_source_low_confidence`
- `content_year_conflict`
- `content_location_conflict`
- `historical_upload_conflict`
- `missing_trusted_year`

#### Quality Gate (Current)
After automated filtering, enforce deterministic quality checks only:
- Metadata validity (GPS + usable year source)
- Scene/context suitability checks
- Exclusion terms and artwork/media rejection
- Confidence + conflict safeguards

#### Ingestion Pipeline
1. Query Wikimedia API by target category (recursive subcategories)
2. Filter: GPS + date + resolution + file type + license
3. Exclude by category/filename patterns + artwork/media checks
4. Apply deterministic validation safeguards (confidence/conflict)
5. Persist gameplay-ready round data in local cache (app-managed)

#### App-Only Wikimedia Fetch Strategy (Current)
- Rotate across a predefined set of high-guessability root categories
- Persist per-category API cursors locally to avoid repeatedly pulling the same first-page files
- Sample files from both direct category members and selected subcategories
- Normalize + validate before local caching
- Continue rotating/refilling until cache target is met or fetch attempts are exhausted

#### Volume Estimate
- Wikimedia Commons geocoded images: ~5.2M
- Target categories after deterministic metadata/content filtering: ~100K–500K
- Usable game photos: ~30K–250K

### Public Source Modes
- `Wikimedia`: production public rounds source
- `Test Set`: local development fallback only (not user-facing in production settings)

### Filter Toggle System (Evaluation Mode)
- Scope: public validation flow (and public portion of mixed mode)
- Default: all optional selection filters OFF
- Playability gate remains ON (GPS + date required)
- Toggleable filters:
  - Require street/public context
  - Require people context
  - Require geographic clues
  - Require temporal clues
  - Reject indoor-only
  - Reject low-signal object scenes
  - Enforce guessability threshold
- Diagnostics should expose: fetched, metadata-pass, strict-pass, selected, skipped-as-seen, fallback reason

### Local Cache & Seen Ledger
- Maintain local public cache with hard cap of 50 assets
- Cache stores normalized metadata + local image URI
- Persist seen ledger key (`provider + providerImageId`) separately from cache
- Seen ledger survives app restarts and cleanup
- Selection should prefer unseen cached images; previously seen images should not reappear while unseen supply exists
- Cache refill should avoid immediate repetition by rotating category cursors and skipping already-seen provider IDs

### Round Diversity (Strict-First)
- Public round selection should maximize both location and year variance within a 5-round game
- **Consecutive year gap target**: After round selection and reordering, consecutive rounds in the final sequence must differ by at least **30 years**. The system tries multiple orderings (alternation, zigzag, permutations for ≤6 rounds) to satisfy this constraint before falling back.
- Default pairwise strict constraints:
  - Minimum year gap between any two selected rounds: **30 years**
  - Minimum spatial separation target: **1,000 km**
- If strict constraints cannot fill a complete round set, apply relaxation stages in order:
  1. `30y / 1,000km`
  2. `20y / 700km`
  3. `10y / 400km`
  4. No hard constraints (last resort)
- **Year weight in diversity scoring**: Year gaps are weighted at 120× (e.g., a 20-year gap contributes 2,400 to diversity score)
- **Era-bucket balancing**: Rounds are classified into 5 era buckets (pre-1950, 1950–1979, 1980–1999, 2000–2014, 2015+). Selection strongly favors candidates from new era buckets, targeting 3–4 distinct buckets per 5-round game. New-bucket bonus: +2,000; same-bucket penalty: -1,500; per-duplicate: -350.
- **Cache-level era quota**: No single era bucket may exceed 24% of the public cache (max 12 of 50 images). Candidates from over-quota eras are skipped during cache refill, forcing a balanced distribution across decades.
- **Band caps for gameplay feel**: Cache ingest also applies soft old/new caps to reduce over-representation of very old sequences and preserve stronger 1960s-2010s variety.
- **Sequence alternation**: After selection, rounds are reordered to alternate between older and newer photos, preventing clusters of similar-era rounds. Multiple orderings are tested (alternation, reverse, zigzag, permutations) to find one satisfying the consecutive 30-year gap.
- Public photo refresh should follow the same diversity policy when a suitable replacement is available

### Historical Candidate Relaxation
- Photos with `yearSource === 'content_inferred'` and `yearConfidence === 'medium'` are allowed through the validation pipeline even if they trigger consistency safeguard reasons (e.g., `content_year_conflict`, `missing_trusted_year`). These are downgraded from hard-fail to soft validation with a `relaxed_content_inferred_year_validation` warning, allowing more pre-2000 historical photos into the candidate pool.

### Startup Cleanup & Refill
- On app start:
  1. remove cached assets marked seen/played
  2. keep seen metadata in ledger
  3. refill cache up to max 50
  4. skip candidates already in seen ledger
- On low unseen supply, log diagnostics and apply fallback policy

### Diversity Diagnostics
- When diagnostics are enabled, log per-game selection metrics:
  - selected years
  - minimum year gap achieved
  - minimum pairwise distance achieved
  - unique geo bucket count
  - relaxation stage used
- Log ingest-time safeguard counters:
  - accepted candidates by confidence tier
  - rejected candidate counts by reason label

### User Photo Upload (Personal Source)
- Player can upload photos from device library
- App reads EXIF metadata to extract GPS + date
- Warn user when required metadata is missing
- Personal photos can power custom rounds
- Personal mode uses the same deterministic scoring and hint mechanics

### App-Only Architecture (Current Plan)

- The system is fully app-managed with no separate backend.
- Wikimedia ingestion/filtering runs on-device.
- Round metadata (coordinates/year) is stored locally for scoring and reveal.
- Seen-ledger, quality score, and clue metadata are persisted locally.
- This is the intended production path for now, optimized for low cost.

### Privacy & Data Handling (App-Only)

- Keep round answer metadata local to the device.
- Do not transmit photo answer metadata to third-party APIs.
- No third-party AI calls are required for gameplay in current scope.

### Implementation Phases (App-Only)

1. **Phase 1:** robust local fetch/filter/cache + seen ledger (max 50 cache)
2. **Phase 2:** tune filter toggles + diagnostics for stable candidate volume
3. **Phase 3:** improve deterministic quality filtering and diversity controls
4. **Phase 4 (optional future):** backend ingestion can be added later without changing gameplay UX

---

## Map Provider Abstraction

The app must support swapping between Google Maps and Apple Maps (MapKit JS / react-native-maps).

### Unified Interface
Create a `MapProvider` abstraction with the following capabilities:
- `renderMap()` — displays the interactive map
- `placePin(lat, lng)` — drops a pin at coordinates
- `movePin(lat, lng)` — repositions the existing pin
- `removePin()` — clears the pin
- `flyTo(lat, lng, zoom)` — animates map to a location
- `drawLine(from, to)` — draws a line between two points (for reveal)
- `calculateDistance(from, to)` — returns distance in km
- `searchLocation(query)` — geocoding for the search bar

### Provider Toggle
- Setting in the app settings screen
- Default to Apple Maps on iOS
- Google Maps requires a Google Maps API key

---

## Reveal Sequence

After the player submits their guess (location + year):

1. **Pin drop animation**: Player's guess pin animates with a satisfying drop
2. **Answer pin appears**: The actual location pin drops onto the map
3. **Distance line**: An animated line draws between the guess pin and the answer pin, with distance displayed (e.g., "347 km away")
4. **Map fly-to**: Map snaps to show both pins (instant, not animated, to avoid slow map transitions)
5. **Score overlay (minimized)**: A compact card appears at the bottom of the map showing the photo label, location/year meta, and the round total score. A "Show details" button lets the player expand the full breakdown.
6. **Score overlay (expanded)**: When expanded, shows distance, year comparison (guess → actual, years off), location score, time score, hint penalty (if any), and total with animated counters. A "Hide details" button collapses back to the compact view.
7. The NEXT ROUND button activates immediately when the overlay appears (no phased animation gate).

---

## Settings Screen

- **Map provider**: Toggle between Google Maps and Apple Maps
- **Round timer**: Off (default) / 30s / 60s / 90s / 120s
- **Theme**: System default / Light / Dark
- **Hints**: Enabled/disabled toggle (deterministic map-based hints, no LLM required)
- **Photo source**: public / personal / mixed
- **Public image source**: Wikimedia (fixed in production)
- **Image criteria (public, evaluation mode)**:
  - Per-criterion filter toggles (all OFF by default)
  - Diagnostics toggle to show validation/fallback counts
- **Public cache policy**:
  - Target cache size: 50 assets
  - Startup cleanup + refill enabled
  - Manual clear action to reset cached public images

---

## App Navigation Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Home / Start Game
│   ├── game.tsx           # Main game screen (5 rounds)
│   ├── results.tsx        # End-of-game summary (total + per-round breakdown)
│   └── settings.tsx       # Map provider, timer, theme, photo source
├── photo-viewer.tsx       # Full-screen photo viewer (supports landscape)
└── _layout.tsx            # Root layout with portrait lock
```

---

## Project Structure

```
timeguesser/
├── app/                        # Expo Router screens (see navigation above)
├── components/
│   ├── MapView/                # Map abstraction with Google/Apple implementations
│   │   ├── MapProvider.tsx     # Abstract interface
│   │   ├── GoogleMapView.tsx   # Google Maps implementation
│   │   └── AppleMapView.tsx    # Apple Maps implementation
│   ├── PhotoViewer/            # Inline photo + full-screen viewer
│   ├── GuessButton/            # Guess button with disabled state
│   ├── YearPicker/             # Year selection input
│   ├── HintSystem/             # Hint icon, hint cards, tier progression
│   ├── ScoreReveal/            # Reveal animation sequence
│   ├── SearchBar/              # Expandable map search
│   └── ScoreSummary/           # End-of-game results
├── lib/
│   ├── scoring.ts              # Distance + time scoring calculations
│   ├── photos.ts               # Photo pipeline (EXIF extraction, API sources, validation)
│   ├── hints.ts                # Deterministic hint generation + tier logic
│   ├── mapProviders.ts         # Map provider abstraction and implementations
│   └── gameState.ts            # Game state management (rounds, scores, current state)
├── assets/                     # App icons, splash screen, etc.
├── constants/
│   └── scoring.ts              # Scoring constants (maxDistance, maxYears, hint penalties)
├── .github/workflows/
│   └── build.yml               # GitHub Actions: EAS Build → TestFlight
├── eas.json                    # EAS Build configuration
├── app.json                    # Expo configuration (portrait lock, permissions, etc.)
└── package.json
```

---

## Key Dependencies (Expected)

- `expo` — core framework
- `expo-router` — file-based navigation
- `react-native-maps` — map rendering (supports both Google and Apple Maps)
- `expo-image` — optimized image rendering
- `expo-sharing` — native share sheet
- `expo-screen-orientation` — lock portrait globally, unlock for photo viewer
- `expo-image-picker` — user photo upload
- `exif-js` or `expo-media-library` — EXIF metadata extraction
- `react-native-gesture-handler` — pinch-to-zoom, swipe gestures
- `react-native-reanimated` — reveal animations

---

## CI/CD Pipeline

- **Trigger**: Push to `main` branch or manual dispatch
- **Build**: EAS Build for iOS
- **Distribution**: TestFlight (internal testing)
- **Workflow**:
  1. Checkout repo
  2. Install dependencies
  3. Run `eas build --platform ios --profile preview`
  4. Auto-submit to TestFlight via `eas submit`

---

Deferred and long-term items are tracked separately in `future_roadmap.md`.
