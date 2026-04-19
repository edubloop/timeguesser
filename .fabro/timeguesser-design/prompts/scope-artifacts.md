<!-- workspace-kit-source: .workspace-kit/packages/design/repos/timeguesser/.fabro/timeguesser-design/prompts/scope-artifacts.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Scope Artifacts Stage

## Session Context Override

Skip session-start hooks and exploratory changes. This stage prepares a human gate decision.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Generating `drafts/` artifacts in this stage

## Output

- Write/update `$artifact_dir/artifact-scope.md`
- Ensure at least one `[x]` selection among approved artifact types (or `none-needed`)

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
