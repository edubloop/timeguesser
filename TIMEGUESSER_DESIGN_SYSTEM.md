# TimeGuesser — Design System

## Design Philosophy

Editorial premium meets native iOS. The aesthetic is refined and confident — muted tones, generous whitespace, precise typography, and subtle depth through shadows. The interface recedes to let the photography take center stage. Every interaction feels snappy and intentional. The map and photo are the stars; the UI is the quiet, elegant frame around them.

**Keywords**: refined, muted, editorial, premium, map-forward, photography-first

---

## Color System

All colors are defined as design tokens. The app supports light and dark themes (plus system default). Colors should be implemented as React Native style constants or a theme context.

### Core Palette

| Token                  | Light             | Dark              | Usage                             |
| ---------------------- | ----------------- | ----------------- | --------------------------------- |
| `background.primary`   | `#FFFFFF`         | `#121214`         | Main screen background            |
| `background.secondary` | `#F5F5F7`         | `#1C1C1E`         | Cards, sheets, grouped content    |
| `background.tertiary`  | `#EBEBED`         | `#2C2C2E`         | Hover states, subtle fills        |
| `background.overlay`   | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Full-screen photo viewer backdrop |

### Text

| Token            | Light     | Dark      | Usage                             |
| ---------------- | --------- | --------- | --------------------------------- |
| `text.primary`   | `#1A1A1C` | `#F5F5F7` | Headings, primary content         |
| `text.secondary` | `#6B6B70` | `#98989D` | Supporting text, labels           |
| `text.tertiary`  | `#98989D` | `#6B6B70` | Timestamps, metadata, subtle info |
| `text.inverse`   | `#FFFFFF` | `#1A1A1C` | Text on accent backgrounds        |

### Accent — Teal/Blue

The primary accent evokes maps, water, exploration. Used sparingly for interactive elements and key moments.

| Token                 | Value                                | Usage                                 |
| --------------------- | ------------------------------------ | ------------------------------------- |
| `accent.primary`      | `#1A8A7D`                            | Primary buttons, active states, links |
| `accent.primaryHover` | `#15756A`                            | Button press state                    |
| `accent.subtle`       | `#E8F5F3` (light) / `#1A2F2D` (dark) | Accent backgrounds, hint cards        |
| `accent.muted`        | `#B0D9D4` (light) / `#2A4A46` (dark) | Secondary accent fills                |

### Scoring & Feedback

| Token             | Value     | Usage                    |
| ----------------- | --------- | ------------------------ |
| `score.excellent` | `#1A8A7D` | High score (>80% of max) |
| `score.good`      | `#5B9E4D` | Good score (50-80%)      |
| `score.fair`      | `#C4953A` | Fair score (20-50%)      |
| `score.poor`      | `#B85A3A` | Low score (<20%)         |

### Map UI

| Token              | Light     | Dark      | Usage                         |
| ------------------ | --------- | --------- | ----------------------------- |
| `map.pinPlayer`    | `#1A8A7D` | `#2BBFAD` | Player's guess pin            |
| `map.pinAnswer`    | `#C4953A` | `#E8B04A` | Actual location pin           |
| `map.distanceLine` | `#B85A3A` | `#D97B5A` | Line between guess and answer |
| `map.searchBar`    | `#FFFFFF` | `#2C2C2E` | Search overlay background     |

### Shadows

