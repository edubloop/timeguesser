---
name: design-critique
description: Critique design drafts for information hierarchy, narrative flow, and decision-making clarity. Use when a Fabro design revise pass needs composition and architecture feedback.
---

<!-- workspace-kit-source: .workspace-kit/packages/design/skills/design-critique.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Critique

Load this skill with `use_skill("design-critique")` before revising drafts.

## Focus

Review for:

- clear top-level story and operator takeaway
- sensible information order
- strong grouping and chunking
- correct emphasis on risk, decision points, and next actions
- removal of visual noise that weakens comprehension

## Method

1. Find the intended reader decision for each artifact.
2. Check whether the structure makes that decision easy.
3. Flag sections that bury the main point or overload the reader.
4. Recommend a tighter arrangement when hierarchy is weak.

## Output

Return concise findings with:

- hierarchy issue
- why it harms comprehension
- the revision to make

## Guardrails

- Do not ask for decorative changes without comprehension value.
- Keep critique anchored to artifact purpose, not abstract taste.
- Preserve approved scope and contract fields.
