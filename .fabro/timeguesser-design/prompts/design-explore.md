<!-- workspace-kit-source: .workspace-kit/packages/design/repos/timeguesser/.fabro/timeguesser-design/prompts/design-explore.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Design Explore Stage

## Session Context Override

Skip session-start hooks and broad scans. Produce framing only.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/inputs/approach-alignment.md` when present

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Generating final draft artifacts in this stage

## Output

- Write/update `$artifact_dir/shape.md`
- Include goals, options, risks, and candidate artifact types only

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