| Token       | Value                          | Usage                                 |
| ----------- | ------------------------------ | ------------------------------------- |
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.08)`   | Inline cards, subtle lift             |
| `shadow.md` | `0 4px 12px rgba(0,0,0,0.10)`  | Floating buttons (🔍, 💡), search bar |
| `shadow.lg` | `0 8px 24px rgba(0,0,0,0.14)`  | Bottom sheets, modals                 |
| `shadow.xl` | `0 16px 48px rgba(0,0,0,0.18)` | Score reveal card                     |

---

## Typography

San Francisco (system font) throughout. The native iOS font ensures the app feels at home on the platform while the size and weight scale creates an editorial hierarchy.

### Type Scale

| Token      | Size | Weight         | Line Height | Usage                            |
| ---------- | ---- | -------------- | ----------- | -------------------------------- |
| `display`  | 34px | Bold (700)     | 40px        | Game over score, big moments     |
| `title1`   | 28px | Bold (700)     | 34px        | Screen titles                    |
| `title2`   | 22px | Semibold (600) | 28px        | Section headers, round number    |
| `title3`   | 20px | Semibold (600) | 25px        | Card titles                      |
| `headline` | 17px | Semibold (600) | 22px        | Button labels, emphasis          |
| `body`     | 17px | Regular (400)  | 22px        | Primary body text                |
| `callout`  | 16px | Regular (400)  | 21px        | Hint text, descriptions          |
| `subhead`  | 15px | Regular (400)  | 20px        | Secondary information            |
| `footnote` | 13px | Regular (400)  | 18px        | Metadata, timestamps, fine print |
| `caption1` | 12px | Medium (500)   | 16px        | Labels, badges, score breakdowns |
| `caption2` | 11px | Regular (400)  | 13px        | Legal, attribution               |

### Typographic Rules

- Use **Semibold** for emphasis, not Bold — keeps the editorial tone
- Score numbers use `display` size with **tabular (monospaced) numerals** so digits don't shift during animation
- Hint confidence percentages (e.g., "70% sure") use `callout` with `text.secondary` color
- Never use ALL CAPS except for very short labels (e.g., "ROUND 3 OF 5")
- Letter spacing: default for body, +0.5px tracking for `caption1` and `caption2`

---

## Spacing

An 4px base unit. All spacing should be a multiple of 4.

| Token       | Value | Usage                               |
| ----------- | ----- | ----------------------------------- |
| `space.xs`  | 4px   | Tight gaps, icon padding            |
| `space.sm`  | 8px   | Between related elements            |
| `space.md`  | 12px  | Inner padding of compact components |
| `space.lg`  | 16px  | Standard padding, card insets       |
| `space.xl`  | 24px  | Section spacing, generous padding   |
| `space.2xl` | 32px  | Major section breaks                |
| `space.3xl` | 48px  | Screen-level padding top/bottom     |

### Layout Constants

| Token                       | Value | Notes                                               |
| --------------------------- | ----- | --------------------------------------------------- |
| `layout.photoMaxHeight`     | 40%   | Maximum photo area height (percentage of safe area) |
| `layout.borderRadius.sm`    | 4px   | Small elements (badges, chips)                      |
| `layout.borderRadius.md`    | 6px   | Buttons, input fields                               |
| `layout.borderRadius.lg`    | 8px   | Cards, hint cards, search bar                       |
| `layout.borderRadius.sheet` | 12px  | Bottom sheets (top corners only)                    |
| `layout.safeAreaPadding`    | 16px  | Horizontal padding from screen edges                |

---

## Component Specifications

### Guess Button

The primary call-to-action. Prominent but refined.

- **Default (disabled)**: `background.tertiary`, `text.tertiary`, no shadow
- **Active (pin placed)**: `accent.primary` background, `text.inverse`, `shadow.md`
- **Pressed**: `accent.primaryHover` background, slight scale down (0.97)
- Height: 50px
- Border radius: `borderRadius.md` (6px)
- Full width minus `safeAreaPadding` on each side
- Typography: `headline`
- Bottom margin respects safe area (home indicator)

### Floating Action Buttons (🔍 Search, 💡 Hint)

Small, elevated buttons floating over the map.

- Size: 40×40px
- Border radius: `borderRadius.md` (6px)
- Background: `background.primary` with `shadow.md`
- Icon: 20px, `text.secondary` color
- Active/pressed: `accent.subtle` background, icon becomes `accent.primary`
- Position: 🔍 top-left of map area, 💡 top-right of map area
- Offset: `space.md` (12px) from edges

### Hint Card

Appears when a hint is revealed. Slides in from the hint button.

- Background: `accent.subtle`
- Border radius: `borderRadius.lg` (8px)
- Padding: `space.lg` (16px)
- Shadow: `shadow.md`
- Max width: 85% of screen width
- Hint text: `callout`, `text.primary`
- Confidence badge: `caption1`, `accent.primary` text, pill-shaped (`borderRadius.sm`)
- Tier indicator: small dots showing hint progression (filled = used, empty = available)
- Dismiss: tap outside or swipe away

### Search Bar (Expanded)

Overlays the top of the map when 🔍 is tapped.

- Background: `map.searchBar` with `shadow.lg`
- Border radius: `borderRadius.lg` (8px)
- Height: 44px
- Padding: `space.md` horizontal
- Text input: `body`, `text.primary`
- Placeholder: `body`, `text.tertiary`
- Clear button: ✕ icon, `text.tertiary`
- Animates in from the 🔍 icon position (expand from top-left)

### Score Reveal Card

Shows after each round during the reveal sequence.

- Background: `background.primary` with `shadow.xl`
- Border radius: `borderRadius.lg` (8px)
- Padding: `space.xl` (24px)
- Score number: `display`, color based on score tier (`score.excellent` / `good` / `fair` / `poor`)
- Distance text: `subhead`, `text.secondary` (e.g., "347 km away")
- Year comparison: `subhead`, `text.secondary` (e.g., "7 years off")
- Breakdown: two rows — location points + time points — using `caption1`

### Map Pins

- **Player pin**: `map.pinPlayer` color, drop shadow, custom marker shape (not default Google/Apple pin)
- **Answer pin**: `map.pinAnswer` color, appears with drop animation on reveal
- Pin size: 32px tall, anchor at bottom point
- Both pins should be simple, geometric — a filled circle with a pointed bottom, not cartoonish

### Bottom Sheet (Date Input)

If used for the year picker after tapping Guess.

- Background: `background.primary`
- Top corners: `borderRadius.sheet` (12px)
- Handle bar: 36×4px, `background.tertiary`, centered, `space.sm` from top
- Shadow: `shadow.lg`
- Overlay behind: `background.overlay`
- Slides up with spring animation

---

## Animation Specifications

All animations are snappy and responsive. No sluggish transitions. The app should feel like every tap has an immediate response.

### Timing

| Token           | Duration | Easing      | Usage                                   |
| --------------- | -------- | ----------- | --------------------------------------- |
| `anim.instant`  | 80ms     | `easeOut`   | Button press feedback, color changes    |
| `anim.fast`     | 120ms    | `easeOut`   | Icon transitions, micro-interactions    |
| `anim.standard` | 150ms    | `easeInOut` | Most transitions, card appearances      |
| `anim.entrance` | 200ms    | `easeOut`   | Elements entering the screen            |
| `anim.exit`     | 120ms    | `easeIn`    | Elements leaving (faster than entering) |

### Specific Animations

**Pin drop**

- Duration: 200ms
- Easing: `easeOut` with slight overshoot (1.05 scale → 1.0)
- Small shadow expands on landing

**Distance line draw**

- Duration: 400ms (this one is longer for dramatic effect)
- Easing: `easeInOut`
- Line draws from player pin to answer pin progressively
- Distance label fades in at midpoint of line

**Score counter tick-up**

- Duration: 600ms total
- Numbers count up from 0 to final score
- Use `requestAnimationFrame` with ease-out curve (fast at start, slows at end)

**Hint card reveal**

- Duration: `anim.entrance` (200ms)
- Slides in from right + fades in simultaneously
- Confidence percentage types in character by character (typewriter, 40ms/char)

**Search bar expand**

- Duration: `anim.standard` (150ms)
- Scales from 40×40 (button size) to full width
- Input auto-focuses after animation completes

**Screen transitions**

- Use default iOS push/pop transitions via Expo Router
- Don't override native navigation animations

**Full-screen photo viewer**

- Open: photo zooms from its inline position to full-screen (250ms, `easeOut`)
- Close: reverse zoom or swipe-down with velocity-based dismiss

---

## Iconography

Use SF Symbols (iOS system icons) for native consistency. Fallback to Lucide icons if needed in React Native.

| Icon       | SF Symbol             | Lucide Fallback | Usage                             |
| ---------- | --------------------- | --------------- | --------------------------------- |
| Search     | `magnifyingglass`     | `Search`        | Map search button                 |
| Hint       | `lightbulb`           | `Lightbulb`     | Hint button                       |
| Close      | `xmark`               | `X`             | Dismiss full-screen, close search |
| Share      | `square.and.arrow.up` | `Share`         | Share sheet in photo viewer       |
| Settings   | `gearshape`           | `Settings`      | Settings tab                      |
| Timer      | `clock`               | `Clock`         | Round timer display               |
| Pin        | `mappin`              | `MapPin`        | Location markers                  |
| Check      | `checkmark`           | `Check`         | Confirm/submit                    |
| Arrow back | `chevron.left`        | `ChevronLeft`   | Navigation back                   |

### Icon Sizing

- Floating buttons: 20px
- Tab bar: 24px
- Navigation bar: 22px
- Inline with text: match text size

---

## Dark Mode Specifics

Dark mode is not just inverted colors. It's a distinct treatment:

- Backgrounds use true dark grays (`#121214`, `#1C1C1E`), not pure black — avoids the OLED "black void" look
- Accent colors shift slightly brighter in dark mode for adequate contrast
- Shadows are more subtle in dark mode (reduce opacity by ~40%)
- Map style should switch to dark map tiles when available (both Google and Apple support this)
- Photo viewer backdrop remains `rgba(0,0,0,0.7)` in both themes
- Elevation is communicated more through lighter background tints than through shadows in dark mode

