<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/refine-approach.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Refine Approach Stage

## Session Context Override

Do not run session-start hooks or unrelated checks. This stage records operator-aligned approach
changes only.

## Required Reading

1. `$artifact_dir/intake.md`
2. `$artifact_dir/inputs/approach-proposal.md`
3. `$artifact_dir/inputs/approach-alignment.md` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Broad repository scans
- Updating `ticket.md` in this stage

## Output

- Write/update `$artifact_dir/inputs/approach-alignment.md`
- Preserve the same `Verbatim Operator Intent (immutable)` block from `intake.md`

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
