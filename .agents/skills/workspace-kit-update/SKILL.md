---
name: workspace-kit-update
description: Compare local harness policy docs against .workspace-kit templates and propose safe adoption updates. Use when syncing workspace-kit versions, investigating adoption drift, or planning template merges.
compatibility: Designed for this workspace and assumes local access to `.workspace-kit/` and workspace policy files.
metadata:
  version: "0.3.0"
  status: "stable"
  owner: "workspace-maintainer"
  last_updated: "2026-04-18"
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/workspace-kit-update.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# Workspace Kit Update

Use this skill when the local harness may be behind `.workspace-kit` or when preparing a periodic sync.

## Goal

Identify meaningful drift between local workspace docs and `.workspace-kit` templates, then produce a safe update plan that preserves local constraints.

## Preconditions

- `.workspace-kit/` exists locally.
- `adoption-metadata.yaml` is present and current enough to guide comparison.

## Steps

1. Read `.workspace-notes/adoption-metadata.yaml` for current adopted version and declared divergences.
2. Compare canonical template files in `.workspace-kit/` against local workspace policy files.
3. Categorize drift:
   - safe to adopt now
   - adopt with edits
   - do not adopt (conflicts with local constraints)
4. Validate conflicts against hard constraints:
   - local-data-dir PHI prohibition
   - iAPS safety-critical boundaries
5. Draft a merge plan with ordered patches and risk notes.
6. Propose updates to `adoption-metadata.yaml` (version/date/divergence list) after adoption.
7. Recommend verification commands and documentation touchpoints.

## Branching Logic

- If template changes weaken PHI/safety protections, classify as `do not adopt` and explain.
- If drift is cosmetic only, batch changes into one low-risk update.
- If drift touches policy parity files, require same-session mirror updates across agent surfaces.

## Output Contract

Return:

- `Current adoption:` version/date/divergence summary
- `Drift report:` categorized findings with file paths
- `Merge plan:` ordered steps with risk level
- `Blocked items:` explicit reasons
- `Post-update checks:` required commands and docs to update

## Guardrails

- Preserve local hard constraints even when template differs.
- Avoid wholesale overwrite when local docs contain intentional divergences.
- Keep changes auditable with explicit rationale per adopted diff.

## References

- `.workspace-notes/adoption-metadata.yaml`
- `.workspace-notes/exception-ledger.md`
- `.workspace-notes/harness_healthcheck.sh`
- `.workspace-kit/templates/SHAPE_TEMPLATE.md`
- `.workspace-kit/templates/DESIGN_REVIEW_TEMPLATE.md`
- `.workspace-kit/templates/DESIGN_APPROVAL_TEMPLATE.md`
- `.workspace-kit/templates/REVIEW_TEMPLATE.md`
- `.workspace-kit/templates/HANDOFF_TEMPLATE.md`
- `.workspace-kit/templates/inputs/APPROACH_PROPOSAL_TEMPLATE.md`
- `.workspace-kit/templates/inputs/APPROACH_ALIGNMENT_TEMPLATE.md`
- `.workspace-kit/templates/AGENTS.md.tpl`
- `.workspace-kit/templates/AGENTS-constraints.md.tpl`
- `.workspace-kit/templates/AGENTS-operations.md.tpl`
- `.workspace-kit/templates/AGENTS-workflows.md.tpl`
- `.workspace-kit/templates/CODING_STANDARDS_TEMPLATE.md`
- `.workspace-kit/templates/fabro/workflow.fabro`
- `.workspace-kit/templates/fabro/prompts/`
- `.workspace-kit/templates/fabro/scripts/`
