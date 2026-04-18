<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/spec.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Spec Stage

## Session Context Override

Skip session-start hooks and broad scans. Author the ticket spec from approved ticket context.

## Required Reading

1. `$goal_file`
2. `$artifact_dir/ticket.md`
3. `$artifact_dir/inputs/approach-alignment.md` when present
4. Repo policy files explicitly cited by ticket

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Implementing code in this stage

## Output

- Write/update `$artifact_dir/spec.md` using workspace spec template
- Include labeled requirements and explicit `Pass Line / Stop Rule`

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
