# Backlog

This file is the queue, not the execution brief.

When a backlog item is selected, promote it into `../artifacts/tickets/{ID}/intake.md` and run the Fabro Design workflow. The Design workflow produces the approved `ticket.md` that the Fabro Delivery workflow consumes.

## Item Format

Each active item should stay lightweight:

- `Status`: `Queued`, `In Design`, `Ready for Delivery`, or `Done`
- `Lane`: `Experience / UX`, `Design system / taste QA`, `Content pipeline quality`, or `Internal tooling`
- `Path`: whether the item should go through Design first or can move directly to Delivery

## Active Queue

### TG-005 — Rethink screen real estate ratio

- Status: `Done`
- Lane: `Experience / UX`
- Path: `Design -> Delivery`
- Summary: Rebalance the game screen toward photo-first emphasis. Current ratio feels too map-heavy early in the round.

### TG-006 — Reduce tab bar footprint during gameplay

- Status: `Queued`
- Lane: `Experience / UX`
- Path: `Design -> Delivery`
- Summary: The bottom tab bar takes too much vertical space. Explore smaller treatment, auto-hide behavior, or hiding it entirely during active rounds.

### TG-007 — Settings page visual redesign

- Status: `Queued`
- Lane: `Experience / UX`
- Path: `Design -> Delivery`
- Summary: Settings hierarchy and spacing feel inconsistent. Needs a clearer, calmer layout with stronger visual rhythm.

### TG-008 — Cache fill progress indicator + haptics

- Status: `Done`
- Lane: `Experience / UX`
- Path: `Design -> Delivery`
- Summary: Add a manual cache-fill action with visible progress and meaningful haptic feedback so long waits do not feel stuck.

## Recently Completed

- Done: Reverse geocoding fallback for `"Unknown location"` images
- Done: Removed score thousands separator
- Done: Reset map between rounds
- Done: Auto-fit result distance line on screen
