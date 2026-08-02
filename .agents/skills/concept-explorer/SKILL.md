---
name: concept-explorer
description: Explore broad product reframes, generate direction options, and recommend a shortlist. Use when the user asks for concept mode, brainstorming, reframing, or multiple product directions before deciding scope.
compatibility: Designed for this workspace and assumes access to workspace policy docs.
metadata:
  version: '0.3.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/concept-explorer.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Concept Explorer

Use this skill to turn a rough product prompt into a small set of high-signal direction options.

## Goal

Generate 3-5 candidate directions, pressure-test each, and recommend one direction to move into Experiment Intake.

## Preconditions

- Input is a rough product intent, reframe request, or strategic direction question.
- Direction is not already fixed and bounded.

## Steps

1. Restate the prompt as a decision question in one sentence.
2. Define evaluation lenses for this concept pass:
   - user value
   - UX quality
   - technical feasibility
   - scope-to-signal ratio
3. Generate 3-5 direction options with concise labels.
4. For each option, provide:
   - target user/moment
   - expected value
   - top failure risk
   - smallest useful experiment
5. Score options with a lightweight rubric (1-5) across the four lenses.
6. Recommend one direction and provide runner-up fallback.
7. Produce intake-ready handoff notes for the recommended direction.

## Branching Logic

- If the prompt is already tightly scoped and approved, skip this skill and start with `experiment-intake`.
- If no option reaches acceptable scope-to-signal quality, recommend refining constraints before intake.

## Output Contract

Return:

- `Decision question:` one sentence
- `Options:` 3-5 bullets with risk and minimum experiment
- `Recommendation:` chosen option + why
- `Fallback:` one runner-up
- `Intake handoff:` assumptions, constraints, open questions
- `Handoff intent:` what Experiment Intake should accomplish next
- `Handoff constraints:` hard constraints that remain fixed
- `Handoff assumptions:` assumptions made in concept pass
- `Handoff acceptance criteria:` minimum success conditions for intake output
- `Handoff unresolved questions:` unknowns to resolve in intake
- `Next-mode trigger:` explicit rule for routing to `experiment-intake` or `design-prototype`

## Guardrails

- Do not move into implementation details here.
- Keep options hypothesis-oriented, not architecture-heavy.
- Respect workspace constraints and safety/data boundaries from `AGENTS.md`.

## References

- `.workspace-notes/harness-operating-model.md`
- `.workspace-notes/experiment-intake-template.md`
- `.workspace-notes/mode-handoff-schema.md`
