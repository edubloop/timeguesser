<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/plan.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Plan Stage

## Session Context Override

Skip session-start hooks and unrelated checks. Build the plan from approved spec context.

## Required Reading

1. `$artifact_dir/spec.md`
2. `$artifact_dir/ticket.md`
3. Relevant referenced ADRs/policy docs cited in spec

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Implementing code in this stage

## Output

- Write/update `$artifact_dir/plan.md`
- Keep step ordering, traceability, verification checkpoints, and ask-first boundaries explicit

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
