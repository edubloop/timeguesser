# Performance Improvement Plan (Expo Lag Reduction)

This document is the living source of truth for performance work in TimeGuesser.
It captures rationale, decisions, implementation progress, and measured outcomes.

Primary input:

- Expo blog: <https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps>

## Purpose

- Convert high-level Expo guidance into concrete, measurable improvements for TimeGuesser.
- Keep performance reasoning in one place so future changes remain intentional.
- Prevent regressions by tracking baseline and post-change metrics for core gameplay flows.

## Scope

- JavaScript thread load and render churn reduction.
- Animation smoothness improvements for gameplay overlays and timers.
- Render containment and subscription narrowing in stateful screens.
- Tooling and profiling workflow improvements relevant to Expo/React Native performance.

## Non-Goals

- No scoring formula changes.
- No hint cost/tier behavior changes.
- No provider-chain order changes.
- No AsyncStorage key changes.
- No product feature expansion unrelated to lag/performance.

## Success Metrics

Track these per flow in both development and release profiles:

- JS long tasks: fewer tasks over 16ms during interaction-heavy moments.
- Render churn: fewer avoidable rerenders in `app/(tabs)/game.tsx` subtree.
- Animation quality: smoother score reveal and timer behavior during busy JS periods.
- Interaction responsiveness: no noticeable lag on map taps, hint modal open/close, and round transitions.

## Core Flows To Measure

1. Home -> Start Game -> Game screen ready.
2. In-game map interaction: place/move pin, search, hints modal open/close.
3. End-of-round reveal: score overlay animation, detail expand/collapse, next round.

## Baseline (Before Implementation)

Status: partial development-baseline captured in iOS simulator via React Native Performance Monitor.

### Baseline Capture Session Metadata

- Date prepared: 2026-03-21
- Code revision: `9d443ac`
- Tooling: Expo CLI (`J` -> Chrome DevTools), React DevTools Profiler, render highlight mode
- Required run contexts:
  - Development build (`npm run ios`)
  - Release profile build (`npx expo run:ios --configuration Release` or equivalent local release run)

### Measurement Fields (fill during profiling)

| Flow                             | Device / OS         | Build Mode  | JS Long Tasks (>16ms) | Render Hotspots | Subjective Smoothness (1-5) | Notes                                                                                 |
| -------------------------------- | ------------------- | ----------- | --------------------- | --------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| Home -> Start Game -> Game ready | iOS simulator (TBD) | Development | Not captured          | Not captured    | 5                           | Min FPS observed: UI 60, JS 60                                                        |
| Map interaction + hint modal     | iOS simulator (TBD) | Development | Not captured          | Not captured    | 4                           | Lowest JS FPS observed: 59 while activating hint; mostly 60                           |
| Score reveal + expand/collapse   | iOS simulator (TBD) | Development | Not captured          | Not captured    | 4                           | Lowest UI FPS observed: 58 while tapping Guess and entering year; otherwise mostly 60 |

## Post-Optimization Snapshot (After Phases 1-6)

Status: partial development-mode snapshot captured in iOS simulator via React Native Performance Monitor.

| Flow                             | Device / OS         | Build Mode  | Lowest UI FPS | Lowest JS FPS | Notes                                                    |
| -------------------------------- | ------------------- | ----------- | ------------- | ------------- | -------------------------------------------------------- |
| Home -> Start Game -> Game ready | iOS simulator (TBD) | Development | 58            | 56            | Reported immediately after pressing Start Game           |
| Map interaction + hint modal     | iOS simulator (TBD) | Development | 59            | 60            | Map/image interaction mostly 59/60; hints reported at 60 |
| Score reveal + expand/collapse   | iOS simulator (TBD) | Development | 58            | 60            | UI dip observed during Guess/year entry                  |

### Capture Protocol (use every time)

1. Clear Metro state and launch clean session.
2. Warm app once, then record on second run to reduce startup noise.
3. Capture profiler traces for each core flow in dev mode.
4. Repeat in release mode for realistic frame timing.
5. Record exact steps and cache/network conditions in Notes.
6. Save trace artifacts with date stamp and link from Execution Log.

### Beginner Guide (CLI + Simulator)

If you are new to Expo performance profiling, follow these exact steps.

1. Start the app from CLI
   - Run `npm run ios` in the project root.
   - Wait for the app to open in the iOS simulator.

2. Open JavaScript DevTools
   - In the terminal where Expo is running, press `j`.
   - Chrome DevTools opens and connects to Hermes.

