---
name: timeguesser-feature
description: Build and ship TimeGuesser features with ambitious React Native UI, motion, gestures, and approved API integrations. Use whenever the user asks for TimeGuesser feature implementation, interaction design, map/photo gameplay updates, or API-driven game enhancements.
metadata:
  version: '0.3.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/timeguesser-feature.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# TimeGuesser Feature Development

TimeGuesser is the primary experimental ground for pushing React Native UI/UX. Default to ambitious, technically interesting implementations. This is a solo project with no production risk — conservatism is the wrong instinct here.

---

## Project Context

**Stack:** TypeScript / React Native / Expo Router 6 / Reanimated 4.1.1
**Routing:** File-based (`app/(tabs)/`, `app/photo-viewer.tsx`)
**State:** Context + Reducer pattern (`GameProvider`, `SettingsProvider`, `ThemeProvider`)
**APIs:** Wikimedia Commons (`lib/photos.ts`) + Open-Meteo geocoding (`lib/geocoding.ts`)
**Maps:** Dual provider — Apple Maps + Google Maps via `components/MapView/`

Before starting any feature: read `TIMEGUESSER_SPEC.md` and `TIMEGUESSER_DESIGN_SYSTEM.md` for full context.

---

## Design System — Use These, Don't Invent

All tokens live in `constants/theme.ts` and `constants/Colors.ts`.

### Animation Timings (always use these durations)

```ts
anim.instant   = 80ms   easeOut      // state changes, toggles
anim.fast      = 120ms  easeOut      // button feedback, micro-interactions
anim.standard  = 150ms  easeInOut    // most UI transitions
anim.entrance  = 200ms  easeOut      // elements entering the screen
anim.exit      = 120ms  easeIn       // elements leaving
```

### Colors (via useThemeColor hook — always theme-aware)

```ts
// Accent
teal:   light=#1A8A7D  dark=#2BBFAD

// Score tiers
scoreExcellent  // 8000-10000 pts
scoreGood       // 5000-7999 pts
scoreFair       // 2000-4999 pts
scorePoor       // 0-1999 pts

// Map
mapPinPlayer, mapPinAnswer, mapDistanceLine, mapSearchBar
```

### Spacing

```ts
xs=4  sm=8  md=12  lg=16  xl=24  xxl=32  xxxl=48
```

### Typography

- System font (San Francisco) throughout
- Tabular numerals for any animated score/number displays (`fontVariant: ['tabular-nums']`)

---

## Reanimated 4.x Patterns

The project uses Reanimated 4.1.1. Use the modern API:

```ts
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  ZoomIn,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
```

### Established patterns in the codebase

```ts
// Entrance (already used in ScoreSummary)
entering={FadeInDown.delay(600 + index * 150).duration(400)}

// Timer progress bar (already used in RoundTimer)
const progress = useSharedValue(1);
withTiming(0, { duration: timerMs, easing: Easing.linear })

// Button press scale (already used in GuessButton)
scale: withTiming(pressed ? 0.97 : 1, { duration: 80 })
```

### Patterns NOT yet used — push into these

- **Spring physics**: `withSpring(value, { damping: 15, stiffness: 150 })`
- **Gesture-driven pan/swipe**: `Gesture.Pan()` with `useSharedValue` position
- **Interpolated transforms**: color, opacity, scale from a single gesture value
- **Staggered reveals with spring**: individual item springs with increasing delay
- **Layout animations**: `Layout.springify()` for dynamic list reordering
- **Pinch-to-zoom**: `Gesture.Pinch()` on photo viewer (spec mentions this, not implemented)
- **Shared element transitions**: photo expanding from thumbnail to full-screen

---

## Approved External APIs

Only two APIs are permitted. No new external services without explicit approval.

### Wikimedia Commons (lib/photos.ts)

```ts
// Base URL
https://commons.wikimedia.org/w/api.php

// Main query pattern
?action=query&generator=categorymembers&gcmtitle=Category:NAME
  &gcmtype=file&gcmlimit=50&prop=imageinfo|categories
  &iiprop=url|size|extmetadata&format=json&origin=*

// Useful metadata fields in extmetadata:
ImageDescription, DateTimeOriginal, GPSLatitude, GPSLongitude,
Artist, LicenseShortName, Categories
```

**Unexploited potential in photos.ts:**

- `Categories` array is fetched but minimally used — rich source for contextual hints
- `Artist` metadata could drive attribution UI
- `ImageDescription` often contains location/era context — parseable for hint generation
- Higher-res image tiers available (change `&iiurlwidth=` param)

### Open-Meteo (lib/geocoding.ts)

