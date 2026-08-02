---
name: design-production
description: Convert an approved prototype direction into production-ready design outputs in OpenPencil with explicit consistency checks and handoff artifacts. Use when the user asks to finalize design systems, lock specs, prepare engineering handoff, or generate dependable production exports.
compatibility: Requires OpenPencil CLI/MCP access and ability to export artifacts from `.fig` documents.
metadata:
  version: '0.2.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/design-production.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Production

Use this skill after concept direction is selected and ready for hardening.

## Goal

Produce stable, implementation-ready design outputs with consistent tokens, predictable structure, and explicit handoff notes.

## Preconditions

- A chosen design direction exists (usually from `design-prototype`).
- Scope and constraints are clear enough for finalization.

## Steps

1. Establish production baseline:
   - identify source file/page/frame IDs
   - capture before snapshot export
2. Normalize structure:
   - enforce naming consistency
   - reduce duplicate near-identical nodes/components where appropriate
3. Normalize tokens and system usage:
   - color usage patterns
   - typography scales
   - spacing rhythm
4. Finalize layout behavior:
   - auto layout/grid intent
   - responsive resizing behavior
5. Generate production artifacts:
   - primary PNG/SVG exports
   - optional JSX (Tailwind or OpenPencil JSX) for engineering reference
6. Write concise implementation handoff:
   - component mapping
   - states/variants
   - interaction notes
7. Provide final acceptance checklist and residual risks.

## Branching Logic

- If constraints are ambiguous, list assumptions explicitly and proceed with minimal-risk defaults.
- If major UX uncertainty remains, bounce back to `design-prototype` for another concept cycle.
- If quality regressions are detected during finalization, run `design-qa` before signoff.

## Output Contract

Return:

- `Production scope:` finalized target and assumptions
- `System consistency report:` tokens/layout/component consistency summary
- `Exports:` paths for final artifacts
- `Engineering handoff:` key implementation details
- `Signoff checklist:` pass/fail items and open risks
- `Handoff intent:` what `design-qa` should validate next
- `Handoff constraints:` constraints that QA should enforce
- `Handoff assumptions:` assumptions retained in finalization
- `Handoff acceptance criteria:` minimum conditions for QA readiness verdict
- `Handoff unresolved questions:` risks or unknowns requiring QA attention
- `Next-mode trigger:` explicit rule for routing to `design-qa`

## Guardrails

- Do not label outputs production-ready without explicit consistency checks.
- Keep changes traceable and reversible with clear rationale.
- Preserve accessibility/readability basics (contrast, hierarchy, touch targets where relevant).

## References

- `https://github.com/open-pencil/open-pencil`
- `https://github.com/open-pencil/skills`
- `.workspace-notes/mode-handoff-schema.md`
