---
name: design-system
description: Review design drafts for consistency, naming discipline, reusable patterns, and token drift. Use when a Fabro design revise pass needs design-system alignment.
---

<!-- workspace-kit-source: .workspace-kit/packages/design/skills/design-system.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design System

Load this skill with `use_skill("design-system")` before revising drafts.

## Focus

Review for:
- repeated patterns that should align
- inconsistent labels, headings, or section structure
- spacing, typography, or component naming drift
- missing shared conventions across related artifacts
- unnecessary one-off formats that increase maintenance cost

## Method

1. Compare parallel sections and repeated structures.
2. Normalize obvious drift.
3. Favor a small number of reusable patterns.
4. Call out any inconsistency that will confuse delivery or review.

## Output

Return concise findings with:
- inconsistent pattern
- expected canonical pattern
- exact normalization to apply

## Guardrails

- Prefer harmonization over redesign.
- Do not erase meaningful distinctions that communicate lifecycle state.
- Keep revisions lightweight unless inconsistency blocks comprehension.
