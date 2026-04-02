# Backlog

## Bugs (Fixed)

- ~~"Unknown location" shown for almost every image~~ — added Nominatim reverse geocoding fallback
- ~~Dot thousands separator in scores~~ — removed
- ~~Map does not reset between rounds~~ — reset to default view on round advance
- ~~Result distance line not framed on screen~~ — auto-fit map to both pins with padding

---

## Design

### 5. Rethink screen real estate ratio (image vs map)

Currently ~40% image / 60% map. Should be closer to 70% image / 30% map since the photo is more important initially. Needs visual prototyping before implementation.

### 6. Tab bar takes too much space / should auto-hide

Bottom navigation bar is too tall and wastes space during gameplay. Explore: smaller bar, auto-hide on scroll/swipe, or hide entirely during active game rounds.

### 7. Settings page visual redesign

Inconsistent text sizes, bolding, button styles, and spacing. Elements are too close together. Needs a design pass for visual hierarchy, consistent spacing, and coherent component styling.

---

## Features

### 8. Cache fill progress indicator + haptics

Add a manual "fill cache" button with haptic feedback and a visual progress indicator (percentage bar) so the user can see cache fill progress instead of waiting 30-60s with no feedback.
