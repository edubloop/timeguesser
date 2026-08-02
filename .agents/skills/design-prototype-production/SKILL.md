---
name: design-prototype-production
description: Orchestrate end-to-end design work in OpenPencil by routing between prototype exploration, production hardening, and QA validation. Use when the user asks for complete design delivery from concept through release-readiness.
compatibility: Requires OpenPencil CLI/MCP access and local filesystem access for export artifacts.
metadata:
  version: '0.2.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/design-prototype-production.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Prototype Production

Use this as the orchestration layer for full design lifecycle work.

## Goal

Select the correct subskill mode (`design-prototype`, `design-production`, `design-qa`), execute the needed flow, and return a consolidated status with next action.

## Routing Logic

Choose mode based on user intent and current artifact maturity:

1. Use `design-prototype` when direction is unclear, multiple concepts are needed, or exploration is requested.
2. Use `design-production` when a direction is selected and implementation-ready outputs are required.
3. Use `design-qa` when quality validation, regression checks, or release readiness is requested.
4. Use multi-step route when user asks for end-to-end delivery:
   - prototype -> production -> qa
5. When `artifact-scope.md` exists and selected types include visual artifacts, run in prototype mode scoped to those selected types instead of rerunning full routing logic.

## Steps

1. Classify request into one of the routing paths.
2. For ambiguous requests, default to `design-prototype` and explicitly tag assumptions.
3. Assign `Route confidence` (`high`/`medium`/`low`) with one-line rationale.
4. State selected mode and why.
5. Validate required handoff fields from mode output before routing onward.
6. Execute selected mode workflow.
7. If mode output indicates handoff to another mode, continue routing.
8. Return unified report including:
   - work completed
   - artifact paths
   - current readiness state
   - recommended next action

## Branching Logic

- If inputs are too vague, start in `design-prototype` with minimal assumptions.
- If user asks for final outputs but no approved concept exists, run a rapid prototype pass first.
- If critical QA issues are found, route back to `design-production` for remediation then re-run `design-qa`.

## Output Contract

Return:

- `Routing decision:` selected mode(s) and rationale
- `Route confidence:` high / medium / low with rationale
- `Completed work:` what was done in each mode
- `Artifacts:` output file paths
- `Readiness:` exploration / production-ready / conditionally ready / not ready
- `Next action:` single recommended step
- `Handoff intent:` immediate next objective
- `Handoff constraints:` hard constraints that remain fixed
- `Handoff assumptions:` assumptions made to route/work
- `Handoff acceptance criteria:` minimum conditions for next mode
- `Handoff unresolved questions:` unresolved unknowns
- `Next-mode trigger:` explicit route rule for next transition

## Guardrails

- Do not claim production readiness without explicit QA verdict.
- Keep routing transparent; always show why a mode was selected.
- Keep outputs concise and decision-oriented.

## References

- `.claude/skills/design-prototype/SKILL.md`
- `.claude/skills/design-production/SKILL.md`
- `.claude/skills/design-qa/SKILL.md`
- `.workspace-notes/mode-handoff-schema.md`
