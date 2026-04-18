<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/prepare-review-decision.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Prepare Review Decision Stage

## Session Context Override

Skip session-start hooks. Prepare a durable design approval artifact for the human gate.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. Files under `$artifact_dir/drafts/` when present
5. `$artifact_dir/design-review.md`

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Publishing delivery ticket in this stage

## Output

- Write/update `$artifact_dir/design-approval.md`
- Use decision branches: `Approve As-Is | Revise | Stop`
- Include required changes or stop guidance when applicable

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
