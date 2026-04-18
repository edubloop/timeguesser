# Review Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Write or update the ticket review artifact.

## Required Reading

Read exactly these files in order:

1. `$artifact_dir/spec.md`
2. `$artifact_dir/plan.md`
3. `$goal_file` (the ticket.md bridge artifact)
4. Each file explicitly modified during the implement stage
5. ADRs only when spec.md or plan.md explicitly lists them
6. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/review.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands (except verification commands explicitly listed in plan.md)
- `edit_file` or `apply_patch` — review only, do not modify

## Output

Write the review to: `$artifact_dir/review.md`

---

## Required Output Fields

Every `review.md` MUST contain all of the following stable fields, in this order, as a
header block before the main review body. Omitting any field causes downstream consumers
(HS-012, CP-015) to report `readiness_unknown` rather than inferred success.

```
Review outcome: <exactly one of: Proceed | Revise and Re-verify | Escalate>
Semantic cycle: <integer, starting at 1, incremented on each re-entry from semantic_cycle_gate>
Semantic cycle max: 2
High-risk lenses required: <yes | no>
Lens outcomes:
  intent_scope=<Proceed | Revise and Re-verify | Escalate | not_required>
  architecture_simplification=<Proceed | Revise and Re-verify | Escalate | not_required>
  risk_policy=<Proceed | Revise and Re-verify | Escalate | not_required>
Rationale: <concise justification tied to specific spec/plan evidence>
Required revisions before re-verify: <explicit checklist when outcome is Revise and Re-verify; otherwise n/a>
Escalation reason: <required when outcome is Escalate; otherwise n/a>
```

---

## Review Outcome Definitions

- **`Proceed`** — semantic pass line met, residual risk acceptable. Routes to `handoff`.
- **`Revise and Re-verify`** — semantic gaps are actionable within approved ticket scope. Routes to `semantic_cycle_gate → implement`. Requires a non-empty `Required revisions before re-verify:` checklist.
- **`Escalate`** — decision requires human adjudication, scope/policy conflict, or loop bound reached. Routes to `blocked/exit`. Requires `Escalation reason:` to be populated.

---

## High-Risk Ticket Detection

Mark `High-risk lenses required: yes` when any of the following conditions holds:

- Changes shared delivery contract or workflow semantics across repos
- Affects policy, safety, security, or compliance boundaries
- Introduces irreversible behavior or data-impact risk
- Changes approval, escalation, or stop-rule semantics

When `High-risk lenses required: yes`, evaluate all three lenses (intent_scope, architecture_simplification, risk_policy) independently before determining the aggregated outcome.

When `High-risk lenses required: no`, set all three lens outcomes to `not_required`.

---

## Lens Aggregation Rule

Apply in order when `High-risk lenses required: yes`:

1. If any lens outcome = `Escalate` → overall `Review outcome: Escalate`
2. Else if any lens outcome = `Revise and Re-verify` → overall `Review outcome: Revise and Re-verify`
3. Else all required lenses = `Proceed` → overall `Review outcome: Proceed`

---

## Mandatory Escalation Conditions

You MUST set `Review outcome: Escalate` when any of the following is true:

- `Semantic cycle` is already equal to `Semantic cycle max` and the semantic pass line is still not met
- Required revision implies out-of-scope work or contradicts spec/plan
- Policy or risk issue requires human decision
- Unresolved conflict between review lenses
- The same unresolved semantic finding repeats after one revise cycle

Do NOT set `Review outcome: Revise and Re-verify` when `Semantic cycle` equals `Semantic cycle max`.

---

## Semantic Revision Delta (when re-entering on cycle ≥ 2)

If this is not the first review cycle (i.e., `Semantic cycle` > 1), confirm that
`$artifact_dir/plan.md` contains a `Semantic Revision Delta` section for the current
cycle number. If it does not, note this as a finding — the implementing agent should
have appended it before re-entering verify.

---

## Requirements

- Focus on intent alignment and scope fit, not just code quality
- Summarize which verification commands ran and their results
- Call out any remaining risks or open questions
- State whether the implemented work stayed within the minimum experiment scope
- Keep grounded in the actual spec, plan, and validation outcomes
