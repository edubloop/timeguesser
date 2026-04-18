# Phase 0 Triage - Visual Experimentation Baseline

Date: 2026-03-21

## Goal

Re-baseline current local changes so TimeGuesser can move into a controlled visual experimentation track with clear separation between:

- foundation/performance runway
- QA/testability support
- behavioral-risk changes

## Snapshot

- Tracked modified files: 14
- Untracked files/directories: many (docs/config/workspace artifacts and duplicates)
- Type check: pass (`npm run typecheck`)

## Bucket 1 - Foundation / Performance (keep and stage together)

These align directly with the "prepare runway for richer visuals" intent.

- `app.json`
  - Enables React Compiler experiment (`expo.experiments.reactCompiler = true`).
- `app/(tabs)/settings.tsx`
  - Stabilizes cache-summary callback dependency.
- `components/RoundTimer/index.tsx`
  - Moves progress updates toward Reanimated-driven behavior, cancels on pause.
- `components/ScoreReveal/AnimatedCounter.tsx`
  - Replaces JS RAF counter loop with Reanimated shared-value animation.
- `lib/SettingsContext.tsx`
  - Splits subscriptions into focused contexts (`mapProvider`, `roundBuild`, `gameRuntime`).
- `lib/gameState.tsx`
  - Narrows subscription to round-build settings.
- `components/MapView/index.tsx`
  - Narrows subscription to map provider setting.
- `components/MapView/AppleMapView.tsx`
  - Import cleanup.
- `components/MapView/GoogleMapView.tsx`
  - Import cleanup.

## Bucket 2 - QA / Testability (keep and stage together)

These support deterministic UI automation and experimentation checks.

- `components/GuessButton/index.tsx`
  - Adds optional `testID` passthrough.
- `components/ScoreReveal/index.tsx`
  - Adds `testID="score-reveal"`.

## Bucket 3 - Behavioral Risk (isolate before phase 1)

These need explicit decision because they can alter runtime behavior beyond pure perf/QA concerns.

- `lib/photos.ts`
  - Mostly good typing/hardening improvements.
  - **High-risk behavior change:** `candidateToRound()` switched `imageUri` from `localUri` to `remoteUri`.
    - This bypasses local cache use and can affect reliability/perf/offline behavior.
  - **Recommended isolate decision:** keep typings + download hardening, hold/review `localUri -> remoteUri` separately.
- `lib/geocoding.ts`
  - Low-risk typing cleanup (`any` to explicit interface); can ship with foundation if desired.
- `package-lock.json`
  - Dependency lock drift (`tar`, `undici`) with unclear provenance.
  - Keep isolated unless tied to an intentional install/update step.

## Untracked Cleanup Notes (not part of phase 1 scope)

- Duplicate files with `2` suffix exist in multiple locations (docs/scripts/workflow artifacts).
- Workspace/process artifacts are mixed with app work (`CHANGELOG.md`, `PERFORMANCE_PLAN*.md`, `WORKSPACE_KIT_ADOPTION_LOG*.md`, templates).
- Keep these out of phase 1 experiment work to reduce branch noise.

## Staging Sequence Recommendation

Use focused commits in this order:

1. Foundation/performance bucket.
2. QA/testability bucket.
3. Behavioral-risk bucket only after explicit decision on `lib/photos.ts` image URI behavior.

## Readiness Gate For Phase 1 (Feature Flags / Labs UI)

Status: **Ready**

- Ready:
  - Core perf runway changes are coherent and type-safe.
  - QA hooks are in place for experiment validation.
- Blocker resolution:
  - `lib/photos.ts` risky behavior change (`localUri -> remoteUri`) was reverted to preserve local-cache runtime behavior.
  - Typing and download-hardening improvements remain isolated and reviewable.
- Advisory:
  - Keep `package-lock.json` isolated unless dependency updates are intentional.

Once the `lib/photos.ts` decision is made, Phase 1 can start cleanly.
