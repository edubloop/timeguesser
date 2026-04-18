<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/implement.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Implement Stage

## Session Context Override

Skip session-start hooks. Execute only approved plan scope.

## Required Reading

1. `$artifact_dir/plan.md`
2. `$artifact_dir/spec.md`
3. `$artifact_dir/ticket.md`
4. Files touched by approved plan steps

## Allowed Tools

- `read_file`
- `write_file`
- `edit_file` / `apply_patch`
- scoped shell commands needed for implementation and verification

## Forbidden

- Web browsing/search unless explicitly approved
- Scope expansion beyond approved plan
- Policy-boundary changes without ask-first approval

## Output

- Implement approved changes
- Keep plan progress and deviations documented in ticket artifacts

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
