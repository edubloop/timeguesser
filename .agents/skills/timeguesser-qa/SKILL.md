---
name: timeguesser-qa
description: Review TimeGuesser experience quality, diagnose bugs and regressions, and propose fixes with verification steps. Use whenever the user reports a TimeGuesser bug, UI inconsistency, performance issue, or asks for QA coverage of gameplay flows.
metadata:
  version: "0.3.0"
  status: "stable"
  owner: "workspace-maintainer"
  last_updated: "2026-03-24"
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/timeguesser-qa.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# TimeGuesser — Experience Quality Review

Systematic approach to finding, diagnosing, and fixing bugs and UX inconsistencies in TimeGuesser.

---

## Known Bugs

### BUG-001 — Photo viewer off-center on second open

**Status:** Fixed
**File:** `app/photo-viewer.tsx`
**Repro:** Double-tap photo → close → double-tap again → image is offset/partially visible. Rotating to landscape snaps it to center.

**Root cause:** The `ScrollView` used for pinch-to-zoom (`minimumZoomScale={1}`, `maximumZoomScale={4}`) retains its `contentOffset` and implicit zoom state between navigations. On re-mount, the stale offset is applied before layout resolves. Rotation fixes it because it triggers a full layout recalculation.

Secondary cause: `photoFrame` uses `flex: 1` inside a `ScrollView`, which gives the frame an ambiguous height on re-mount — the scroll view doesn't know the content size yet and miscalculates the center point.

**Fix approach:**

```tsx
// In photo-viewer.tsx — add a ref and reset on mount
const scrollRef = useRef<ScrollView>(null);

useEffect(() => {
  // Reset scroll position and zoom on every mount
  scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
}, []);

// Also pass explicit screen dimensions to the photo frame
// instead of relying on flex: 1 inside ScrollView
import { useWindowDimensions } from 'react-native';
const { width, height } = useWindowDimensions();

// Replace flex: 1 photoFrame with explicit dims:
<View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
```

---

## UI Flow Testing (Maestro)

Automated UI flows live in `TimeGuesser/.maestro/`. Maestro drives the iOS simulator directly — no instrumentation or test builds needed. Just needs the app running in the simulator.

**Prerequisites:** Java 17+ installed, Maestro CLI on PATH

```bash
export PATH="$PATH:$HOME/.maestro/bin"
maestro --version
```

### Run a single flow

```bash
cd TimeGuesser

# BUG-001 regression — photo viewer reopen centering
maestro test .maestro/photo-viewer.yaml

# Full game round
maestro test .maestro/game-full-round.yaml

# Hint tier penalties
maestro test .maestro/hint-tiers.yaml

# Settings navigation
maestro test .maestro/settings-navigation.yaml
```

### Run design taste audit

```bash
maestro test .maestro/design-taste.yaml

# With AI analysis report
maestro test .maestro/design-taste.yaml --analyze
```

Taste assertions validate the running app's visual output against rules in
`TIMEGUESSER_DESIGN_SYSTEM.md` (anti-patterns, composition rules, type hierarchy).
Run after any UI change to catch visual regressions that behavioral tests miss.

### Run all flows

```bash
maestro test .maestro/
```

### Run with video recording

```bash
maestro test .maestro/photo-viewer.yaml --format junit --output test-results/
```

Screenshots from `takeScreenshot` steps are saved to `~/.maestro/tests/` by default.

### When a flow fails

Maestro prints the failing step and takes a screenshot automatically. Common causes:

- Element not found by `text:` — text may be inside a nested component; try `id:` instead (requires `testID` prop on the element)
- Timing: increase `waitForAnimationToEnd` timeout
- App state: flow assumes fresh launch — use `launchApp: clearState: true` if stale state is suspected

### Adding testIDs for reliable targeting

Maestro can target by `testID` prop, which is more reliable than text matching. Key elements already have testIDs:

```tsx
// game.tsx — photo Pressable (double-tap target)
<Pressable testID="game-photo" ...>

// ScoreReveal/index.tsx — outer container
<View testID="score-reveal" ...>
```

### AI-powered assertions (`assertWithAI`)

Use natural language assertions instead of coordinate checks for visual state:

```yaml
# In any flow — assert visual state without pixel math
- assertWithAI: "The photo is centered on screen and fully visible"
- assertWithAI: "The score reveal card shows a round score greater than zero"
- assertWithAI: "No content is clipped or partially hidden"
```

**Requires:** `maestro login` (free Maestro Cloud account). Run once: `maestro login`

### Post-failure AI analysis (`--analyze`)

After a flow fails, run with `--analyze` to get an AI-generated HTML report analyzing screenshots + logs:

```bash
maestro test .maestro/photo-viewer.yaml --analyze
# Opens: file:///~/.maestro/tests/<run-id>/insights-report.html
```

Report identifies UI regressions, layout breaks, and spelling errors from screenshots. Requires Maestro Cloud login.

### Maestro MCP (Claude ↔ Maestro)

Maestro has an MCP server that lets Claude read flows, suggest improvements, and generate new tests based on app behavior. To connect it, add to your Claude MCP config:

```json
{ "command": "maestro mcp" }
```

This would allow Claude Code to propose flow edits inline rather than requiring manual YAML editing.

### Add a new flow

Create `.maestro/<flow-name>.yaml` with `appId: com.timeguesser.app` at the top. Add it to the Known Bugs section if it's a regression test.

---

## Review Checklist

