# Implementation Plan: Multi-Source Image Ingestion

_Based on: `AUDIT-image-sourcing.md` | Date: 2026-03-21_

This plan adds Library of Congress (LOC) and Europeana as image sources alongside Wikimedia Commons,
introduces proper attribution display, and adds geographic diversity balancing. Implementation is
split into 4 independent PRs — each is deployable and testable on its own.

---

## Research Basis

**What TimeGuessr actually uses**:

- ~60% free/CC sources (Wikimedia Commons, ETH Zürich, US Government, Willem van de Poll)
- ~40% paid editorial (AP, PA Images, Alamy) — **not needed** for a quality game

**Best free sources by expected yield through our curation filters**:

1. **Library of Congress** — primary new source; FSA/OWI collection alone has ~70k geocoded street
   photos from the 1930s–40s with strong guessability scores
2. **Europeana** — diversity layer; ETH Zürich, Deutsche Fotothek, Swedish daily life archives
3. **Wikimedia Commons** — keep as ongoing supplement

**What we're NOT adding**: NASA (fails street/people filters), Flickr Commons ($82/yr Pro for API).

---

## Architecture Overview

The key insight from the audit: `validatePublicCandidate()` (lines 473–605) is already
source-agnostic — it works on keywords from title/description, not on provider-specific metadata.
The curation pipeline needs no changes. Only the _input_ to that pipeline (candidate production) and
the _output_ (cached metadata + UI display) need updating.

```
Before:
  Wikimedia API → PublicPhotoCandidate → validatePublicCandidate() → CachedPublicImage → RoundData

After:
  WikimediaAdapter ─┐
  LOCAdapter        ├→ NormalizedPhotoCandidate → validatePublicCandidate() → CachedPublicImage → RoundData → attribution UI
  EuropeanaAdapter ─┘
```

---

## Phase A — Source Adapter Interface (PR 1)

**Goal**: Refactor only — zero behavior change. Existing Wikimedia logic moves behind a clean
interface. Tests should pass before and after with identical results.

### A1. New Types

Add to `lib/photos.ts` (or extract to `lib/photos.types.ts` if the file grows too large):

```typescript
// Normalized candidate — source-agnostic input to the curation pipeline
// Replaces the Wikimedia-specific PublicPhotoCandidate
interface NormalizedPhotoCandidate {
  provider: PublicProvider;
  providerImageId: string;
  imageUri: string;
  thumbnailUri?: string;
  location: { lat: number; lng: number };
  locationIntake: 'gps_exif' | 'structured_metadata' | 'content_inferred';
  locationConfidence: 'high' | 'medium' | 'low';
  year: number;
  yearIntake: 'capture_exif' | 'structured_metadata' | 'content_inferred' | 'upload_timestamp';
  yearConfidence: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  tags?: string[]; // replaces WikiCategory[] — source-agnostic
  // Attribution (required for display)
  license: PhotoLicense;
  author?: string;
  institutionName?: string;
  originalUrl?: string;
  // Scoring signals
  contentYearHint?: number;
  historicalContextSignal?: boolean;
  locationConflictDetected?: boolean;
}

type PhotoLicense = 'cc0' | 'public_domain' | 'cc_by' | 'cc_by_sa';

// Generalizes CacheState.wikimediaCategoryIndex + wikimediaCursors
interface ProviderCursorState {
  wikimediaCategoryIndex: number;
  wikimediaCursors: Record<string, string>;
  locPage: number; // 1-indexed page offset
  locQueryIndex: number; // index into LOC_SEARCH_QUERIES
  europeanaStart: number; // 1-indexed result offset
  europeanaQueryIndex: number;
}

interface PhotoSourceAdapter {
  provider: PublicProvider;
  fetchCandidates(
    cursor: ProviderCursorState,
    limit: number,
    diagnosticsEnabled: boolean
  ): Promise<{
    candidates: NormalizedPhotoCandidate[];
    nextCursor: ProviderCursorState;
    rejectedByReason: Record<string, number>;
  }>;
}
```

### A2. Expand Provider Union Types (lines 49–50)

