# Backlog

## Bugs

### 1. "Unknown location" shown for almost every image

Every score reveal card shows "Unknown location" even when the image has valid coordinates. `inferLocationLabel()` in `lib/photos.ts` relies on strict text pattern matching in titles/tags. No reverse geocoding exists to convert the lat/lng we already have into a place name.
**Fix:** Add reverse geocoding (e.g., Nominatim/OpenStreetMap) as a fallback when text inference fails.

### 2. Remove dot thousands separator from scores

Score displays as "7.065" with a dot separator. Remove it — just show "7065".

### 3. Map does not reset between rounds

After guessing and moving to the next round, the map retains the previous zoom level and position. It should reset to a default world/region view when a new round starts.

### 4. Result distance line not framed on screen

When the score reveal shows the line between guessed and actual location, the line often extends off-screen. The map should auto-fit to show both pins and the full connecting line.

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