3. Measure one flow at a time in Performance tab
   - In Chrome DevTools, open the `Performance` tab.
   - Click `Record`.
   - Perform one flow in simulator (for example: Home -> Start Game).
   - Click `Stop`.
   - In the timeline, count JavaScript tasks over ~16ms.
   - Note the biggest task duration.

4. Identify rerender hotspots
   - Open React DevTools.
   - Go to `Profiler` -> gear icon -> enable `Highlight updates when components render`.
   - Repeat the same flow in simulator.
   - Note which components flash repeatedly.

5. Rate smoothness
   - Give the flow a score from 1 to 5:
     - 5: smooth
     - 4: mostly smooth, tiny hitch
     - 3: noticeable stutter
     - 2: frequent stutter
     - 1: severe lag

6. Repeat for all three baseline flows
   - Flow 1: Home -> Start Game -> Game ready
   - Flow 2: Map interaction + hint modal
   - Flow 3: Score reveal + expand/collapse

7. Fill the baseline table in this document
   - Enter long-task count, max task duration, hotspot components, and smoothness score.

8. Stop the dev server when finished
   - In terminal, press `Ctrl+C`.

### Baseline Session 1 Worksheet

Use this exact worksheet when capturing the first baseline session.

```md
#### Baseline Session 1 (YYYY-MM-DD)

- Device: <device model>
- OS: <iOS version>
- Build mode: <development | release>
- App data state: <fresh install | existing cache>
- Network state: <wifi | cellular | offline fallback>
- Commit: <short sha>

Flow 1 - Home -> Start Game -> Game ready

- Step trace: <brief sequence>
- JS long tasks (>16ms): <count + max ms>
- Render hotspots: <component names>
- Smoothness (1-5): <score>
- Notes: <anything unusual>

Flow 2 - Map interaction + hint modal

- Step trace: <brief sequence>
- JS long tasks (>16ms): <count + max ms>
- Render hotspots: <component names>
- Smoothness (1-5): <score>
- Notes: <anything unusual>

Flow 3 - Score reveal + expand/collapse

- Step trace: <brief sequence>
- JS long tasks (>16ms): <count + max ms>
- Render hotspots: <component names>
- Smoothness (1-5): <score>
- Notes: <anything unusual>

Artifacts

- Profiler exports:
  - <path or filename>
  - <path or filename>
  - <path or filename>
```

### Artifact Naming Convention

Use this format so comparisons stay organized:

- `perf-baseline-YYYYMMDD-flow1-start-game-<dev|release>.json`
- `perf-baseline-YYYYMMDD-flow2-map-hint-<dev|release>.json`
- `perf-baseline-YYYYMMDD-flow3-score-reveal-<dev|release>.json`

## Prioritized Work Plan

1. Enable React Compiler
   - Run healthcheck and resolve blockers.
   - Enable compiler in Expo configuration.
   - Re-profile core flows to measure compiler-only gains.

2. Contain rerenders in `app/(tabs)/game.tsx`
   - Extract memoized subcomponents to reduce full-screen rerenders.
   - Stabilize callback props passed to heavy children (map/search/overlays).
   - Memoize derived values used in render paths.

3. Move per-frame UI work off JS thread
   - Migrate `components/ScoreReveal/AnimatedCounter.tsx` from RAF + state updates to Reanimated.
   - Improve `components/RoundTimer/index.tsx` progress/timing behavior for pause/resume robustness.

4. Reduce context-driven repaint blast radius
   - Narrow subscriptions to settings/theme/game state where practical.
   - Avoid rerendering map/game surfaces on unrelated settings updates.

5. Optimize inactive tab lifecycle
   - Apply tab screen lifecycle settings (for example `freezeOnBlur`) where safe.
   - Verify no behavior regressions when switching tabs or returning to gameplay.

6. Add regression guardrails
   - Document the lightweight profiling checklist in contributor workflow.
   - Keep before/after metric snapshots for each significant performance PR.

## Decision Log

### 2026-03-21 - Use dedicated root doc for performance plan

- Decision: store performance plan and rationale in `PERFORMANCE_PLAN.md` at repo root.
- Reasoning: performance work is cross-cutting and active (not deferred roadmap content).
- Alternatives considered:
  - `future_roadmap.md`: rejected, because this effort is active execution work.
  - `CHANGELOG.md`: rejected, because changelog should remain release-history oriented.