---

## Responsive Behavior

### iPhone (375–430px width)

- Photo area: 40% of safe area height
- Single-column layout throughout
- Floating buttons: 40×40px
- Guess button: full width with 16px horizontal padding

### iPad (744–1032px width)

- Same vertical stack layout (portrait locked)
- Photo area: 40% of safe area height (more generous at larger sizes)
- Content max-width: 600px, centered (prevents overly wide layouts on iPad Pro)
- Floating buttons: 44×44px (slightly larger touch targets)
- Guess button: max-width 400px, centered
- Hint cards: max-width 400px
- Score reveal cards: max-width 500px

### Safe Areas

- Always respect iOS safe area insets (notch, Dynamic Island, home indicator)
- Photo area starts below safe area top
- Guess button bottom padding includes safe area bottom inset
- Floating buttons offset from safe area edges, not screen edges

---

## Accessibility

- Minimum touch target size: 44×44px (Apple HIG standard)
- Color contrast: all text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Score colors are supplemented with labels (not color-only)
- VoiceOver labels for all interactive elements
- Reduce Motion: replace animations with instant state changes when system setting is enabled
- Dynamic Type: support at least the default and two larger accessibility sizes

---

## Anti-Patterns

Never do these. Each rule exists because agents default to these patterns and they break the editorial premium aesthetic.