Run through this when doing a quality pass. Test in iOS simulator (`npx expo start --ios`) and on a real device.

### Navigation & Routing

- [ ] All tab transitions are smooth (no flash, no stale screen)
- [ ] Modal dismiss (photo viewer, year picker) leaves parent screen intact
- [ ] Back navigation from results returns to correct state
- [ ] Deep link / fresh launch lands on correct screen

### Game Flow

- [ ] Start game → correct photo loads with no placeholder flash
- [ ] Timer counts down smoothly (no skip/jump)
- [ ] Pin placement registers correctly at tap position
- [ ] Year picker submits correct value
- [ ] Hint reveal animates correctly at each tier (1–5)
- [ ] Tier 4 hint: location score forced to 0 in ScoreReveal ✓
- [ ] Tier 5 hint: entire round score forced to 0 ✓
- [ ] Score reveal shows correct breakdown
- [ ] Round 5 → results screen transition works
- [ ] "Play again" resets all state cleanly (no stale round data)

### Photo Viewer

- [ ] First open: photo centered and fills screen
- [ ] Second open (close and reopen): photo still centered ← BUG-001
- [ ] Pinch-to-zoom works (1x–4x)
- [ ] Swipe-down dismisses correctly
- [ ] Long-press share sheet opens
- [ ] Rotation to landscape: photo fills correctly
- [ ] Rotation back to portrait: photo still correct
- [ ] Orientation lock restores to portrait on close

### Score & Accuracy

- [ ] Location score formula: `5000 * max(0, 1 - (distanceKm / 12000))^2`
- [ ] Time score formula: `5000 * max(0, 1 - (|yearDiff| / 120))^2`
- [ ] Hint penalties applied correctly (−1000 per tier 2–5)
- [ ] Total score = sum of 5 rounds
- [ ] AnimatedCounter reaches exactly the correct final value (no floating point display error)

### Theme & Appearance

- [ ] Light mode: all text readable, no invisible elements
- [ ] Dark mode: same
- [ ] System theme switch mid-session: no stale colors
- [ ] Score tier colors apply correctly (Excellent/Good/Fair/Poor thresholds)

### Performance

- [ ] No visible frame drops during score reveal animations
- [ ] Photo loads without blocking the UI
- [ ] Map renders without delay on game start
- [ ] Settings screen scrolls smoothly (long list)

### Edge Cases

- [ ] No internet: graceful fallback to test photos (lib/photos.ts fallback)
- [ ] Timer reaches 0: auto-submit guess at current pin position
- [ ] No pin placed when timer expires: handled without crash
- [ ] Year input: boundary values (1800, current year) accepted; out-of-range rejected
- [ ] Very old photo (pre-1900): scoring handles large year diff without negative score

---

## Performance Investigation

### Enable React Native performance monitor

In the iOS simulator: `Cmd+D` → "Perf Monitor"

- **JS FPS**: should stay at 60 (or 120 on ProMotion) during animations
- **UI FPS**: should never drop during native animations (map pan, scroll)

### Check for expensive re-renders

```bash
cd TimeGuesser
npx expo start --ios
```

In the app: enable React DevTools via `Cmd+D` → "Open React DevTools"

- Look for components rendering more than expected during animations
- GameProvider re-rendering on every frame is a common issue with animated values

### Bundle size check

```bash
cd TimeGuesser
npx expo export --platform ios
# Check output in dist/ for unexpectedly large assets
```

### Image loading performance

`lib/photos.ts` fetches from Wikimedia Commons with AsyncStorage caching. If photos are slow:

- Check `cachedPhotos` in AsyncStorage — may be stale or oversized
- The `CACHE_EXPIRY_MS` constant controls cache lifetime
- Settings screen has a "Clear cache" action that wipes it

---

## Diagnosing a Specific Bug

When investigating a reported bug:

```bash
# 1. Check the relevant screen/component file
# Main game: app/(tabs)/game.tsx (28KB)
# Photo viewer: app/photo-viewer.tsx
# Results: app/(tabs)/results.tsx
# Settings: app/(tabs)/settings.tsx

# 2. Check game state logic
# lib/gameReducer.ts — all state transitions
# lib/gameState.tsx — GameProvider, action dispatch
# lib/scoring.ts — score calculation

# 3. Run type check to catch obvious issues
cd TimeGuesser && npx tsc --noEmit

# 4. Run lint
npm run lint
```

### Common failure patterns

| Symptom | Likely location | Check |
|---------|----------------|-------|
| Stale data after "play again" | `gameReducer.ts` RESET action | All fields reset to initial state? |
| Score doesn't match expectation | `lib/scoring.ts` | Formula constants unchanged? Hint override applied? |
| Animation jank | Component with `useSharedValue` | Is animation running on JS thread? Add `useNativeDriver` |
| Photo doesn't load | `lib/photos.ts` | AsyncStorage cache returning stale/invalid URI? |
| Map not showing | `components/MapView/` | Provider selection (Apple vs Google), API key config |
| Theme color wrong | Any component | Using `useThemeColor` hook? Or hardcoded hex? |
| ScrollView offset issue | Any `ScrollView` with zoom | Add `ref` + `scrollTo({x:0,y:0})` on mount |

---

## Reporting a New Bug

Add to the **Known Bugs** section above with:

- **BUG-XXX** — short title
- **Status:** Open / In Progress / Fixed
- **File:** relevant file path
- **Repro:** exact steps
- **Root cause:** what's actually wrong (read the code before guessing)
- **Fix approach:** concrete code direction
