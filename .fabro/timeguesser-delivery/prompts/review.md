<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/review.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Review Stage

## Session Context Override

The workspace session-start checks were already completed before this stage. Do not rerun
cadence checks, healthchecks, or exploratory scans.

## Required Reading

1. `$artifact_dir/spec.md`
2. `$artifact_dir/plan.md`
3. `$goal_file` (ticket bridge)
4. Verification outputs and touched implementation files

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (only within already-read files)

## Forbidden

- Web browsing/search
- Broad globs or repo-wide scans
- Code modification in this stage

## Output

Write/update `$artifact_dir/review.md` with this exact header block first:

```text
Review outcome: <Proceed | Revise and Re-verify | Escalate>
Semantic cycle: <integer, start at 1>
Semantic cycle max: 2
High-risk lenses required: <yes | no>
Lens outcomes:
  intent_scope=<Proceed | Revise and Re-verify | Escalate | not_required>
  architecture_simplification=<Proceed | Revise and Re-verify | Escalate | not_required>
  risk_policy=<Proceed | Revise and Re-verify | Escalate | not_required>
Rationale: <concise evidence-linked rationale>
Required revisions before re-verify: <checklist when outcome is Revise and Re-verify; else n/a>
Escalation reason: <required when outcome is Escalate; else n/a>
```

Mandatory escalation when `Semantic cycle` equals `Semantic cycle max` and pass-line remains unmet.

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