- **Never use borders or dividers inside cards to separate stat columns** — whitespace and alignment handle separation. Visible grid lines add noise and feel spreadsheet-like. _(ref: NYT Games profile)_
- **Never add shadows between stacked cards** — if cards stack or overlap, rely on background color contrast for separation. Shadows create artificial depth that fights the flat editorial aesthetic. _(ref: NYT Games profile)_
- **Never make icons compete with content** — decorative/identity icons should be small, monochrome, and positioned secondary (e.g., top-right of a card). They are wayfinding cues, not features. _(ref: NYT Games profile)_
- **Never use gradients on card backgrounds** — a single flat fill color is cleaner and acts as identity. Gradients feel decorative and generic. _(ref: NYT Games profile)_
- **Never use medium-weight typography for stats** — stat numbers should be display-scale bold; labels should be caption-scale light. Skip the middle of the hierarchy to create instant scannability. _(ref: NYT Games profile)_
- **Never put content in a separate chrome area when it can overlay the media** — if the primary content is a photo or map, UI elements should float over it, not sit in a distinct panel below/beside it. Separate chrome wastes space and breaks immersion. _(ref: YouTube fullscreen)_
- **Never show all controls at once on media-dominant screens** — controls should be ephemeral, appearing on interaction and fading when not needed. Persistent toolbars fight the content-first principle. _(ref: YouTube fullscreen)_
- **Never use section headers where spacing alone communicates grouping** — if a settings list has logical clusters (account, security, preferences), separate them with vertical space. Adding "ACCOUNT", "SECURITY" headers is redundant noise when the grouping is obvious from the items. _(ref: Revolut settings)_
- **Never add chevrons, descriptions, or secondary text to settings rows that don't need them** — a row with just an icon and a label is cleaner. Only add detail when the destination is ambiguous. _(ref: Revolut settings)_
- **Never clip content to a hard edge when a sheet overlap is possible** — when transitioning from a full-bleed image to text content, let the content sheet overlap the image with a rounded top. The overlap creates depth and continuity instead of an abrupt cut. _(ref: Airbnb listing)_
- **Never use opaque bars for navigation hints** — prompts like "swipe up" or "swipe down" should be whisper-quiet: very low opacity text over a barely-there gradient, not a solid colored bar. If the user needs a bar to find the gesture, the gesture isn't discoverable enough. _(correction from redesign review)_
- **Never show controls that belong to a different interaction mode** — the Hint FAB is a map interaction, so it only appears on the map phase. Showing it over the photo is misleading and adds noise to the study experience. Match controls to context. _(correction from redesign review)_
- **Never change the overlay language between views of the same screen** — if Phase 1 uses translucent pills and subtle prompts, Phase 2 must use the same pill style, same positions, same opacity treatment. Inconsistency between views that the user flicks between feels broken. _(correction from redesign review)_

---

## Composition Rules

