<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/publish-ticket.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Publish Ticket Stage

## Session Context Override

Skip session-start hooks. This stage only normalizes `ticket.md` after approved design.

## Required Reading

1. `$artifact_dir/ticket.md`
2. `$artifact_dir/design-review.md`
3. `$artifact_dir/design-approval.md`
4. `$artifact_dir/shape.md`

## Allowed Tools

- `read_file`
- `write_file`
- `grep` (scoped)

## Forbidden

- Web browsing/search
- Generating code or non-ticket artifacts

## Output

- Update `$artifact_dir/ticket.md` to delivery-ready state
- Reflect final artifact applicability and runtime provenance

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
