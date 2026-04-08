# Image Sourcing Pipeline Audit

_Generated: 2026-03-21 | Branch: feature/refactor-image-sources_

---

## 1. Wikimedia Commons Integration

### API Endpoints & Discovery

All Wikimedia API integration lives in **`lib/photos.ts`** (1815 lines).

#### 1a. Category Member Discovery (`fetchWikimediaFileMembers`, lines 1146–1168)

```
GET https://commons.wikimedia.org/w/api.php
  action=query
  list=categorymembers
  cmtitle={category}      ← URL-encoded category name
  cmtype=file             ← files only
  cmlimit={limit}         ← typically 40-50
  cmcontinue={cursor}     ← pagination token (optional)
  format=json
  origin=*                ← CORS bypass
```

Returns an array of file titles and an optional `cmcontinue` continuation token for the next page.

#### 1b. Subcategory Browse (`fetchWikimediaSubcategoryMembers`, lines 1170–1185)

Same endpoint, `cmtype=subcat`. Fetches up to 8 subcategories per category in a single call (no
pagination tracked for subcategories).

#### 1c. Batch Metadata Fetch (`fetchWikimediaImageInfoByTitles`, lines 1187–1295)

```
POST https://commons.wikimedia.org/w/api.php
  action=query
  titles={pipe-delimited titles}   ← max 25 per request (chunked at line 1193)
  prop=imageinfo|categories
  iiprop=url|timestamp|extmetadata|size|mime
  iiurlwidth=1600                  ← request 1600px resized variant
  cllimit=20
  format=json
  origin=*
```

Titles are chunked into batches of 25. Results are merged across chunks.

#### 1d. Orchestration (`fetchWikimediaCandidatesFromCategory`, lines 1302–1325)

1. Fetch `limit * 0.6` direct files from the category
2. Fetch 10 subcategories
3. For each of ~4 subcategories, fetch 12 more files
4. Deduplicate and combine all titles
5. Batch-fetch metadata (`fetchWikimediaImageInfoByTitles`)
6. Return shuffled validated candidates

### Category Rotation

**`WIKIMEDIA_ROOT_CATEGORIES`** (lines 211–245): 30 hardcoded categories, interleaved modern and
historical decade street-scene categories (e.g. `Category:Street_photography` + `Category:Street_scenes_in_the_1930s`).
The rotation index (`wikimediaCategoryIndex`) persists in `CacheState` and advances with each refill
cycle so every app session hits a different mix.

### Metadata Extracted Per Image

| Field             | Source                                                           | Confidence |
| ----------------- | ---------------------------------------------------------------- | ---------- |
| GPS lat/lng       | `extmetadata.GPSLatitude/GPSLongitude` (lines 1226–1227)         | high       |
| Date (priority 1) | `extmetadata.DateTimeOriginal` (line 679)                        | high       |
| Date (priority 2) | `extmetadata.DateTime` / `DateTimeDigitized` (lines 691–692)     | medium     |
| Date (priority 3) | Content inference from title/description (lines 650–664)         | low        |
| Date (fallback)   | Upload `timestamp` from API (line 721)                           | low        |
| Image URL         | `imageinfo[0].url` (line 1223)                                   | —          |
| MIME type         | `imageinfo[0].mime` (line 1235)                                  | —          |
| Dimensions        | `imageinfo[0].width/height` (lines 1230–1232)                    | —          |
| License           | `extmetadata.LicenseShortName` + `UsageTerms` (lines 1135–1144)  | —          |
| Description       | `extmetadata.ImageDescription` (line 1242)                       | —          |
| Categories        | Page `categories[]` + `extmetadata.Categories` (lines 1244–1246) | —          |

**Acceptance criteria** (inline validation in `fetchWikimediaImageInfoByTitles`):

- GPS must be present and finite (missing GPS → rejected)
- URL must be present
- Longest edge ≥ 1024px
- MIME must be `image/jpeg` or `image/png`
- License must contain 'creative commons', 'cc-by', 'public domain', or 'cc0'
- Not a painting/artwork (keyword check lines 1116–1120)
- Must look like a photograph (keyword check lines 1122–1124)