```typescript
// Before
export type PublicImageSource = 'wikimedia' | 'test';
type PublicProvider = 'wikimedia' | 'test';

// After
export type PublicImageSource =
  | 'wikimedia'
  | 'loc'
  | 'europeana'
  | 'wikimedia+loc+europeana'
  | 'test';
type PublicProvider = 'wikimedia' | 'loc' | 'europeana' | 'test';
```

### A3. CacheState v3 → v4

`CachedPublicImage` gains attribution fields. `CacheState` generalizes cursor storage.

```typescript
// Updated CachedPublicImage (adds attribution)
interface CachedPublicImage {
  // All existing fields unchanged
  cacheId: string;
  provider: PublicProvider;
  providerImageId: string;
  remoteUri: string;
  localUri: string;
  location: { lat: number; lng: number };
  year: number;
  title: string;
  displayTitle: string;
  displayLocation: string;
  description?: string;
  fetchedAt: number;
  lastUsedAt?: number;
  // New attribution fields (optional for backwards compatibility)
  license?: PhotoLicense;
  author?: string;
  institutionName?: string;
  originalUrl?: string;
}

// Updated CacheState
interface CacheState {
  images: CachedPublicImage[];
  seenLedger: string[];
  providerCursors: ProviderCursorState; // replaces wikimediaCategoryIndex + wikimediaCursors
  updatedAt: number;
}

const CACHE_STORAGE_KEY = 'timeguesser.public.cache.v4'; // bump from v3

const EMPTY_CACHE_STATE: CacheState = {
  images: [],
  seenLedger: [],
  providerCursors: {
    wikimediaCategoryIndex: 0,
    wikimediaCursors: {},
    locPage: 1,
    locQueryIndex: 0,
    europeanaStart: 1,
    europeanaQueryIndex: 0,
  },
  updatedAt: 0,
};
```

**Migration** (add alongside `clearPublicImageCache`, lines 1637–1658): On first load, check for
`timeguesser.public.cache.v3`. If found, copy `images` and `seenLedger` into v4 state, initialize
`providerCursors` from the v3 `wikimediaCategoryIndex`/`wikimediaCursors` fields, write v4, delete
v3. This preserves existing users' seen ledgers across the upgrade.

### A4. WikimediaAdapter Object

Wrap existing functions behind the interface. The three Wikimedia fetch functions at lines 1146–1325
become private to the adapter. The adapter's `fetchCandidates` calls them and maps output to
`NormalizedPhotoCandidate`:

```typescript
// Additional field extraction for NormalizedPhotoCandidate
// (from fetchWikimediaImageInfoByTitles, after existing validation)
license: mapWikimediaLicense(ext); // see below
author: stripHtml(ext?.Artist?.value);
institutionName: 'Wikimedia Commons';
originalUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`;
tags: candidate.categories?.map((c) => c.title) ?? [];

function mapWikimediaLicense(ext: WikiExtMetadata): PhotoLicense {
  const s = String(ext?.LicenseShortName?.value ?? '').toLowerCase();
  if (s.includes('cc0') || s.includes('public domain')) return 'cc0';
  if (s.includes('cc by-sa')) return 'cc_by_sa';
  if (s.includes('cc by')) return 'cc_by';
  return 'public_domain'; // fallback for already-accepted licenses
}
```

### A5. Refactor `refillPublicCache` Dispatch (lines 1352–1516)

Replace the hardcoded Wikimedia call at lines 1381–1402 with adapter dispatch:

```typescript
const ADAPTERS: Record<PublicProvider, PhotoSourceAdapter> = {
  wikimedia: wikimediaAdapter,
  loc: locAdapter, // stub in Phase A, implemented in Phase B
  europeana: europeanaAdapter, // stub in Phase A, implemented in Phase C
  test: testAdapter,
};

