# Handoff Stage

## Session Context Override

The workspace CLAUDE.md contains session-start hooks (cadence checks, health checks).
For this Fabro workflow stage, DO NOT run any session-start hooks, cadence checks,
healthchecks, or exploratory validation. These have already been completed before
this stage began. Proceed directly to the task below using only the specific files
and tools listed.

---

## Goal

Write or update the ticket handoff summary.

## Pre-flight Guard

Before writing `handoff.md`, read `$artifact_dir/review.md` and verify that the latest
`Review outcome:` value is exactly `Proceed`.

- If `Review outcome: Proceed` — continue to Required Reading and produce `handoff.md`.
- If `Review outcome: Revise and Re-verify` — STOP. Do not write `handoff.md`. Report that handoff cannot proceed: the semantic review loop has not completed. The workflow must return through `semantic_cycle_gate → implement → verify → review` before handoff is permitted.
- If `Review outcome: Escalate` — STOP. Do not write `handoff.md`. Report that the ticket is blocked/escalated and must be resolved by the operator before handoff.
- If the `Review outcome:` field is missing — STOP. Do not write `handoff.md`. Report `readiness_unknown`: review.md does not contain the required outcome field.

## Required Reading

Read exactly these files in order:

1. `$goal_file` (the ticket.md bridge artifact)
2. `$artifact_dir/spec.md`
3. `$artifact_dir/plan.md`
4. `$artifact_dir/review.md`
5. ADRs only when spec.md or plan.md explicitly lists them
6. No other files unless explicitly listed above

## Allowed Tools

For this stage, you may use ONLY:

- `read_file` — to read the specific files listed in Required Reading
- `write_file` — to create or update `$artifact_dir/handoff.md`
- `grep` — only within files already read

## Forbidden

DO NOT use:

- `web_fetch` or `web_search`
- `glob` with broad patterns
- `shell` commands
- `edit_file` or `apply_patch`

## Output

Write the handoff to: `$artifact_dir/handoff.md`

## Requirements

Use the workspace PR handoff structure:

- What was built
- Hypotheses tested
- Verification
- Scope check
- Risks and open questions
- Recommended next steps

Keep it concise and review-ready.