```ts
// Geocoding (currently used)
https://geocoding-api.open-meteo.com/v1/search?name=QUERY&count=5

// Weather API (NOT yet used — available, free, no key required)
https://api.open-meteo.com/v1/forecast
  ?latitude=LAT&longitude=LON
  &current=temperature_2m,weather_code
  &timezone=auto

// Historical weather (could contextualise guesses)
https://archive-api.open-meteo.com/v1/archive
  ?latitude=LAT&longitude=LON&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  &daily=temperature_2m_mean,precipitation_sum
```

---

## Locked Constants — Never Change

These affect game balance and recorded player scores. Do not modify without explicit approval.

```ts
// constants/scoring.ts
MAX_LOCATION_SCORE = 5000;
MAX_TIME_SCORE = 5000;
MAX_SCORE_PER_ROUND = 10000; // = MAX_LOCATION_SCORE + MAX_TIME_SCORE
ROUNDS_PER_GAME = 5;
HINT_PENALTY = 1000; // per tier 2-5 hint
LOCATION_DISTANCE_BASE = 12000; // km — denominator in location score formula
TIME_YEAR_BASE = 120; // years — denominator in time score formula
```

The scoring formula shapes are fixed:

```ts
locationScore = 5000 * Math.max(0, 1 - distanceKm / 12000) ** 2;
timeScore = 5000 * Math.max(0, 1 - Math.abs(yearDiff) / 120) ** 2;
```

---

## Component Architecture

### Adding a new component

```
components/
  NewComponent/
    index.tsx       ← default export, main component
    NewComponent.tsx ← implementation (if splitting)
```

Use `useThemeColor` from `components/Themed.tsx` for all colors:

```ts
const bgColor = useThemeColor(
  { light: Colors.light.background, dark: Colors.dark.background },
  'background'
);
```

### State changes that affect game logic

Go through `lib/gameReducer.ts` — add new action types, update `GameState` interface, handle in the reducer. Don't put game logic in screen components.

### Settings that persist

Use `SettingsContext` — it handles `AsyncStorage` persistence automatically.

---

## Feature Ideas Worth Building

These are technically interesting and within the established stack:

**Animations:**

- Photo entrance: shared element expand from thumbnail using Reanimated layout animations
- Score celebration: particle burst on perfect score (Reanimated + manual geometry)
- Map pin drop: spring physics landing animation when pin is placed
- Hint reveal: animated circle expand with Reanimated (replaces static reveal)
- Round transition: swipe-to-next-round gesture with snap physics
- Score counter: replace RAF-based AnimatedCounter with Reanimated shared value tween

**Gestures:**

- Pinch-to-zoom on photo viewer (spec calls for this, not implemented)
- Swipe-down to dismiss photo viewer (currently tap-only)
- Long-press on map pin for coordinate readout

**API depth:**

- Weather context hint: fetch Open-Meteo historical weather for photo location/year as an optional Tier 1 hint upgrade
- Richer Wikimedia category parsing: extract decade/era from categories to improve temporal hint quality
- Progressive image loading: use Wikimedia's `iiurlwidth` tiers for blur-up effect

**UI:**

- Dynamic Island / Live Activity for round timer (iOS 16+)
- Haptic feedback on pin placement, score tier reveal, and hint use
- Score tier color pulse animation on reveal

---

## Run, Preview & Test

Always `cd TimeGuesser` first.

### Level 1 — Local dev server (fastest, hot reload)

```bash
npx expo start          # Metro bundler + QR code for Expo Go
npx expo start --ios    # Open directly in iOS simulator
npx expo run:ios        # Full native build + launch in simulator
```

Use this for active development. Changes reflect instantly via Fast Refresh.

### Level 2 — EAS Update (OTA push, no rebuild)

Pushes JS/assets over-the-air to any device already running the app. Fastest way to get a change onto a real device without a full build.

```bash
# Push update to the preview branch
eas update --branch preview --message "describe what changed"

# Push to production branch (live users)
eas update --branch production --message "describe what changed"

# Check update status
eas update:list --branch preview --limit 5
```

No recompilation — updates land in seconds. Use this after `npx expo start` iteration is done and you want to test on a real device.

### Level 3 — EAS Preview build (full simulator build)

Builds a full `.app` for the iOS simulator via EAS cloud. Slower (~10-15 min) but validates the full native build.

```bash
# Build for simulator (preview profile)
eas build --platform ios --profile preview

# Watch build progress
eas build:list --platform ios --limit 3

# Once complete — download and install on simulator
# EAS CLI will provide the install URL/command
```

The `preview` profile (`eas.json`) has `distribution: internal` and `ios.simulator: true` — builds a `.app` file, not a `.ipa`.

### EAS project reference

- **Project ID:** `a088eb07-5f57-4115-9f11-f78a26d54748`
- **App Store app ID:** `6759728092` (submit profile)
- **Apple Team ID:** `UV6AAW73XT`

### Type check & lint

```bash
npx tsc --noEmit   # type check
npm run lint       # lint
```

No unit tests currently — add them in `__tests__/` following Expo conventions if introducing complex logic.
