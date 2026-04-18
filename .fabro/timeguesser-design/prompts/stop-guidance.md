<!-- workspace-kit-source: .workspace-kit/templates/fabro/prompts/stop-guidance.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Stop Guidance Stage

## Session Context Override

Skip session-start hooks. Preserve stop outcome and next guidance only.

## Required Reading

1. `$artifact_dir/design-approval.md`
2. `$artifact_dir/design-review.md`
3. `$artifact_dir/ticket.md`
4. `$artifact_dir/shape.md`

## Allowed Tools

- `read_file`
- `write_file`

## Forbidden

- Web browsing/search
- Publishing delivery-ready `ticket.md`
- Generating new design drafts

## Output

- Update stop summary guidance artifact(s)
- Keep decision durable without advancing to delivery

## TimeGuesser Repo Overrides

- Keep scoring constants and hint costs unchanged unless explicitly approved (`constants/scoring.ts`, `lib/scoring.ts`).
- Do not modify `app.json` or `eas.json` without explicit approval.
- Do not grow `app/(tabs)/game.tsx`; extract additional logic into other files.
- Use `TYPESCRIPT_CODING_STANDARDS.md` (`TGS-###`) as the coding-rule citation source.
