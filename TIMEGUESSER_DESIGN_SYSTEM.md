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
