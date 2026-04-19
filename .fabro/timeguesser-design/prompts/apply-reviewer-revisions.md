<!-- workspace-kit-source: .workspace-kit/packages/design/repos/timeguesser/.fabro/timeguesser-design/prompts/apply-reviewer-revisions.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Apply Reviewer Revisions Stage

## Session Context Override

Skip session-start hooks. Apply only reviewer-required design revisions.

## Required Reading

1. `$artifact_dir/design-approval.md`
2. `$artifact_dir/design-review.md`
3. `$artifact_dir/ticket.md`
4. `$artifact_dir/shape.md`
5. `$artifact_dir/artifact-scope.md`
6. Files under `$artifact_dir/drafts/` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Scope expansion beyond required revisions

## Output

- Update design package files needed to satisfy required revisions
- Preserve unresolved items explicitly when they require escalation

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
