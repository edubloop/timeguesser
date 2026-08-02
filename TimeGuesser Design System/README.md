# TimeGuesser — Design System

**TimeGuesser** is a personal mobile game app (iOS, React Native / Expo) where players view a historical photo and guess both _where_ and _when_ it was taken. Scoring is based on geographic proximity and year accuracy. 5 rounds per game, max 50,000 points.

**Source:** GitHub repo `edubloop/timeguesser` (main branch)
**Spec:** `TIMEGUESSER_SPEC.md` in repo root
**Design System Spec Narrative:** `TIMEGUESSER_DESIGN_SYSTEM.md` in repo root
**Canonical Contract:** `TimeGuesser Design System/CANONICAL.md`
**Design Explorations:** `design-explorations/` folder (PNG mockups)
**Design References:** `design-references/` folder (NYT Games, Airbnb, Revolut, YouTube)

---

## Products / Surfaces

| Surface                       | Notes                                                |
| ----------------------------- | ---------------------------------------------------- |
| **iOS App**                   | iPhone + iPad, portrait-locked (except photo viewer) |
| No web app, no marketing site | App-only, distributed via TestFlight                 |

---

## CONTENT FUNDAMENTALS

### Voice & Tone

- **Quiet confidence.** The app does not explain itself. No onboarding tooltips, no tutorial overlays. Controls are discoverable through interaction.
- **Concise, non-patronizing.** Short labels: "GUESS", "Start Game", "Round 1/5", "347 km away", "7 years off". Never verbose.
- **Numbers are the hero copy.** Score numbers, distances, year comparisons — these are the emotional moments. Typography gives them full dramatic weight.
- **Whisper-level affordances.** Gesture hints read "Swipe up to guess" at 60% opacity. Never shouted. Fade after first use.
- **No emoji in UI.** SF Symbols (or Lucide as fallback) only. Emoji reserved for nothing — not in UI chrome.
- **CAPS used very sparingly.** Only for short status labels: "ROUND 3 OF 5", "GUESS". Never for body copy or descriptions.
- **First person absent.** The app speaks matter-of-factly: "7 years off", not "You were 7 years off!". Results are stated, not narrated.
- **Subtitle:** "Guess where and when" — lowercase, minimal, evocative.

### Example Copy Patterns

- Button: "Start Game" / "GUESS" / "Next Round"
- Stat: "347 km away" / "7 years off" / "4,200 pts"
- Round indicator: "Round 1/5" (pill, 25% black overlay)
- Swipe hint: "Swipe up to guess" / "↓ photo"
- Score tiers: Implied by color; no text label like "Excellent!"

---

## VISUAL FOUNDATIONS

### Colors

Muted, refined palette. Teal accent evokes cartography and exploration. Light mode is the primary; dark mode is a distinct treatment (not inverted).

- **Primary accent:** `#1A8A7D` (teal) — buttons, active states, interactive elements
- **Backgrounds:** Near-white `#FFFFFF` / `#F5F5F7` / `#EBEBED` layered system (light); True dark grays `#121214` / `#1C1C1E` / `#2C2C2E` (dark — not pure black)
- **Text:** Near-black `#1A1A1C` primary; `#6B6B70` secondary; `#98989D` tertiary
- **Score feedback:** Teal (excellent) → Green → Amber → Rust (poor)
- **No gradients on UI chrome.** Flat fills only.

### Typography

System font throughout: **-apple-system / SF Pro** (San Francisco). Feels native iOS, not branded. The hierarchy does the heavy lifting.

- **Display (34px/700):** Big score moments, game over
- **Title1 (28px/700):** Screen titles
- **Headline (17px/600):** Button labels, emphasis
- **Body (17px/400):** Primary reading
- **Caption (12px/500):** Labels, badges — +0.5px letter-spacing
- Prefer **Semibold** over Bold for editorial tone; reserve Bold for true display moments
- Score numbers: tabular numerals (font-variant-numeric: tabular-nums)
- CAPS only for very short status labels

### Spacing

4px base unit. All spacing is a multiple of 4.
`xs=4 / sm=8 / md=12 / lg=16 / xl=24 / 2xl=32 / 3xl=48`

### Corner Radii

`sm=4 / md=6 / lg=8 / sheet=12 / pill=999`

### Shadows

Very subtle. Light mode only (dark mode uses background tinting for elevation instead).

- `sm`: `0 1px 3px rgba(0,0,0,0.08)` — inline cards
- `md`: `0 4px 12px rgba(0,0,0,0.10)` — floating buttons
- `lg`: `0 8px 24px rgba(0,0,0,0.14)` — sheets, modals
- `xl`: `0 16px 48px rgba(0,0,0,0.18)` — score reveal card

### Layout Patterns