When choosing between UI patterns, use these decision rules.

- **Use color fills (not borders/shadows) to differentiate sibling cards** — when showing a list of same-type items (games, rounds, categories), give each a distinct flat background color. This creates identity without visual noise. _(ref: NYT Games profile)_
- **Use a 2-level type hierarchy for stat displays** — large bold number + small label underneath, nothing in between. If a stat needs more context, add it as a secondary row below, not as an intermediate text size. _(ref: NYT Games profile)_
- **Use implicit grids over explicit grids** — when laying out columns of data, align by consistent spacing and let whitespace define boundaries. Only add visible separators if alignment alone is ambiguous. _(ref: NYT Games profile)_
- **Use generous vertical spacing between conceptual zones** — profile info, navigation links, and content cards should each have clear breathing room. Compress within a zone, expand between zones. _(ref: NYT Games profile)_
- **Use full-bleed images with overlapping content sheets** — when a screen leads with a photo, let the image go edge-to-edge and have the text content overlap it as a rounded-top sheet. This creates a seamless photo→content transition with natural depth. _(ref: Airbnb listing)_
- **Use a cascading type hierarchy for detail screens** — bold serif/display title → light subtitle (location, category) → inline stats (rating, count) → body description → icon+text highlights. Each level steps down in weight and size. No two adjacent levels should feel the same. _(ref: Airbnb listing)_
- **Use sparse icon+text pairs for feature highlights** — when listing qualities or attributes, use a small icon left-aligned with a bold label and one line of description. No cards, no backgrounds — just the pair sitting in whitespace. _(ref: Airbnb listing)_
- **Use spacing-only grouping for settings and menu lists** — separate logical groups with `space.xl` to `space.2xl` gaps. No section headers, no divider lines. Each row is icon + label only. _(ref: Revolut settings)_
- **Use immersive-first layout for media screens** — content (photo, video, map) fills the entire viewport. All UI is overlaid and ephemeral. Action buttons stack vertically on the trailing edge to keep the content center clear. _(ref: YouTube fullscreen)_
- **Use a branded moment animation on launch** — a short (1-2s), crafted animation of the app's logo or mark (e.g., hand-drawn stroke reveal) followed by a brief pause before the main screen appears. This creates identity and a sense of quality. Keep it non-skippable but short enough to never feel slow. _(ref: Marriott opening animation)_
- **Use a vertical pager for dual-content screens** — when two full-screen content types need to coexist (photo + map, video + comments), put them in a vertical pager. Photo/primary content above, interactive content below. Continuous swipe gesture, no hard snap. No mode commitment — user can interact from any scroll position. _(from game screen redesign)_
- **Use translucent pills (25% black opacity) for floating status indicators** — round/timer/score overlays on media should be low-contrast and unobtrusive. White text at 90% opacity on 25% black pill with full corner radius. They inform without demanding attention. _(from game screen redesign)_
- **Use whisper-level prompts for gesture hints** — "swipe up to guess" type prompts should be ≤60% opacity text over ≤15% opacity background. A drag indicator bar (50×4px, 30% opacity) signals interactivity. The prompt fades after first use. _(from game screen redesign)_

---

## Design References

Visual examples of the taste this app targets. Agents with multimodal capability should view these images directly.

Reference images are stored in `design-references/`. Each entry below describes what to learn from the reference.

- **`nyt-games-profile.png`** — NYT Games "Me" tab. Demonstrates: flat color-coded cards with no borders/shadows, extreme type hierarchy for stats (huge numbers, tiny labels), implicit column grids via whitespace, single small identity icon per card (top-right), generous vertical rhythm between profile/badges/cards zones. The gold standard for "lots of data, zero noise."
- **`airbnb-image-with-text-combo.png`** — Airbnb listing detail. Demonstrates: full-bleed photo with overlapping rounded content sheet, cascading type hierarchy (display title → subtitle → stats → body → icon highlights), sparse icon+text feature highlights with no card wrappers, high information density that still feels spacious thanks to consistent vertical rhythm.
- **`revolut-settings.png`** — Revolut settings (dark mode). Demonstrates: spacing-only section grouping with no headers or dividers, icon+label-only rows (no chevrons, no descriptions), clean dark mode with subtle background tint differences between grouped areas. Proof that less chrome = more clarity.
- **`youtube-image-fullscreen-with-functions.png`** — YouTube Shorts fullscreen. Demonstrates: immersive-first layout where content fills the entire viewport, all controls overlaid and ephemeral, vertical action button stack on trailing edge keeping content center clear. The model for any media-dominant screen.
- **`marriott-opening-animation.MP4`** — Marriott app launch. Demonstrates: branded moment animation — logo drawn as if by hand (stroke reveal), brief deliberate pause, then transition to main screen. Creates quality impression in under 2 seconds. The model for tasteful launch experiences.