### Request Patterns

- **No explicit rate limiting** — requests are sequential, no parallel fetches
- **Retry strategy**: `ensureCacheReady()` retries up to 4 times if cache stays below minimum
- **No backoff** — if a category yields no progress it is skipped and the next is tried
- **Chunked batching**: metadata fetched 25 titles at a time (POST)

---

## 2. Image Selection / Curation Pipeline

### Guessability Scoring (`validatePublicCandidate`, lines 473–605)

**Architecture**: Rule-based, deterministic, client-side, no LLM. Runs at ingestion time.

**Scoring** (base 58 points, lines 507–527):

| Signal              | Bonus | Keywords matched in title + description                     |
| ------------------- | ----- | ----------------------------------------------------------- |
| Street/public scene | +25   | street, road, avenue, square, plaza, market, city, urban    |
| Geographic clues    | +18   | sign, station, cathedral, bridge, tower, monument, district |
| Temporal clues      | +12   | vintage, historic, old, car, tram, bus, fashion             |
| People context      | +10   | people, person, crowd, pedestrian, woman, man, children     |

Score is capped at 100. Total range: 58–100+ (before penalties).

**Rejection signals** (hard fail regardless of score):

- Low-signal objects: `macro`, `close-up`, `flower`, `bird`, `cat`, `dog`, `abstract`
- Indoor-only: `indoor`, `interior`, `room`, `kitchen`, `bedroom`

**Thresholds** (lines 166–167):

```
PUBLIC_PASS_THRESHOLD   = 70  ← strict acceptance
PUBLIC_REJECT_THRESHOLD = 49  ← hard reject below this
```

Between 50–69: soft fail — accepted only if cache is running low (relaxed mode).

### Filter Criteria (`PublicSelectionFilters`, lines 52–60)

All six filters are **user-configurable boolean flags**, all defaulting to `false`:

| Filter                         | Line | Effect when true                                 |
| ------------------------------ | ---- | ------------------------------------------------ |
| `requireStreetScene`           | 53   | Hard fail if no street keywords detected         |
| `requirePeopleContext`         | 54   | Hard fail if no people keywords detected         |
| `requireGeoClues`              | 55   | Hard fail if no geo keywords detected            |
| `requireTemporalClues`         | 56   | Hard fail if no temporal keywords detected       |
| `rejectIndoorOnly`             | 57   | Hard fail if indoor keywords detected            |
| `rejectLowSignalObjects`       | 58   | Hard fail if low-signal object keywords detected |
| `enforceGuessabilityThreshold` | 59   | Hard fail if score < 70                          |

Defaults at lines 62–70: all false.

### Exclusion Terms (lines 247–282)

Images are rejected if their title or categories contain: `logo`, `diagram`, `flag`, `icon`,
`symbol`, `painting`, `drawing`, `illustration`, `scan`, `screenshot`, `studio`, `still life`,
`microscopy`, `x-ray`, `satellite`.

### Scoring Location

Scoring and filtering happen **client-side during cache refill** (`refillPublicCache`, lines
1352–1516). Images that hard-fail are never stored. The game-round selection phase
(`getPublicRoundsFromCache`, lines 1575–1622) operates on pre-filtered cached images only.

### LLM Involvement

**None.** `lib/hints.ts` defines LLM provider types (lines 17–27) but comments them as "retained
for future use, currently disabled" (line 216: "Hint generation (deterministic, no LLM)"). All
scoring is regex and keyword matching.

---

## 3. Image Storage and Serving

### Caching Architecture

Hybrid: metadata in AsyncStorage, image files on local filesystem.

**AsyncStorage key**: `'timeguesser.public.cache.v3'` (line 197)

**File storage** (`downloadToLocal`, lines 1072–1096):

- Downloads via `expo-file-system/legacy` (`FileSystem.cacheDirectory`)
- Filename: `timeguesser-public-{sanitized-id}.jpg`
- Current branch adds HTTP status (200–299) and Content-Type (`image/`) validation
- Invalid downloads are cleaned up immediately

### Metadata Schema

