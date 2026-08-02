---
name: review-challenge
description: Pressure-test implementation scope and quality against experiment intent before merge or handoff. Use when delivery work is complete and a skeptical go/no-go review is needed.
compatibility: Designed for this workspace and assumes access to review and handoff standards.
metadata:
  version: '0.3.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-04-18'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/review-challenge.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Review Challenge

Use this skill to pressure-test completed delivery work before merge/handoff.

## Goal

Detect over-scope, weak rationale, avoidable complexity, and gaps in hypothesis coverage.

## Preconditions

- Delivery artifacts exist: implementation summary, verification evidence, and experiment brief.

## Steps

1. Compare delivered work to original experiment scope.
2. Evaluate product judgment quality:
   - does implementation actually test the stated hypotheses?
   - are success/failure signals measurable and addressed?
3. Evaluate engineering quality:
   - overengineering or architecture inflation
   - duplication and naming quality
   - verbosity and unnecessary complexity
4. Identify gaps in verification or missing regression checks.
5. Propose at least one simplification or de-scope option if work is oversized.
6. Produce explicit semantic review recommendation with rationale.

## Branching Logic

- If semantic pass line is met with acceptable residual risk, return `Proceed`.
- If issues are actionable within approved scope and cycle bound permits one more loop, return `Revise and Re-verify`.
- If cycle bound is reached, policy/risk requires human adjudication, or scope conflict exists, return `Escalate`.

## Output Contract

Return:

- `Scope alignment:` aligned / partial / misaligned
- `Findings:` numbered list by severity
- `Simplification options:` 1-3 concrete alternatives
- `Hypothesis coverage:` pass / partial / fail with explanation
- `Recommendation:` Proceed / Revise and Re-verify / Escalate
- `Semantic cycle:` integer
- `Semantic cycle max:` 2
- `Lens outcomes:` intent_scope / architecture_simplification / risk_policy
- `Required next actions:` explicit checklist
- `review.md header block:` emit the stable REVIEW_TEMPLATE header fields in order

## Guardrails

- Be skeptical but practical; avoid perfectionist churn.
- Anchor critique to experiment goals and user value.
- Do not request out-of-scope rewrites unless safety or policy requires it.

## References

- `.workspace-notes/review-challenge-framework.md` (includes Harness Anti-Patterns section)
- `.workspace-notes/pr-handoff-standard.md`
- `.workspace-kit/templates/REVIEW_TEMPLATE.md`
