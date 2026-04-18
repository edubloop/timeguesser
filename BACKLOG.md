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

### TG-007 — Settings page visual redesign

- Status: `Queued`
- Lane: `Experience / UX`
- Execution path: `design_then_delivery`
- Summary: Settings hierarchy and spacing feel inconsistent. Needs a clearer, calmer layout with stronger visual rhythm.

### TG-010 — Full-bleed photo treatment (YouTube Shorts-inspired)

- Status: `Queued`
- Lane: `Experience / UX`
- Execution path: `design_then_delivery`
- Summary: Implement a full-bleed image presentation layer that follows the ephemeral visual approach used in YouTube Shorts, based on `../design-references/youtube-image-fullscreen-with-functions.png`.

### TG-011 — Result surface: decouple CTA from card, adopt scrim/blur chrome

- Status: `Queued`
- Lane: `Experience / UX`
- Execution path: `design_then_delivery`
- Summary: Follow-up to TG-010. The result-state CTA currently overlaps the result card (clipping the total score) and the top/bottom chrome is opaque white, breaking the full-bleed promise. Two changes: (1) float the primary CTA outside the card bounds so score + title are never occluded (Shorts pattern: controls in free space, content beneath); (2) replace opaque surfaces (top status-bar region, bottom result card) with gradient scrims or `BlurView` so the photo/map reads edge-to-edge. Also align the right-rail (map toggle / hint / refresh / details) with the reference's vertical action stack. Reference: `../design-references/youtube-image-fullscreen-with-functions.png`.

## Recently Completed

- **TG-008** — Cache fill progress indicator + haptics. Truthful progress reporting, inline status treatment, haptic feedback on fill completion. (2026-04-02)
- **TG-005** — Screen real estate rethink. Photo-first → map-first two-state gameplay flow. (2026-04-06)
- Done: Reverse geocoding fallback for `"Unknown location"` images
- Done: Removed score thousands separator
- Done: Reset map between rounds
- Done: Auto-fit result distance line on screen
