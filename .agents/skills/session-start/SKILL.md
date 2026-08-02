---
name: session-start
description: Run startup cadence and preflight checks, then summarize current workspace status. Use at session start or when re-establishing workspace context before non-trivial work.
compatibility: Designed for this workspace and assumes `.workspace-notes/` scripts are available.
metadata:
  version: '0.2.0'
  status: 'stable'
  owner: 'workspace-maintainer'
  last_updated: '2026-03-24'
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/session-start.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Session Start

Use this skill at the start of a workspace session, especially from the workspace root.

## Goal

Run required startup checks quickly, identify whether cadence actions are due, and produce
a concise status brief with next actions.

## Steps

1. Run cadence due check:

```bash
bash .workspace-notes/cadence_due_check.sh || bash ../.workspace-notes/cadence_due_check.sh
```

1. If output includes `[DUE]`, run harness preflight:

```bash
bash .workspace-notes/harness_healthcheck.sh || bash ../.workspace-notes/harness_healthcheck.sh
```

1. If cadence is due, append a new row under `Cadence Log` in `WORKSPACE_AUDIT.md` with:
   - date
   - check result
   - notable drift/issues
   - follow-up owner and date

2. Treat the `--- Required reads ---` manifest from script output as authoritative:
   - read files in the exact listed order
   - do not substitute discretionary file choices before those reads
   - if a listed file is missing, report it explicitly

3. Summarize current workspace status:
   - cadence due/not due
   - preflight pass/fail (if run)
   - immediate blockers (if any)
   - recommended next action

## Output Format

Return a short report with:

- `Cadence:` due/not due
- `Preflight:` not run/pass/fail
- `Risks:` none or bullet list
- `Next action:` single highest-priority action

## Notes

- Do not read or expose data values from `local-data-dir/`.
- If running from inside a repo, use the `../.workspace-notes/` fallback commands.