- Tradeoff: one extra root document to maintain, offset by clear discoverability and continuity.

## Execution Log

### 2026-03-21 - Document initialized

- Added this file with goals, scope, metrics, phased plan, and decision rationale.
- Next step: capture baseline metrics before implementation begins.

### 2026-03-21 - Baseline capture template established

- Added standardized baseline metadata fields and a per-flow metrics table.
- Added repeatable profiling protocol for dev and release contexts.
- Recorded current code revision for baseline trace alignment: `9d443ac`.

### 2026-03-21 - Baseline worksheet and artifact naming added

- Added a copy/paste worksheet for the first profiling session.
- Added artifact naming convention to make before/after comparisons consistent.

### 2026-03-21 - Partial baseline captured (simulator dev run)

- Recorded initial FPS-based baseline from React Native Performance Monitor in iOS simulator.
- Observed floors: UI 58 (Guess/year entry), JS 59 (hint activation), otherwise mostly 60/60.
- Remaining baseline work: JS long-task counts, render hotspots, and release-build measurements.

### 2026-03-21 - Phase 1 React Compiler enabled

- Ran `npx react-compiler-healthcheck@latest` and received clean readiness output.
- Healthcheck result: compiled 26/26 components, no incompatible libraries found.
- Enabled React Compiler via `expo.experiments.reactCompiler = true` in `app.json`.

### 2026-03-21 - Phase 2 render containment pass (game screen)

- Refactored `app/(tabs)/game.tsx` by extracting memoized `HeaderPanel` and `PhotoPanel` blocks.
- Stabilized high-churn handlers with `useCallback` (map controls, hint modal controls, photo actions, round transitions).
- Memoized derived view data with `useMemo` (`lastResult`, `canRefreshPhoto`, `answerCoordinate`, `hintPreview`).
- Replaced inline closures in hot paths (zoom buttons, hint toggle, modal close handlers).

### 2026-03-21 - Phase 3 animation/threading pass

- Replaced JS `requestAnimationFrame` counting in `components/ScoreReveal/AnimatedCounter.tsx` with Reanimated shared-value timing.
- Moved counter interpolation work to UI-thread worklets and removed per-frame React state updates.
- Updated `components/RoundTimer/index.tsx` so bar progress is driven from remaining-time state via Reanimated timing and cancels animation on pause.

### 2026-03-21 - Phase 4 context subscription narrowing

- Added focused settings contexts in `lib/SettingsContext.tsx` for map provider, round-building settings, and game-runtime settings.
- Kept `useSettings()` for settings screen ergonomics while introducing:
  - `useMapProviderSetting()`
  - `useRoundBuildSettings()`
  - `useGameRuntimeSettings()`
- Updated consumers to reduce blast radius from unrelated settings updates:
  - `components/MapView/index.tsx` now subscribes only to map provider.
  - `lib/gameState.tsx` now subscribes only to round-building inputs.
  - `app/(tabs)/game.tsx` now subscribes only to runtime gameplay settings.

### 2026-03-21 - Phase 5 inactive tab lifecycle optimization

- Enabled `lazy: true` and `freezeOnBlur: true` for tab screens in `app/(tabs)/_layout.tsx`.
- This prevents inactive tabs from doing unnecessary render work while preserving current navigation structure.

### 2026-03-21 - Phase 6 regression guardrails

- Added a performance regression checklist to `CONTRIBUTING.md` with the three core gameplay flows.
- Updated `.github/PULL_REQUEST_TEMPLATE.md` to require `PERFORMANCE_PLAN.md` perf notes when performance-sensitive files change.
- Standardized expectation that perf observations are logged in this plan document for future comparisons.

### 2026-03-21 - Post-optimization simulator snapshot recorded

- Logged user-reported "after" FPS observations for the three core flows.
- Results indicate steady 59-60 FPS behavior during map/hint interactions, with brief UI dips to 58 and JS dip to 56 during start/guess transitions.
- Remaining follow-up: capture release-build metrics and JS long-task counts for stronger before/after comparison.

## Risks And Open Questions

- React Compiler enablement details depend on current Expo configuration state.
- Profiling in dev mode can exaggerate overhead; release profiling is required before conclusions.
- Some optimizations may improve JS load while shifting complexity into component architecture.

## Update Policy

For every performance-focused PR:

- Add a Decision Log entry if a non-obvious tradeoff was made.
- Add an Execution Log entry with files touched and observed metric delta.
- If metrics regress, record why and whether follow-up work is planned.
