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

### TG-009 — TimeGuesser intake-first workflow migration

- Status: `Queued`
- Lane: `Internal tooling`
- Execution path: `design_then_delivery`
- Summary: Split Intake from Design in TimeGuesser's Fabro runner surface, keep Design and Delivery separate downstream, and preserve `ticket.md` as the canonical bridge artifact before Delivery.

## Recently Completed

- **TG-008** — Cache fill progress indicator + haptics. Truthful progress reporting, inline status treatment, haptic feedback on fill completion. (2026-04-02)
- **TG-005** — Screen real estate rethink. Photo-first → map-first two-state gameplay flow. (2026-04-06)
- Done: Reverse geocoding fallback for `"Unknown location"` images
- Done: Removed score thousands separator
- Done: Reset map between rounds
- Done: Auto-fit result distance line on screen