- **Photo-first, map-second.** Game screen is a vertical pager: photo fills viewport (above), map fills viewport (below). Swipe gesture, not tabs.
- **Full-bleed media.** Content overlays the photo/map; separate chrome panels are avoided.
- **Overlapping content sheet.** Home screen: photo collage top ~55%, white rounded-top sheet overlaps the photo.
- **Ephemeral controls.** FABs float over media, fade when inactive. No persistent toolbars on media screens.
- **Floating pills for status.** Round / timer shown as translucent dark pills (25% black), always top corners of viewport.

### Animations

Snappy and immediate. No sluggish transitions.

- **instant:** 80ms easeOut — press feedback
- **fast:** 120ms easeOut — micro-interactions
- **standard:** 150ms easeInOut — most transitions
- **entrance:** 200ms easeOut — elements appearing
- Pin drop: 200ms easeOut with 1.05 overshoot
- Distance line draw: 400ms (the one dramatic slow moment)
- Score counter: 600ms tick-up, ease-out curve
- Native iOS push/pop for screen transitions — not overridden

### Hover / Press States

- Buttons: `accent.primaryHover` (`#15756A`) + scale 0.97 on press
- FABs: `accent.subtle` background + icon becomes `accent.primary`
- No opacity-dim hover states — color shifts only

### Dark Mode

Not simply inverted. True dark grays (not pure black). Accent shifts brighter (`#2BBFAD`). Shadows reduced ~40% opacity. Elevation communicated via background tints, not shadows.

### Imagery

- Photographs are the entire product — historical street scenes, architecture, people
- No app-generated illustrations; no hand-drawn elements
- Photo viewer: full-screen, landscape-supported, swipe-down dismiss
- Map tiles: switch to dark variant in dark mode

### Cards

- Background: `#F5F5F7` (light) — flat fill, no gradient
- Radius: `lg` (8px)
- Shadow: `sm` inline, `xl` for score reveal only
- No borders inside cards; whitespace handles separation
- No divider lines between stat columns

---

## ICONOGRAPHY

SF Symbols (iOS native) are the primary icon system. Lucide icons are the web/fallback equivalent.

| Purpose  | SF Symbol             | Lucide        | Size        |
| -------- | --------------------- | ------------- | ----------- |
| Search   | `magnifyingglass`     | `Search`      | 20px in FAB |
| Hint     | `lightbulb`           | `Lightbulb`   | 20px in FAB |
| Close    | `xmark`               | `X`           | 22px nav    |
| Share    | `square.and.arrow.up` | `Share`       | 22px nav    |
| Settings | `gearshape`           | `Settings`    | 24px tab    |
| Timer    | `clock`               | `Clock`       | 24px tab    |
| Pin      | `mappin`              | `MapPin`      | varies      |
| Back     | `chevron.left`        | `ChevronLeft` | 22px nav    |

**Icon style:** Monochrome, minimal weight. Never colored icons competing with content.
**No emoji in UI.** SpaceMono is available as a monospace accent font (score numbers).
**CDN fallback:** Lucide (`https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`)

### App Icon Concepts

Several concepts explored in `assets/`:

- `icon.png` — Current: purple globe + cursor (placeholder aesthetic, does not match teal brand)
- `icon-globe-clock.png` — Globe + clock combination concept
- `icon-map-focus.png` — Map pin focus concept
- `icon-t-abstract.png` / `icon-t-abstract-v2a.png` — Abstract "T" lettermark concepts
  > **Note:** The current app icon color (purple) does not match the teal design system. Icon direction to be finalized.

---

## FILES IN THIS DESIGN SYSTEM

| File                          | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `README.md`                   | This file — product context, design foundations                   |
| `colors_and_type.css`         | Generated CSS custom properties from TS tokens (do not hand-edit) |
| `CANONICAL.md`                | Source/derived ownership and sync workflow contract               |
| `SKILL.md`                    | Agent skill definition                                            |
| `assets/`                     | App icons, icon concepts                                          |
| `fonts/SpaceMono-Regular.ttf` | Monospace accent font                                             |
| `design-explorations/`        | PNG mockups of game screen and home screen directions             |
| `preview/`                    | Design system card HTML files                                     |
| `ui_kits/mobile_app/`         | High-fidelity mobile app UI kit                                   |
| `uploads/`                    | Screenshot references (non-canonical, not CI-gated)               |

### UI Kits

- **`ui_kits/mobile_app/index.html`** — Interactive mobile app prototype (Home → Game → Results → Settings)

### Settings order (canonical):

1. Theme
2. Map Provider
3. Photo Sources
4. Image Cache
5. Hints
6. Round Timer

---

## Anti-Patterns (Summary)

Never: borders/dividers inside cards · shadows between stacked cards · gradients on card backgrounds · medium-weight stats · persistent toolbars on media screens · ALL CAPS body copy · emoji in UI · opaque navigation hint bars.

See `TIMEGUESSER_DESIGN_SYSTEM.md` in the source repo for the full anti-pattern list with rationale.
