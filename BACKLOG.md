# Backlog

This file is the queue, not the execution brief.

When a backlog item is selected, promote it into `../artifacts/tickets/{ID}/intake.md` and run the Fabro Intake workflow first. Intake classifies `execution_path` and normalizes `ticket.md` when the next phase can proceed.

## Item Format

Each active item should stay lightweight:

- `Status`: `Queued`, `In Design`, `Ready for Delivery`, or `Done`
- `Lane`: `Experience / UX`, `Design system / taste QA`, `Content pipeline quality`, or `Internal tooling`
- `Execution path`: use the locked vocabulary once Intake has classified the work:
  - `design_then_delivery`
  - `delivery_only`
  - `quick_capture`

## Active Queue

### TG-006 — Reduce tab bar footprint during gameplay

- Status: `Queued`
- Lane: `Experience / UX`
- Execution path: `design_then_delivery`
- Summary: The bottom tab bar takes too much vertical space. Explore smaller treatment, auto-hide behavior, or hiding it entirely during active rounds.

### TG-012 — Upgrade Expo SDK 54 → 57

- Status: `Queued`
- Lane: `Internal tooling`
- Execution path: `delivery_only`
- Summary: Move from Expo SDK 54 to 57 (React Native 0.81.5 → 0.86.2, React 19.1.0 → 19.2.3). Clears 3 of 4 remaining high-severity advisories. Investigated 2026-08-02 — findings below; no code changes were made.

**Why it is smaller than it looks.** SDK 57 renumbered every `expo-*` package to match the SDK version, so `expo-constants` 18 → 57 and `expo-router` 6 → 57 are mostly renumbering, not 40+ majors of breaking change.

**Verified safe (static analysis):**

- Strict `npm install` at the SDK 57 versions from Expo's `bundledNativeModules.json` resolves with **zero peer conflicts** — no `--force`, no `--legacy-peer-deps`.
- `expo-file-system@57` still exports `./legacy`, so the `expo-file-system/legacy` import in `lib/photos.ts` and its seven `FileSystem.*` calls keep working.
- `react-native-gesture-handler` is not imported anywhere in `app/`, `lib/`, or `components/`. SDK 57 wants `~2.32.0`, not the 3.x major.
- Most `Animated.*` usage is React Native's own Animated API, not Reanimated. Only 4 files use Reanimated; that bump is minor (4.1 → 4.5).
- `expo-router` surface in use is small and stable: `router.push/replace/back`, `Tabs`, `Stack`, `useLocalSearchParams`, one `<Link>`.
- No custom native code — `ios/` is standard prebuild output, `newArchEnabled` is already `true`, and all three config plugins are first-party.

**Actual risk is the native rebuild and runtime, not the code:**

- RN 0.81 → 0.86 needs `ios/` regenerated and pods reinstalled.
- `experiments.reactCompiler: true` in `app.json` is experimental and is the most likely source of a surprising runtime regression across three SDKs.
- Top-level `"splash"` in `app.json` is deprecated in newer SDKs — moves into the `expo-splash-screen` plugin config.
- Verify: `npm run check`, a full Maestro pass, and manual QA of maps, image picker, and the updates channel.

**Does not fully fix the audit gate.** SDK 57 leaves `postcss` (high) in Expo's build tooling, so CI cannot return to `--audit-level=high` on this upgrade alone. Do not treat that as the completion criterion.

### Recently Completed

- **TG-007** — Settings page visual redesign. Grouped cards, icon chips, segmented controls, self-drawn header; multi-select public image sources. Delivered without a design phase — no ticket artifacts exist under `../artifacts/tickets/TG-007/`. (2026-04-30)
- **TG-011** — Result surface: decoupled CTA from card, scrim/blur chrome, vertical action rail. (2026-04-21)
- **TG-010** — Full-bleed photo treatment (YouTube Shorts-inspired). (2026-04-18)
- **TG-008** — Cache fill progress indicator + haptics. Truthful progress reporting, inline status treatment, haptic feedback on fill completion. (2026-04-02)
- **TG-005** — Screen real estate rethink. Photo-first → map-first two-state gameplay flow. (2026-04-06)
- Done: Reverse geocoding fallback for `"Unknown location"` images
- Done: Removed score thousands separator
- Done: Reset map between rounds
- Done: Auto-fit result distance line on screen