```typescript
// In-memory candidate during extraction (lib/photos.ts:111-127)
interface PublicPhotoCandidate {
  provider: 'wikimedia' | 'test';
  providerImageId: string;
  imageUri: string; // Wikimedia remote URL
  location: { lat: number; lng: number };
  locationIntake: 'gps_exif' | 'content_inferred';
  locationConfidence: 'high' | 'medium' | 'low';
  year: number;
  yearIntake: 'capture_exif' | 'structured_metadata' | 'content_inferred' | 'upload_timestamp';
  yearConfidence: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  categories?: WikiCategory[];
  contentYearHint?: number;
  historicalContextSignal?: boolean;
  locationConflictDetected?: boolean;
}

// Persisted cache entry (lib/photos.ts:142-156)
interface CachedPublicImage {
  cacheId: string;
  provider: 'wikimedia' | 'test';
  providerImageId: string;
  remoteUri: string; // original Wikimedia URL
  localUri: string; // local filesystem path
  location: { lat: number; lng: number };
  year: number;
  title: string;
  displayTitle: string;
  displayLocation: string;
  description?: string;
  fetchedAt: number;
  lastUsedAt?: number;
  // ⚠ No license/author/attribution fields currently stored
}

// AsyncStorage schema (lib/photos.ts:158-164)
interface CacheState {
  images: CachedPublicImage[];
  seenLedger: string[]; // "provider:imageId" pairs of played rounds
  wikimediaCategoryIndex: number; // current position in WIKIMEDIA_ROOT_CATEGORIES
  wikimediaCursors: Record<string, string>; // per-category cmcontinue tokens
  updatedAt: number;
}
```

### Cache Limits (lines 168–192)

| Constant                      | Value | Purpose                                     |
| ----------------------------- | ----- | ------------------------------------------- |
| `PUBLIC_CACHE_MAX`            | 50    | Hard cap on stored images                   |
| `PUBLIC_CACHE_TARGET`         | 50    | Target unseen count                         |
| `PUBLIC_FETCH_CAP`            | 180   | Max candidates fetched per refill cycle     |
| `MAX_CACHE_PER_ERA`           | 12    | Max images per era bucket                   |
| `MAX_CACHE_OLDER_BAND`        | 14    | Soft cap on pre-1950 images                 |
| `MAX_CACHE_NEWER_BAND`        | 20    | Soft cap on 2015+ images                    |
| `CACHE_NEARBY_KM_THRESHOLD`   | 30 km | Dedup: reject if within 30km of existing    |
| `CACHE_NEARBY_YEAR_THRESHOLD` | 5 yr  | Dedup: reject if within 5 years of existing |

### Image Serving

Images are served **directly** to the `expo-image` `<Image>` component via local URI. No proxy.

```typescript
// app/(tabs)/game.tsx:124 (approximate)
<Image source={{ uri: roundData.imageUri }} ... />
```

`roundData.imageUri` is the local filesystem path from `CachedPublicImage.localUri`.

---

## 4. Game Round Assembly

### Selection (`getPublicRoundsFromCache`, lines 1575–1622)

1. Read `CacheState` from AsyncStorage
2. Filter to unseen images (not in `seenLedger`)
3. Call `selectDiverseRounds(unseen, count)` (lines 1025–1064)
4. Download any not-yet-local images
5. Fall back to `TEST_ROUNDS` if insufficient candidates

### Diversity Algorithm (`selectDiverseRounds`, lines 1025–1064)

Multi-stage relaxation strategy:

| Stage     | Min Year Gap | Min Distance |
| --------- | ------------ | ------------ |
| strict    | 30 years     | 1000 km      |
| relaxed_1 | 20 years     | 700 km       |
| relaxed_2 | 10 years     | 400 km       |
| fallback  | 0            | 0            |

Per-stage greedy selection (`selectRoundsWithStage`, lines 995–1023) scores each candidate via:

- `diversityScore()` (lines 854–870): maximizes year gap + distance from already-selected
- `eraBalanceScore()` (lines 872–902): ensures spread across 5 era buckets

After selection, `findBestConsecutiveOrdering()` (lines 940–981) reorders rounds to ensure
≥30-year gap between consecutive rounds (5 permutation strategies tried).

