---
name: experiment-intake
description: Run a short interview to convert a chosen direction into a hypothesis-driven experiment brief with constraints, signals, and decision boundaries. Use when direction is known and the team needs intake artifacts before delivery.
compatibility: Designed for this workspace and assumes access to harness templates and policy docs.
metadata:
  version: '0.4.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-04-18'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/experiment-intake.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Experiment Intake

Use this skill to produce a high-quality experiment brief with minimal steering overhead.

## Goal

Convert an approved direction into an executable experiment brief with explicit hypotheses,
constraints, success signals, and escalation boundaries.

## Preconditions

- Direction is chosen (from Concept mode or user instruction).
- User can answer a short, high-signal interview.

## Steps

Intake is a three-stage chain. Run all three in order:

1. **Propose Approach**
   - Synthesize an initial direction from the selected backlog item/source brief.
   - Write `artifacts/tickets/{ID}/inputs/approach-proposal.md` using `.workspace-kit/templates/inputs/APPROACH_PROPOSAL_TEMPLATE.md`.
   - Seed `intake.md` with queue context, user problem, and immutable verbatim intent.
2. **Refine Approach In Chat**
   - Run a short, high-signal operator interview to resolve scope boundaries and tradeoffs.
   - Write `artifacts/tickets/{ID}/inputs/approach-alignment.md` using `.workspace-kit/templates/inputs/APPROACH_ALIGNMENT_TEMPLATE.md`.
   - Preserve the exact same `Verbatim Operator Intent (immutable)` block from `intake.md`.
3. **Classify Execution Path**
   - Choose one of: `design_then_delivery`, `delivery_only`, `quick_capture`.
   - Update intake classification metadata and write/update `ticket.md` only when the next phase can proceed.
   - For `design_then_delivery`, hand off to Design mode; for `delivery_only`, hand off directly to Delivery; for `quick_capture`, stop after intake artifacts.

## Branching Logic

- If user input is incomplete, proceed with reasonable defaults and explicitly tag assumptions.
- If scope is too broad for one cycle, split into current experiment + follow-up experiment.
- If constraints conflict with hypotheses, recommend a revised experiment and explain tradeoff.

## Output Contract

Return artifacts aligned to `.workspace-notes/experiment-intake-template.md` and the kit templates:

- `inputs/approach-proposal.md` generated first from source brief/backlog
- `inputs/approach-alignment.md` refined through manual chat
- `intake.md` with immutable verbatim intent block and explicit classification
- `ticket.md` only when classification indicates immediate Design or Delivery
- `Handoff intent:` what Design or Delivery should execute next
- `Handoff constraints:` hard constraints to preserve in downstream execution
- `Handoff assumptions:` assumptions used to complete intake
- `Handoff acceptance criteria:` minimum conditions for downstream completion
- `Handoff unresolved questions:` unknowns to monitor or resolve later
- `Next-mode trigger:` explicit rule for routing to the next phase

## Guardrails

- Keep interview brief and high signal.
- Prefer smallest useful experiment over speculative completeness.
- Do not silently change hard constraints or safety-critical policies.

## References

- `.workspace-notes/experiment-intake-template.md`
- `.workspace-kit/templates/INTAKE_TEMPLATE.md`
- `.workspace-kit/templates/TICKET_TEMPLATE.md`
- `.workspace-kit/templates/inputs/APPROACH_PROPOSAL_TEMPLATE.md`
- `.workspace-kit/templates/inputs/APPROACH_ALIGNMENT_TEMPLATE.md`
- `.workspace-notes/autonomy-policy.md`
- `.workspace-notes/harness-operating-model.md`
- `.workspace-notes/mode-handoff-schema.md`
