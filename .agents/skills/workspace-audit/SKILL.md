---
name: workspace-audit
description: Inspect workspace policy parity, drift, cadence state, and adoption metadata, then report actionable fixes. Use for periodic harness audits or when policy drift is suspected.
compatibility: Designed for this workspace and assumes local access to policy and `.workspace-notes/` files.
metadata:
  version: "0.2.0"
  status: "stable"
  owner: "workspace-maintainer"
  last_updated: "2026-03-24"
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/workspace-audit.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Workspace Audit

Use this skill to run a structured harness audit and produce actionable findings.

## Goal

Assess whether the workspace harness is healthy, synchronized across agent configs,
and aligned with current repo reality.

## Audit Checklist

1. Run preflight checks:

```bash
bash .workspace-notes/harness_healthcheck.sh || bash ../.workspace-notes/harness_healthcheck.sh
```

1. Review policy parity files for drift:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `.codex/agent-notes.md`
   - `.cursor/rules/workspace-core.mdc`
   - `.cursor/rules/local-data-dir-protection.mdc`

2. Review workspace substrate docs:
   - `WORKSPACE.md`
   - `backlog.md`
   - `.workspace-notes/policy-interface-registry.yaml`
   - `.workspace-notes/harness-operating-model.md` (includes Harness Health Heuristics section)
   - `.workspace-notes/review-challenge-framework.md` (includes Harness Anti-Patterns section)

3. Verify harness adoption metadata and local divergences:
   - `.workspace-notes/adoption-metadata.yaml`

4. Check exception ledger for expired exceptions:
   - `.workspace-notes/exception-ledger.md`

5. Confirm root-scope inventory alignment against repo map in `AGENTS.md`/`WORKSPACE.md`.

## Output Format

Return a concise report with:

- `Status:` healthy / needs attention
- `Critical issues:` numbered list
- `Drift findings:` numbered list
- `Cadence:` due/not due and last logged review date
- `Recommended fixes:` 1-3 highest-impact follow-ups

## Guardrails

- Never include PHI/PII data values from `local-data-dir/`.
- Treat unknown root directories as scope-drift candidates until documented.