**Band mix constraint** (`meetsBandMixConstraints`, lines 813–837): if the candidate pool contains
older/middle/newer images, the final selection must include at least one from each band.

### Metadata Displayed After Guess

The results screen (`components/ScoreSummary/index.tsx`) shows:

- Round label (`result.roundData.label` — cleaned filename)
- Distance error in km
- Year error
- Location score, time score, hint penalty, total score

The photo viewer (`app/photo-viewer.tsx`) shows the full-screen image only — no attribution text.

**Attribution: currently not displayed anywhere in the UI.** License and author metadata is extracted
from the Wikimedia API but not stored in `CachedPublicImage` and not passed to `RoundData`.

### Source Routing

```typescript
// lib/photos.ts:1327-1330
function providersForSource(source: PublicImageSource): PublicProvider[] {
  if (source === 'wikimedia') return ['wikimedia'];
  return ['test']; // fallback to test data
}
```

`buildRoundsForGame()` (lines 1743–1780) routes by `PhotoSourcePreference`:

- `'public'` → public rounds only
- `'personal'` → personal first, public fallback
- `'mixed'` → random mix

---

## 5. Configuration and Environment

### Environment Variables

| Variable                                 | File                         | Purpose                                             |
| ---------------------------------------- | ---------------------------- | --------------------------------------------------- |
| `EXPO_PUBLIC_USE_TEST_PUBLIC_SOURCE`     | `lib/SettingsContext.tsx:32` | Dev: use hardcoded test rounds instead of Wikimedia |
| `EXPO_PUBLIC_LLM_PROVIDER`               | `lib/SettingsContext.tsx`    | Reserved (LLM disabled)                             |
| `EXPO_PUBLIC_LLM_MODEL`                  | `lib/SettingsContext.tsx`    | Reserved (LLM disabled)                             |
| `EXPO_PUBLIC_ALLOW_AI_RUNTIME_SWITCHING` | `lib/SettingsContext.tsx`    | Dev: allow switching LLM                            |

No API key variables exist. Both active APIs (Wikimedia Commons, Open-Meteo geocoding) are public
and keyless.

### Hardcoded API Endpoints

