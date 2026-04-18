<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/handoff.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Handoff Stage

## Session Context Override

Skip session-start hooks. Produce PR-ready handoff using completed artifact chain.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/spec.md`
3. `$artifact_dir/plan.md`
4. `$artifact_dir/review.md`
5. Verification summaries and changed-file list

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Additional implementation changes in this stage

## Output

- Write/update `$artifact_dir/handoff.md`
- Summarize implementation, validation, review outcome, residual risk, and next operator actions

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
