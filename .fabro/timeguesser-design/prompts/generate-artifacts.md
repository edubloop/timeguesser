<!-- workspace-kit-source: .workspace-kit/packages/design/repos/timeguesser/.fabro/timeguesser-design/prompts/generate-artifacts.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Generate Artifacts Stage

## Session Context Override

Skip session-start hooks. Generate only artifacts explicitly selected by artifact scoping.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/shape.md`
3. `$artifact_dir/artifact-scope.md`
4. Existing files in `$artifact_dir/drafts/` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Generating unselected artifact types
- Editing unrelated ticket artifacts

## Output

- Write selected files under `$artifact_dir/drafts/`
- Keep generated artifacts traceable to selections in `artifact-scope.md`

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
