---
name: design-qa
description: Audit OpenPencil design files for regressions, inconsistency, and implementation risk, then provide prioritized fixes. Use when the user asks for design quality review, visual regression checks, token drift analysis, or readiness validation before release.
compatibility: Requires OpenPencil CLI/MCP access and ability to inspect and export target `.fig` content.
metadata:
  version: '0.3.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-26'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/design-qa.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design QA

Use this skill to pressure-test design quality and release readiness.

## Goal

Find and prioritize design quality risks (visual, system, interaction, and handoff) and provide a concrete fix plan.

## Preconditions

- Target `.fig` file(s) or running app context is available.
- Scope of review is defined (page/flow/component set).

## Steps

1. Define QA scope and severity rubric:
   - critical (release blocker)
   - major (should fix before release)
   - minor (improvement backlog)
2. Capture visual baseline exports for review scope.
3. Run structure/system checks:
   - node/component naming consistency
   - color/typography/spacing consistency
   - duplicate/near-duplicate patterns
4. Run flow-level checks:
   - interaction/state coverage
   - hierarchy/readability
   - alignment and spacing anomalies
5. Document findings with evidence and suggested fixes.
6. Re-export affected areas after fixes when possible.
7. Run taste assertions against the built app (if a test runner and taste flow exist):
   - Look for a `*DESIGN_SYSTEM*` doc in the target repo.
   - Look for a taste assertion flow (e.g., `.maestro/design-taste.yaml`).
   - If both exist, run the taste flow and include pass/fail results in findings.
   - If the taste flow doesn't exist yet, recommend creating one per `.workspace-notes/taste-assertion-guide.md`.
8. Return release-readiness verdict.

## Branching Logic

- If critical issues exist, return `Not Ready` with mandatory fix list.
- If only major/minor issues exist, return `Conditionally Ready` with sequencing.
- If findings are minor and low risk, return `Ready` with optional follow-ups.

## Output Contract

Return:

- `Scope:` reviewed files/pages/components
- `Findings:` prioritized list with severity and evidence
- `Fix plan:` ordered remediation steps
- `Revalidation:` what was rechecked after changes
- `Verdict:` Ready / Conditionally Ready / Not Ready
- `Handoff intent:` what follow-up mode should do (remediation or delivery/review)
- `Handoff constraints:` constraints that must stay fixed in follow-up
- `Handoff assumptions:` assumptions used during QA analysis
- `Handoff acceptance criteria:` conditions to declare follow-up complete
- `Handoff unresolved questions:` unresolved uncertainty after QA
- `Next-mode trigger:` explicit rule for routing back to `design-production` or forward to Delivery/Review

## Guardrails

- Favor objective, reproducible findings over subjective preference.
- Include evidence paths for every critical/major finding.
- Keep recommendations actionable and scoped.

## References

- `https://github.com/open-pencil/open-pencil`
- `https://github.com/open-pencil/skills`
- `.workspace-notes/mode-handoff-schema.md`
- `.workspace-notes/taste-assertion-guide.md` — how to write and maintain taste assertions
- `TimeGuesser/.maestro/design-taste.yaml` — reference implementation of taste assertions