function providersForSource(source: PublicImageSource): PublicProvider[] {
  switch (source) {
    case 'wikimedia':
      return ['wikimedia'];
    case 'loc':
      return ['loc'];
    case 'europeana':
      return ['europeana'];
    case 'wikimedia+loc+europeana':
      return ['wikimedia', 'loc', 'europeana'];
    default:
      return ['test'];
  }
}
```

Stubs for LOC and Europeana adapters return empty candidates in Phase A.

### A6. `validatePublicCandidate` Update

Update the function signature from `PublicPhotoCandidate` to `NormalizedPhotoCandidate`. The
scoring logic (lines 473–605) is unchanged — it reads `title` and `description`, both of which
are present in `NormalizedPhotoCandidate`.

Change `candidate.categories` references to `candidate.tags` (strings instead of `WikiCategory`
objects — use `tag` directly instead of `category.title`).

### Phase A Verification

```bash
npm test                         # vitest — must pass unchanged
npm run test:maestro:smoke:auto  # UI smoke — cache fills from Wikimedia as before
```

Check `getPublicCacheSummary()` in diagnostics: same fill behavior, now with attribution fields
populated on new images.

---

## Phase B — Library of Congress Adapter (PR 2)

### API Details

- **Base URL**: `https://www.loc.gov/photos/?fo=json`
- **Auth**: None required
- **Rate limit**: Soft — add `500ms` delay between page requests
- **Pagination**: `sp={page}` (1-indexed), `c={count}` for results per page (use 25)

### Search Queries

```typescript
const LOC_SEARCH_QUERIES = [
  // FSA/OWI — 1930s-40s American street life, excellent location metadata
  'fa=online-format:image&q=street+scene&dates=1930/1945&fa=subject:farm+security+administration',
  // Detroit Publishing — US cityscapes 1885-1930
  'fa=contributor:detroit+publishing+company&dates=1885/1930',
  // Matson — Middle East 1898-1946
  'fa=contributor:matson+photograph+collection',
  // HABS/HAER — buildings/engineering with lat/lng coordinates
  'fa=online-format:image&q=street+exterior&fa=division:habs',
  // General outdoor street photography
  'fa=online-format:image&q=street+crowd+people&dates=1900/1970',
] as const;
```

### Metadata Extraction

```typescript
// LOC JSON result item fields → NormalizedPhotoCandidate
imageUri:         item.image_url?.[0]
thumbnailUri:     item.resources?.[0]?.files?.[0]?.[1]?.url   // medium-res variant
title:            item.title
description:      item.description?.[0]
year:             parseLOCDate(item.date ?? item.created_published?.[0])
location (text):  [item.location_country?.[0], item.location_city?.[0]].filter(Boolean).join(', ')
latLng:           parseLOCLatLng(item.coordinates ?? item.latlong)   // "lat, lng" string
license:          mapLOCRights(item.rights_information)
author:           item.contributor?.[0]
institutionName:  'Library of Congress'
originalUrl:      item.url

function parseLOCDate(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/\b(1[89]\d\d|20[012]\d)\b/);
  return m ? parseInt(m[1]) : null;
}

function parseLOCLatLng(raw: string | undefined): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && parts.every(isFinite)) return { lat: parts[0], lng: parts[1] };
  return null;
}

function mapLOCRights(rights: string | undefined): PhotoLicense | null {
  if (!rights) return null;
  const r = rights.toLowerCase();
  if (r.includes('no known copyright') || r.includes('public domain')) return 'public_domain';
  if (r.includes('cc0')) return 'cc0';
  return null;  // null = reject (rights-managed or unclear)
}
```

**Location fallback**: When `parseLOCLatLng` returns null, call the existing
`geocodeLocation(locationText)` in `lib/geocoding.ts` to resolve text → lat/lng. Set
`locationIntake: 'structured_metadata'`, `locationConfidence: 'medium'`.

**Missing year**: If `parseLOCDate` returns null, call `extractContentYearHint(title + description)`
(line 650–664). If still null, reject the candidate (year is required).

**Missing image URL**: If `item.image_url` is absent, check
`item.resources[0].files[0][2].url` (full-res from IIIF). If still absent, reject.

**Rate limiting**: `await new Promise(r => setTimeout(r, 500))` between each page request.

### Dev Flag

Gate LOC behind `EXPO_PUBLIC_ENABLE_LOC_SOURCE === '1'` in SettingsContext. When the flag is off,
the LOC adapter stub returns empty candidates. This allows Phase B to land without changing the
default user experience.

### Phase B Verification

