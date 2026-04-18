<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/classify.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Classify Execution Path Stage

## Session Context Override

Skip session-start hooks and unrelated verification. Classify execution path from aligned intake
artifacts only.

## Required Reading

1. `$artifact_dir/intake.md`
2. `$artifact_dir/inputs/approach-alignment.md`
3. `$goal_file` when provided

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Broad repository scans
- Creating delivery artifacts other than `ticket.md`

## Output

- Update intake classification metadata in `$artifact_dir/intake.md`
- Write/update `$artifact_dir/ticket.md` only when the next phase can proceed
- Use only: `design_then_delivery`, `delivery_only`, `quick_capture`

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
