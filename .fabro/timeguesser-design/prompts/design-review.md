<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/design-review.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Review Stage

## Session Context Override

Do not run session-start hooks. Review only the design package artifacts.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. Files under `$artifact_dir/drafts/` when present
5. Existing `$artifact_dir/design-review.md` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Implementation/code edits

## Output

- Write/update `$artifact_dir/design-review.md`
- Use outcome vocabulary: `Proceed | Revise and Re-verify | Escalate`
- Include lens outcomes for `intent_scope`, `architecture_simplification`, `risk_policy`

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