---

## Screen Layout Specs

Locked design directions from prototype review. These are the target layouts for implementation.

Design exploration `.fig` file: `design-explorations/timeguesser-redesign.fig`

### Home Screen — "Photo Hero" (Direction B)

- Full-bleed photo collage fills the top ~55% edge-to-edge (thumbnails of guessable images)
- White content sheet overlaps the photo with `borderRadius.sheet` (12px) top corners
- Sheet contains: title in `display` (34px/700), subtitle in `callout` (16px/400) with `text.secondary`, Start Game button
- Start Game button: full-width (with 24px horizontal padding), `accent.primary` fill, `borderRadius.sheet`, `title3` label
- Production note: the photo area should be a collage of actual game images, not a single hero image

### Game Screen — "Vertical Pager" (Direction C + B hybrid)

The game screen is a **vertical pager** with two full-screen pages:

**Interaction model:**

- Photo is "above," map is "below"
- Swipe up from photo to reveal map, swipe down from map to return to photo
- Continuous gesture, not a hard snap — user can rest at any position
- No mode commitment: user can guess from either position
- Map panning must not conflict with the vertical swipe (use gesture priority / dead zone at edges)

**Phase 1 — Study (photo viewport):**

- Photo fills the entire viewport edge-to-edge
- Round pill: top-left (16px from left, 54px from top), `cornerRadius.pill`, black fill at 25% opacity, white text at 90%
- Timer pill (when enabled): top-right (same y), same style as Round pill
- No Hint FAB on this phase — hints are a map interaction
- Bottom prompt: very subtle — 15% opacity black fade, drag indicator (50×4px, white at 30%, centered), text "Swipe up to guess" in `caption1` at 60% white opacity, score in `caption2` at 35% white opacity
- No solid bars, no heavy chrome

**Phase 2 — Guess (map viewport):**

- Map fills the entire viewport
- Round pill + Timer pill: same positions and style as Phase 1 (screen-anchored)
- Search FAB: top-left, below Round pill (16px left, 96px top)
- Hint FAB (when hints enabled): top-right, below Timer pill (319px left, 96px top)
- Zoom FABs: bottom-right, stacked vertically (+, −) with `space.sm` gap
- All FABs: 40×40px, `borderRadius.md`, white fill at 90-95% opacity, `accent.primary` icon, **no border** — shadow only
- GUESS button: floating with 16px horizontal margins, 48px height, `borderRadius.sheet`, `accent.primary` fill
- Below GUESS button: subtle "↓ photo" hint in `caption2` at 40% opacity
- Hint history card: appears below Hint FAB when expanded, `borderRadius.lg`, `tintSubtle` fill, max-height 180px

**State matrix — Phase 1 (Study):**

| State                  | Top-left   | Top-right  | Bottom                     |
| ---------------------- | ---------- | ---------- | -------------------------- |
| Playing, timer ON      | Round pill | Timer pill | Swipe prompt + score       |
| Playing, timer OFF     | Round pill | —          | Swipe prompt + score       |
| Year revealed (tier 5) | Round pill | Timer pill | Year banner + swipe prompt |
| Guess locked           | Round pill | Timer pill | — (swipe disabled)         |
| Result showing         | Round pill | —          | Score reveal overlay       |

**State matrix — Phase 2 (Guess):**

| State                 | Top-left       | Top-right    | Right edge       | Bottom              |
| --------------------- | -------------- | ------------ | ---------------- | ------------------- |
| No pin, hints ON      | Round + Search | Timer + Hint | Zoom             | GUESS (disabled)    |
| No pin, hints OFF     | Round + Search | Timer        | Zoom             | GUESS (disabled)    |
| Pin placed, hints ON  | Round + Search | Timer + Hint | Zoom             | GUESS (active)      |
| Pin placed, hints OFF | Round + Search | Timer        | Zoom             | GUESS (active)      |
| Hints expanded        | Round + Search | Timer + Hint | Hint card + Zoom | GUESS               |
| Year revealed         | Round + Search | Timer + Hint | Zoom             | Year banner + GUESS |
| Result showing        | Round          | Timer        | Zoom             | Score reveal + Next |