```bash
# Set EXPO_PUBLIC_ENABLE_LOC_SOURCE=1 in .env
npm test                                           # add unit test for parseLOCDate, mapLOCRights
# Trigger cache refill in app, inspect diagnostics
# Expect: LOC candidates visible, attribution shows 'Library of Congress'
npm run test:maestro:smoke:auto
```

Target: ≥30% of LOC candidates pass guessability scoring (FSA/OWI collection should score well on
street + people + temporal signals).

---

## Phase C — Europeana Adapter (PR 3)

### API Details

- **Base URL**: `https://api.europeana.eu/record/v2/search.json`
- **Auth**: Free API key — register at europeana.eu
- **Env var**: `EXPO_PUBLIC_EUROPEANA_API_KEY` (add placeholder to `.env.example`)
- **Rate limit**: None enforced — use 300ms delay between requests
- **Always include**: `reusability=open` (restricts to CC0/PD/CC-BY/CC-BY-SA)

### Search Queries

```typescript
const EUROPEANA_SEARCH_QUERIES = [
  // ETH Zürich — Swiss street life, high quality
  { q: 'street people city', qf: 'DATA_PROVIDER:"ETH-Bibliothek"', type: 'IMAGE' },
  // Swedish daily life
  { q: 'street people crowd', qf: 'COUNTRY:sweden', type: 'IMAGE' },
  // Deutsche Fotothek
  { q: 'street scene', qf: 'DATA_PROVIDER:"Deutsche Fotothek"', type: 'IMAGE' },
  // Austrian WWI-era outdoor photos
  { q: 'outdoor crowd street', qf: 'COUNTRY:austria', type: 'IMAGE', dateRange: '[1900 TO 1950]' },
  // Rijksmuseum photographs (exclude paintings via keyword)
  { q: 'photograph street', qf: 'DATA_PROVIDER:"Rijksmuseum"', type: 'IMAGE' },
] as const;
```

Query construction:

```
/search.json?wskey={API_KEY}&query={q}&qf=TYPE:IMAGE&qf={qf}&reusability=open&rows=25&start={start}
```

### Metadata Extraction

```typescript
// Europeana search result item → NormalizedPhotoCandidate
imageUri:         item.edmIsShownBy?.[0]               // direct image URL — reject if absent
thumbnailUri:     item.edmPreview?.[0]
title:            item.title?.[0]
description:      item.dcDescriptionLangAware?.en?.[0] ?? item.dcDescription?.[0]
year:             parseEuropeanaYear(item.year?.[0])
location (text):  item.country?.[0]
latLng:           null                                 // rarely available in search API
license:          mapEuropeanaRights(item['rights']?.[0])
author:           item.dcCreator?.[0]
institutionName:  item.dataProvider?.[0]
originalUrl:      item.guid

function parseEuropeanaYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw);
  return n >= 1800 && n <= new Date().getFullYear() ? n : null;
}

function mapEuropeanaRights(rights: string | undefined): PhotoLicense | null {
  if (!rights) return null;
  if (rights.includes('creativecommons.org/publicdomain/zero')) return 'cc0';
  if (rights.includes('creativecommons.org/licenses/by-sa'))    return 'cc_by_sa';
  if (rights.includes('creativecommons.org/licenses/by/'))      return 'cc_by';
  if (rights.includes('rightsstatements.org/vocab/NoC') || rights.includes('publicdomain'))
    return 'public_domain';
  return null;
}
```

**Metadata quality handling**: Europeana fields are inconsistent. All field accesses must use
optional chaining. Hard reject when:

- `edmIsShownBy` is absent (no image)
- `mapEuropeanaRights` returns null (non-open license)
- Year cannot be extracted from any field (including `extractContentYearHint`)
- Location cannot be resolved to lat/lng (Europeana search rarely has coordinates — use geocoding
  on `item.country` + query collection name as fallback)

**Pagination**: use `start` parameter incrementing by `rows` (25). Europeana returns `nextCursor`
in some contexts but it's unreliable in the search API; stick to offset-based pagination.

### Dev Flag

`EXPO_PUBLIC_ENABLE_EUROPEANA_SOURCE === '1'` — same pattern as LOC in Phase B.

### Phase C Verification

