---
name: accessibility-review
description: Review design drafts for accessibility, readability, and inclusive interaction guidance. Use when a Fabro design revise pass needs a WCAG-oriented rubric.
---

<!-- workspace-kit-source: .workspace-kit/packages/design/skills/accessibility-review.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Accessibility Review

Load this skill with `use_skill("accessibility-review")` before revising drafts.

## Focus

Review for:
- unclear labels or instructions
- poor semantic structure
- color or emphasis choices that may depend on vision alone
- dense copy that harms scanability
- missing guidance for keyboard, screen reader, or reduced-motion expectations when relevant

## Method

1. Inspect the artifact for readability and inclusive comprehension.
2. Flag accessibility issues that affect review or implementation.
3. Recommend concise revisions that improve accessibility without widening scope.

## Output

Return concise findings with:
- accessibility concern
- likely impact
- concrete revision

## Guardrails

- Focus on issues visible from the artifact package.
- Do not claim measured contrast ratios unless they are explicitly provided.
- Keep feedback actionable and tied to the actual draft.
