---
name: design-prototype
description: Rapidly prototype product UI directions in OpenPencil using CLI and MCP tools, then export review-ready artifacts. Use when the user asks to explore visual directions, iterate interaction concepts, or generate quick design options before production hardening.
compatibility: Requires OpenPencil CLI/MCP access (`open-pencil` commands or openpencil-mcp) and a writable workspace.
metadata:
  version: '0.2.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/design-prototype.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Prototype

Use this skill for fast ideation and concept exploration, not final production polish.

## Goal

Generate 2-3 high-signal prototype directions quickly, show visual evidence, and converge on one candidate direction for production hardening.

## Preconditions

- OpenPencil is available (CLI and/or running app mode).
- User can provide product intent, target screen context, and constraints.

## Steps

1. Capture intent in a compact brief:
   - target user moment
   - platform/context
   - required constraints
   - acceptance cues for this prototype pass
2. Choose mode:
   - app mode (live editor) when OpenPencil app is running
   - headless mode when operating on `.fig` files directly
3. Inspect existing file/state before editing:
   - `open-pencil info`
   - `open-pencil tree --depth 2`
   - `open-pencil query` for likely targets
4. Produce 2-3 variants via small, reversible edits:
   - layout adjustments
   - hierarchy/spacing changes
   - component treatment changes
5. Export review artifacts for each variant:
   - PNG snapshot
   - optional JSX export for implementation handoff
6. Summarize tradeoffs and recommend one direction.
7. Record unresolved questions to carry into production design.

## Branching Logic

- If there is no existing design file, create a minimal starter frame and prototype from scratch.
- If user asks for final specs/tokens/signoff, hand off to `design-production`.
- If regressions or inconsistencies are suspected, route to `design-qa`.

## Output Contract

Return:

- `Prototype brief:` one-paragraph intent and constraints summary
- `Variants:` 2-3 options with rationale
- `Exports:` file paths to visual artifacts
- `Recommendation:` one preferred direction and why
- `Carry-forward notes:` what production pass must lock down
- `Handoff intent:` what `design-production` should finalize
- `Handoff constraints:` constraints to preserve during hardening
- `Handoff assumptions:` prototype assumptions that need confirmation
- `Handoff acceptance criteria:` conditions for production-ready completion
- `Handoff unresolved questions:` unresolved design decisions
- `Next-mode trigger:` explicit rule for routing to `design-production` or `design-qa`

## Guardrails

- Prioritize speed-to-signal over exhaustive detail.
- Avoid irreversible large refactors in prototype mode.
- Keep scoring/safety-critical product constraints unchanged unless explicitly requested.

## References

- `https://github.com/open-pencil/open-pencil`
- `https://github.com/open-pencil/skills`
- `.workspace-notes/mode-handoff-schema.md`