```bash
# EXPO_PUBLIC_EUROPEANA_API_KEY set in .env
# EXPO_PUBLIC_ENABLE_EUROPEANA_SOURCE=1
npm test   # add unit tests for parseEuropeanaYear, mapEuropeanaRights
# Inspect diagnostics: expect European images (Swiss, Swedish, German, Austrian)
# Verify combined cache has both LOC (US) and Europeana (European) images
```

---

## Phase D — Geographic Diversity Balancing (PR 4)

### Problem

LOC ≈ 90% US. Europeana ≈ 80% European. Without balancing, the cache clusters by whichever source
was filled most recently.

### Region Classification

Add `region: GeoRegion` to `NormalizedPhotoCandidate` and `CachedPublicImage`:

```typescript
type GeoRegion =
  | 'north_america'
  | 'latin_america'
  | 'western_europe'
  | 'eastern_europe'
  | 'middle_east'
  | 'africa'
  | 'south_asia'
  | 'east_asia'
  | 'southeast_asia'
  | 'oceania'
  | 'unknown';

// Simple bounding-box classifier — no external API
function classifyRegion(lat: number, lng: number): GeoRegion {
  if (lng < -30 && lat > 15) return 'north_america';
  if (lng < -30 && lat <= 15) return 'latin_america';
  if (lng >= -30 && lng < 45 && lat > 35) return 'western_europe';
  if (lng >= 20 && lng < 45 && lat > 35) return 'eastern_europe';
  if (lng >= 25 && lng < 65 && lat > 10 && lat <= 40) return 'middle_east';
  if (lng >= -20 && lng < 55 && lat <= 38 && lat > -35) return 'africa';
  if (lng >= 65 && lng < 90 && lat > 0) return 'south_asia';
  if (lng >= 90 && lng < 150 && lat > 0) return 'east_asia';
  if (lng >= 90 && lng < 150 && lat <= 0) return 'southeast_asia';
  if (lng >= 110 && lat < -10) return 'oceania';
  return 'unknown';
}
```

### Cache-Level Region Cap

```typescript
const MAX_CACHE_PER_REGION = 20; // ~40% of 50-image cache max
```

In `refillPublicCache`, after the existing era/band caps (lines 1430–1470), add:

```typescript
const regionCounts = countBy(state.images, (img) => img.region ?? 'unknown');
if ((regionCounts[candidate.region ?? 'unknown'] ?? 0) >= MAX_CACHE_PER_REGION) {
  skippedAsRegionFull++;
  continue;
}
```

**No changes needed to round assembly**: the existing `GEO_BUCKET_DEGREES = 1.5°` bucket system
in `diversityScore()` (lines 854–870) already penalizes round selections that cluster geographically.
The region cap operates at the cache level, ensuring diverse input to the selection algorithm.

### Provider Rotation in Multi-Source Mode

When `publicImageSource === 'wikimedia+loc+europeana'`, interleave providers across refill
iterations instead of exhausting one provider before moving to the next:

```typescript
// In refillPublicCache, per-iteration provider selection
const providers = providersForSource(publicImageSource);
const providerIndex = (state.providerCursors.refillIteration ?? 0) % providers.length;
const activeProvider = providers[providerIndex];
// Increment refillIteration in ProviderCursorState after each fetch
```

Add `refillIteration: number` to `ProviderCursorState`.

### Settings Integration

Add to `SettingsContext` (under `timeguesser.settings.v1`, backwards-compatible new field):

```typescript
publicImageIntake: PublicImageSource; // default: 'wikimedia'
```

Expose in the Settings screen (after Phase D validation) with options:

- `'wikimedia'` — Wikimedia Commons only (current default)
- `'wikimedia+loc+europeana'` — All three sources

### Phase D Verification

```bash
# Settings: publicImageSource = 'wikimedia+loc+europeana'
# Trigger 3 full cache refills (clear cache between each)
# Run getPublicCacheSummary() — verify no region > 20 images
# Play 10 games — verify rounds span multiple continents
npm run test:maestro:smoke:auto
```

---

## Attribution Display

### Format

```
Dorothea Lange · Public Domain · via Library of Congress
```

Display order: `{author} · {license label} · via {institution}`. If author is missing, omit that
segment. For `cc_by_sa`, add "(share-alike)" after the license label.

### License Label Map

