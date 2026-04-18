<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/propose-approach.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Propose Approach Stage

## Session Context Override

Do not run session-start hooks, cadence checks, or broad exploratory scans. Work only from the
stage inputs listed below.

## Required Reading

1. `$source_file`
2. `$artifact_dir/intake.md` when it already exists

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (only within listed files)

## Forbidden

- Web browsing/search
- Broad globs or repository-wide scans
- Editing files outside `$artifact_dir/intake.md` and `$artifact_dir/inputs/approach-proposal.md`

## Output

- Write/update `$artifact_dir/inputs/approach-proposal.md`
- Update `$artifact_dir/intake.md` with problem framing and immutable verbatim intent block

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