- Wikimedia: `https://commons.wikimedia.org/w/api.php` (no env override)
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search` (`lib/geocoding.ts`)

### Source Abstraction — Current State

**Minimal.** There are union types (`PublicImageSource`, `PublicProvider`) but no adapter interface
or provider pattern. The single `providersForSource()` function (lines 1327–1330) is a thin switch
with only two branches. All Wikimedia-specific fetch logic is embedded directly in `refillPublicCache`.

---

## 6. Tight Coupling — Areas Requiring Attention for Multi-Source Extension

| Coupling Point                      | Location                                           | Issue                                                                  |
| ----------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `CacheState.wikimediaCategoryIndex` | line 161                                           | Wikimedia-specific cursor baked into shared state                      |
| `CacheState.wikimediaCursors`       | line 162                                           | Same — per-category cmcontinue tokens are Wikimedia-only               |
| `WIKIMEDIA_ROOT_CATEGORIES`         | lines 211–245                                      | Hardcoded list; no concept of provider-owned category lists            |
| `refillPublicCache` fetch loop      | lines 1381–1402                                    | Directly calls Wikimedia functions; no provider dispatch               |
| `PublicPhotoCandidate.categories`   | line 123                                           | Typed as `WikiCategory[]` — Wikimedia schema leaks into candidate type |
| `EMPTY_CACHE_STATE`                 | lines 199–205                                      | Initializes Wikimedia-specific fields                                  |
| `providersForSource()`              | lines 1327–1330                                    | Only routes to 'wikimedia' or 'test'; trivial switch                   |
| `CachedPublicImage`                 | lines 142–156                                      | Missing `license`, `author`, `institutionName`, `originalUrl` fields   |
| No attribution in `RoundData`       | `lib/gameReducer.ts:4-12`                          | Attribution cannot reach the UI                                        |
| No attribution in UI                | `app/photo-viewer.tsx`, `components/ScoreSummary/` | License/author never displayed                                         |

---

## Function Reference (Key Functions)

| Function                               | Lines     | Description                                    |
| -------------------------------------- | --------- | ---------------------------------------------- |
| `fetchWikimediaFileMembers`            | 1146–1168 | GET file titles from a Wikimedia category      |
| `fetchWikimediaSubcategoryMembers`     | 1170–1185 | GET subcategory titles                         |
| `fetchWikimediaImageInfoByTitles`      | 1187–1295 | POST batch metadata + inline validation        |
| `fetchWikimediaCandidatesFromCategory` | 1302–1325 | Orchestrates the above three                   |
| `refillPublicCache`                    | 1352–1516 | Main cache refill loop (up to 4 attempts)      |
| `ensureCacheReady`                     | 1517–1554 | Ensures cache meets minimum before game start  |
| `getPublicRoundsFromCache`             | 1575–1622 | Pulls unseen rounds with diversity             |
| `buildRoundsForGame`                   | 1743–1780 | Top-level: routes by source preference         |
| `getReplacementPublicRound`            | 1782–1815 | Get substitute round mid-game                  |
| `validatePublicCandidate`              | 473–605   | Scoring + filter application                   |
| `extractYearWithProvenance`            | 666–739   | Date extraction with confidence hierarchy      |
| `extractContentYearHint`               | 650–664   | Regex year extraction from free text           |
| `selectDiverseRounds`                  | 1025–1064 | Multi-stage diversity selection                |
| `selectRoundsWithStage`                | 995–1023  | Single-stage greedy candidate selection        |
| `diversityScore`                       | 854–870   | Scores a candidate for year/distance diversity |
| `eraBalanceScore`                      | 872–902   | Scores a candidate for era coverage            |
| `findBestConsecutiveOrdering`          | 940–981   | Reorders rounds for ≥30yr consecutive gap      |
| `downloadToLocal`                      | 1072–1096 | Downloads image file to device cache           |
| `providersForSource`                   | 1327–1330 | Routes PublicImageSource → PublicProvider[]    |
| `inferLocationLabel`                   | 621–648   | Derives display location from metadata         |
| `hasAllowedLicense`                    | 1134–1144 | Wikimedia license gate                         |
| `markPublicRoundSeen`                  | 1570–1573 | Mark image as played                           |
| `clearPublicImageCache`                | 1637–1658 | Wipe cache + seen ledger                       |
| `getPublicCacheSummary`                | 1660–1676 | Cache statistics for diagnostics               |

---

## Constants Summary

| Constant                      | Value | Line | Purpose                                      |
| ----------------------------- | ----- | ---- | -------------------------------------------- |
| `PUBLIC_PASS_THRESHOLD`       | 70    | 166  | Guessability score floor for acceptance      |
| `PUBLIC_REJECT_THRESHOLD`     | 49    | 167  | Hard reject below this score                 |
| `PUBLIC_CACHE_MAX`            | 50    | 168  | Hard cap on cached images                    |
| `PUBLIC_CACHE_TARGET`         | 50    | 169  | Target unseen count to maintain              |
| `PUBLIC_FETCH_CAP`            | 180   | 170  | Max candidates fetched per refill cycle      |
| `CACHE_NEARBY_KM_THRESHOLD`   | 30    | 171  | Dedup: same location radius                  |
| `CACHE_NEARBY_YEAR_THRESHOLD` | 5     | 172  | Dedup: same-year window                      |
| `DIVERSITY_YEAR_WEIGHT`       | 120   | 182  | Weighting for year gaps in diversity scoring |
| `MIN_CONSECUTIVE_YEAR_GAP`    | 30    | 185  | Min year gap between consecutive rounds      |
| `MAX_CACHE_PER_ERA`           | 12    | 188  | Per-era cap (prevents modern domination)     |
| `MAX_CACHE_OLDER_BAND`        | 14    | 191  | Soft cap on pre-1950 images                  |
| `MAX_CACHE_NEWER_BAND`        | 20    | 192  | Soft cap on 2015+ images                     |
| `GEO_BUCKET_DEGREES`          | 1.5   | 181  | Geographic bucket size for diversity scoring |