```typescript
const LICENSE_LABELS: Record<PhotoLicense, string> = {
  cc0: 'CC0',
  public_domain: 'Public Domain',
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
};
```

### RoundData Extension (`lib/gameReducer.ts:4-12`)

```typescript
interface RoundData {
  // ...existing fields...
  attribution?: {
    license: PhotoLicense;
    author?: string;
    institutionName?: string;
    originalUrl?: string;
  };
}
```

Attribution flows: `CachedPublicImage` → `buildRoundsForGame()` (lines 1743–1780) → `RoundData`.

### UI Placement

**`components/ScoreSummary/index.tsx`** — add attribution line below the description text, after
the label (line 60). Use design tokens: `TypeScale.caption2` (11px), muted foreground color.

```typescript
// After the existing label/description display:
{roundData.attribution && (
  <Text style={styles.attribution}>
    {formatAttribution(roundData.attribution)}
  </Text>
)}
```

**`app/photo-viewer.tsx`** — add attribution in a bottom overlay bar (semi-transparent), same
format. Do not grow `game.tsx` — attribution goes in `ScoreSummary` and `photo-viewer` only.

---

## Files to Modify

| File                                | Change                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `lib/photos.ts`                     | Core: add types, adapters, CacheState v4, refill refactor, region classifier |
| `lib/gameReducer.ts`                | Add `attribution?` to `RoundData`                                            |
| `lib/SettingsContext.tsx`           | Add `publicImageSource` setting (default `'wikimedia'`)                      |
| `components/ScoreSummary/index.tsx` | Add attribution display row                                                  |
| `app/photo-viewer.tsx`              | Add attribution bottom overlay                                               |
| `.env.example`                      | Add `EXPO_PUBLIC_EUROPEANA_API_KEY=` placeholder                             |
| `lib/__tests__/photos.test.ts`      | New: unit tests for license mappers, date parsers                            |

**Do not create new top-level directories.** If `lib/photos.ts` becomes unwieldy, extract adapters
into `lib/photoAdapters/wikimedia.ts`, `lib/photoAdapters/loc.ts`, etc. — sub-directories of `lib/`
are allowed.

---

## Reusable Existing Functions

| Function                    | File:Lines          | Reuse In                                      |
| --------------------------- | ------------------- | --------------------------------------------- |
| `extractContentYearHint()`  | photos.ts:650–664   | LOC + Europeana year fallback                 |
| `validatePublicCandidate()` | photos.ts:473–605   | Unchanged — receives NormalizedPhotoCandidate |
| `downloadToLocal()`         | photos.ts:1072–1096 | Unchanged — source-agnostic already           |
| `selectDiverseRounds()`     | photos.ts:1025–1064 | Unchanged                                     |
| `lib/geocoding.ts` (entire) | lib/geocoding.ts    | LOC + Europeana text-location → lat/lng       |
| `seenKey()`                 | photos.ts:~434      | Unchanged — already `provider:imageId` format |

---

## Migration Summary

| Phase | PR  | Behavior change                           | Risk   | Key constraint                        |
| ----- | --- | ----------------------------------------- | ------ | ------------------------------------- |
| A     | 1   | None — refactor + CacheState v4           | Low    | AsyncStorage key bump (approved)      |
| B     | 2   | LOC images (dev flag only)                | Low    | 500ms rate limit between LOC requests |
| C     | 3   | Europeana images (dev flag only)          | Low    | Europeana API key needed              |
| D     | 4   | Multi-source default option + region caps | Medium | Region classifier accuracy            |

Each PR is mergeable independently. Phase D depends on B and C being stable but can be developed
against stubs.

---

## Notes for Implementation

- **No new npm packages**: LOC and Europeana use `fetch()` already available in React Native
- **LOC**: No API key — can be enabled immediately after Phase A lands
- **Europeana**: Register free key at europeana.eu before starting Phase C
- **AGENTS.md constraints overridden by this plan**: external API addition, AsyncStorage key change
- **`game.tsx` must not grow** — all attribution UI goes in `ScoreSummary` and `photo-viewer`
- **Scoring constants unchanged** — this plan does not touch `constants/scoring.ts` or the
  `MAX_*_SCORE` / hint cost values
