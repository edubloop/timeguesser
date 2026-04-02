# Workspace-Kit Adoption Log

**Adopted by:** AI agent (Claude Sonnet 4.6) acting as a first-time adopter
**Date:** 2026-03-16
**workspace-kit version:** no version tag — read from HEAD
**TimeGuesser:** Tier 1, non-safety-critical, React Native / Expo / TypeScript
**Adopter prior knowledge of workspace-kit:** None — reading README.md cold

---

## What I Did (in order)

### Step 1 — Read `workspace-kit/README.md`

The README is short (80 lines). It describes the kit's purpose, lists contents in a table,
gives a 5-step adoption guide, and a "minimal quick-start" with three `cp` commands.

The minimal quick-start is:

```
cp workspace-kit/WORKSPACE.md         ./WORKSPACE.md
cp workspace-kit/AGENTS.md            ./AGENTS.md
cp workspace-kit/templates/PULL_REQUEST_TEMPLATE.md  <repo>/.github/PULL_REQUEST_TEMPLATE.md
```

**Confusion #1 — Where does `./` refer to?**
The README says copy WORKSPACE.md and AGENTS.md to `./` without defining what `./` is.
The workspace-kit is stored inside the workspace (`workspace-kit/`), so `./` would be the
workspace root. But the README never says that explicitly. I inferred "workspace root" from
naming convention. A reader unfamiliar with the concept of workspace roots might copy these
files into each repo instead.

**Confusion #2 — The adoption guide doesn't say "read the templates before copying"**
Step 1 just says "copy the files you need." You only discover the placeholder system after
opening the files. It would help if the README said "read the template contents first —
every `<PLACEHOLDER>` must be filled before the file is useful."

### Step 2 — Explored existing TimeGuesser state

Before touching anything, I needed to know what TimeGuesser already had. Relevant existing
files: `.github/PULL_REQUEST_TEMPLATE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `AGENTS.md`.

**This was the right thing to do, but the README doesn't tell you to do it.**
The adoption guide goes straight to "copy files." There is no "inventory what you already
have" step. For a repo with nothing, that's fine. For a repo with existing conventions,
skipping inventory leads to silent overwrites.

### Step 3 — Discovered the workspace is larger than expected

The README's minimal quick-start assumes you're operating from the workspace root. When I
listed the workspace root, I found:

```
AGENTS.md          ← already existed, comprehensive, 98 lines
WORKSPACE_AUDIT.md ← existing ways-of-working audit
iAPS/              ← Swift/Xcode safety-critical app
TimeGuesser/       ← the repo being adopted
local-data-dir/      ← local PHI data directory (MUST NOT have git remote)
workspace-kit/     ← the kit itself
```

**Confusion #3 — The workspace already had a workspace-level AGENTS.md.**
The existing file was already more detailed than the workspace-kit template would produce:
it documented iAPS, local data directory (PHI), the cross-repo interface, and toolchain isolation.
The workspace-kit template version is generic; the existing version is specific.

**Decision made:** Did NOT overwrite the existing `AGENTS.md`. The workspace-kit template
was used as a reference to verify the existing file's structure; it was already compliant.
The README gives no guidance for this scenario ("what if the file already exists?").

### Step 4 — Created `WORKSPACE.md` at workspace root

The workspace-kit WORKSPACE.md template is 115 lines. Placeholders filled:

| Placeholder                      | Value used                                                                         | Notes                                    |
| -------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `<WORKSPACE_NAME>`               | `ec-workspace`                                                                     | Guessed from directory naming convention |
| `<WORKSPACE_ROOT>`               | `~/Documents/Workspace`                                                            | Known from directory listing             |
| `<DATE>`                         | `2026-03-16`                                                                       | Current date                             |
| `<repo-a>`                       | `TimeGuesser/`                                                                     | Known                                    |
| `<repo-b>`                       | `iAPS/`                                                                            | Found from workspace listing             |
| `<local-data-dir>`               | `local-data-dir/`                                                                  | Found from workspace listing             |
| `<stack>`                        | `React Native / Expo (TypeScript)` for TimeGuesser; `Swift / Xcode / SPM` for iAPS | Known                                    |
| `<org>/<repo>`                   | `edubloop/timeguesser`                                                             | From `git remote -v` in TimeGuesser      |
| `<safety-critical-path>`         | Removed (iAPS, not TimeGuesser)                                                    | TimeGuesser is non-safety-critical       |
| `<toolchain-a>`, `<toolchain-b>` | `Node.js / npm / Expo`, `Swift / Xcode / SPM`                                      | Known                                    |

**Confusion #4 — Template has exactly two `<repo>` rows.**
The workspace has three directories (TimeGuesser, iAPS, workspace-kit). The template
assumed two. Adding a third row was trivial, but it wasn't obvious I was "allowed" to.
The template should either have a variable number of rows or say "add rows as needed."

**Confusion #5 — workspace-kit itself is an awkward repo to list.**
`workspace-kit/` has no git remote and no toolchain. Listing it in the repo map table
feels odd — it's more of a local reference than a peer repo. The template doesn't address
this case.

**Confusion #6 — `<WORKSPACE_NAME>` has no guidance.**
I guessed `ec-workspace` from the username. The template doesn't say what this should
represent: GitHub org name? Local folder name? Human-readable label? Anything?

**Confusion #7 — `<local-data-dir>` assumes one local data directory.**
The template is structured around exactly one local sensitive data dir. If a workspace had
zero or more than one, the template structure doesn't cleanly accommodate it.

**What I got wrong on first pass:**
My initial WORKSPACE.md incorrectly said "no local data directories exist" because the
exploration agent only looked at TimeGuesser. I had to correct this after listing the
workspace root manually. The adoption guide doesn't prompt you to inventory the full
workspace before filling in the template — it assumes you already have a mental model.

### Step 5 — Confirmed workspace-level AGENTS.md needed no changes

Compared the workspace-kit AGENTS.md template against the existing workspace AGENTS.md.
The existing file already covered:

- Workspace map with all repos ✓
- local data directory prohibition with detail ✓
- Cross-repo interface contract ✓
- Toolchain isolation ✓
- Repo-level AGENTS.md precedence ✓

The existing file was missing the "General Agent Guidelines" section from the template.
Decided NOT to add it to avoid touching a file with active PHI-related guardrails without
explicit permission.

**Confusion #8 — Template vs existing file: no merge strategy.**
The README says "copy files you need." When the file already exists and the template adds
new sections, there's no guidance on whether to (a) overwrite, (b) merge, or (c) skip.
I merged CONTRIBUTING.md and skipped AGENTS.md — different decisions for similar scenarios.

### Step 6 — Updated `TimeGuesser/.github/PULL_REQUEST_TEMPLATE.md`

Existing template had 5 checklist items. workspace-kit template added:

- "Type of change" section (Bug fix / Feature / Refactor / etc.)
- "No hard-coded secrets" checklist item
- Safety Impact section (commented out — not applicable)

**What worked well:** The workspace-kit PR template is structured but lightweight.
Merging it with the existing template was straightforward.

**Confusion #9 — The safety section is commented HTML, not instructional.**
The template includes the Safety Impact section as an HTML comment block. This means:
(a) it won't appear in rendered PR forms, and (b) future contributors won't know it exists
unless they look at the raw file. A short note above the comment explaining what it's for
and when to use it would help.

**Confusion #10 — "Type of change" has no guidance on mutual exclusivity.**
The template has 5 type-of-change checkboxes with no instructions. Should you check one?
Multiple? Is it fine to leave all unchecked? Standard convention is "check one" but the
template doesn't say that.

### Step 7 — Updated `TimeGuesser/CONTRIBUTING.md`

The existing CONTRIBUTING.md was concise and TimeGuesser-specific (33 lines).
The workspace-kit template is more complete but generic. Strategy: keep all TimeGuesser-
specific content, add missing sections from the template.

Added:

- "Code Quality" section with explicit commands (format, lint, typecheck)
- "Changelog Format" section (with Keep a Changelog snippet)
- "Dependency Updates" section (pin, audit, document CVEs)
- "Questions" section
- Safety-critical section (commented out — not applicable)

**Confusion #11 — Template CONTRIBUTING.md conflicts structurally with existing.**
The template has a "Getting started" section with `git clone` and install commands.
TimeGuesser's existing "Development Setup" section covers the same ground differently.
I kept the existing section and added new sections — but this means the file now has
two slightly different "setup" sections that could confuse readers. No guidance on
whether to restructure or just append.

**Confusion #12 — `<hook-install-command>` placeholder.**
TimeGuesser uses `simple-git-hooks`, not `husky`. The template just has a generic
`<hook-install-command>` placeholder. The correct answer for TimeGuesser is
`npm install` (simple-git-hooks runs automatically as a postinstall script), which is
not obvious — it's the same as the general install command, just with a different reason.

**Confusion #13 — `<check-command>` placeholder.**
TimeGuesser's check command is `npm run check`. Fine to fill in. But the placeholder
name `<check-command>` is ambiguous — does it mean the main check suite, lint only,
test only? Context clues in surrounding text help but the name itself is unclear.

### Step 8 — Created `TimeGuesser/CHECKLIST_definition-of-done.md`

Copied from `workspace-kit/templates/CHECKLIST_definition-of-done.md`. Filled placeholders:

- `<lint-command>` → `npm run lint`
- `<typecheck-command>` → `npm run typecheck`
- `<format-command>` → `npm run format`

Added a TimeGuesser-specific section for scoring constants and design system tokens.
Removed the safety-critical section (commented it out with an explanation).

**What worked well:** This template was the most complete and clearest of all the templates.
Placeholder count is low (3 commands), the section structure was sensible, and it was easy
to add a repo-specific section.

**Confusion #14 — "Delete inapplicable sections" vs "don't leave unchecked items."**
The checklist says both. If you delete the safety section, no problem. But what if there
are items within a section that sometimes apply and sometimes don't? The guidance is
slightly contradictory: it implies you should both keep the whole section and ensure
nothing is unchecked.

**Confusion #15 — Template footer.**
The template ends with `*Template from [workspace-kit](../README.md). Delete this line
when adopting.*` — the link uses a relative path that is wrong when the file is placed
in `TimeGuesser/` (the link would point to `TimeGuesser/README.md`, not the workspace-kit
README). This is a minor bug in the template. The line was deleted as instructed.

### Step 9 — Copied `scripts/check_no_sensitive_paths.sh`

Copied verbatim to `TimeGuesser/scripts/check_no_sensitive_paths.sh`.

**Confusion #16 — Default `FORBIDDEN_PATTERNS` are wrong for this repo.**
The script defaults to `FORBIDDEN_PATTERNS="local_data_dir local_data_dir"`. These are
iAPS-workspace-specific patterns. For TimeGuesser, which has no sensitive local data
directory, both patterns are wrong. A committer would need to override `FORBIDDEN_PATTERNS`
or update the script default.

The README says to "wire scripts into pre-commit hooks or CI." But for TimeGuesser, the
script would produce false positives OR silently do nothing useful (since neither pattern
matches anything in the TimeGuesser codebase).

**Decision made:** Copied the script for completeness, but did NOT wire it into
TimeGuesser's pre-commit hooks or CI because it's not useful without reconfiguring the
patterns. The README does not say how to configure the patterns for a non-medical app.

**Confusion #17 — When should this script be skipped entirely?**
The README's step 4 says "wire scripts into your pre-commit hooks or CI." There's no
guidance on when a script is not applicable. For a workspace without sensitive local data
dirs, `check_no_git_remote_in_local_data_dir.sh` is entirely irrelevant. I skipped it, but
the README implies all scripts should be wired in.

### Step 10 — Checked `docs/ci-patterns.md` against existing CI

Reviewed `workspace-kit/docs/ci-patterns.md` (206 lines) against TimeGuesser's
`.github/workflows/ci.yml`.

TimeGuesser's CI already had:

- npm audit (vulnerability scanning) ✓ — matches workspace-kit pattern
- Lint + typecheck + test ✓
- Node.js caching (with npm cache) ✓

Missing from TimeGuesser CI:

- Concurrency control (cancel redundant runs on same branch) — useful addition
- Advisory → Blocking rollout pattern explanation — N/A (CI is already blocking)

**Confusion #18 — ci-patterns.md is written for Swift/iOS primarily.**
The document has extensive Swift Package Manager test package setup, SwiftLint/SwiftFormat
examples, and Homebrew caching. These sections are not applicable to a React Native /
TypeScript project. The generic patterns are buried between language-specific examples.
A first-time adopter might waste time trying to understand Swift-specific patterns before
realizing they're inapplicable.

**Decision made:** Did not modify TimeGuesser's CI. The existing CI already implements
the intent of the workspace-kit patterns. The advisory → blocking rollout guidance is
only relevant when adding new CI checks; existing checks are already blocking.

### Step 11 — Skipped `docs/cross-repo-interface-template.md`

Not applicable. TimeGuesser has no cross-repo dependencies and no local data directory.
This template is for documenting interfaces between a code repo and a local data directory.

**No confusion here** — the template's purpose was clear and the inapplicability was obvious.

### Step 12 — Skipped `docs/safety-critical-changes.md`

Not applicable. TimeGuesser is Tier 1, non-safety-critical.

**Minor confusion:** The doc is titled "safety-critical-changes.md" and describes itself
as "when to apply: for modules where bugs cause physical harm." The applicability is clear.
However, the template doesn't say "if your project has no safety-critical modules, skip
this entire doc." It just describes the pattern. Minor negative: I had to read a 151-line
document to confirm it was inapplicable rather than discovering that upfront.

---

## Summary: What Worked Smoothly

1. **PR template** — minimal, clear, easy to merge with existing content. Best template.
2. **Definition of Done checklist** — well-structured, few placeholders, easy to extend.
3. **Placeholder naming** — most placeholders are self-documenting (e.g., `<lint-command>`).
4. **"Delete inapplicable sections"** instruction — right philosophy; I just needed it to be
   more specific about which sections are safety-related.
5. **Template instruction blocks** — each template starts with `> Template instructions:
Replace every <PLACEHOLDER>. Delete this block when adopting.` Helpful.
6. **Cross-repo interface template** — very clear purpose statement; instantly identifiable
   as inapplicable.

---

## Summary: Where I Got Stuck or Confused

| #   | Confusion                                                                       | Severity | Suggestion                                                |
| --- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| 1   | Where does `./` in `cp` commands refer to? (workspace root assumed, not stated) | Medium   | Add "workspace root" definition                           |
| 2   | No "inventory existing files" step in adoption guide                            | High     | Add step 0: list what you already have                    |
| 3   | workspace-level AGENTS.md already existed; no guidance for conflicts            | High     | Add "if file exists" guidance                             |
| 4   | Template assumes exactly 2 repos                                                | Low      | Say "add rows as needed"                                  |
| 5   | workspace-kit itself is awkward to list as a "repo"                             | Low      | Note this is optional                                     |
| 6   | `<WORKSPACE_NAME>` has no guidance on what it should be                         | Low      | Add 1-line description                                    |
| 7   | Template assumes exactly 1 local data dir                                       | Medium   | Handle 0 and N>1 cases                                    |
| 8   | No merge strategy when target file exists                                       | High     | Add merge vs overwrite vs skip guidance                   |
| 9   | Safety Impact section is a hidden HTML comment                                  | Low      | Add a visible note above the comment                      |
| 10  | "Type of change" — should you check one or multiple?                            | Low      | Add "(check one)"                                         |
| 11  | CONTRIBUTING.md conflicts structurally with existing                            | Medium   | Add merge strategy                                        |
| 12  | `<hook-install-command>` unclear for simple-git-hooks                           | Low      | Give example for simple-git-hooks                         |
| 13  | `<check-command>` name is ambiguous                                             | Low      | Rename or add examples                                    |
| 14  | "Delete inapplicable" vs "don't leave unchecked" conflict                       | Low      | Clarify at item vs section level                          |
| 15  | Template footer relative link breaks when file is moved                         | Low      | Use absolute URL or remove link                           |
| 16  | Default FORBIDDEN_PATTERNS are iAPS-specific, not generic                       | High     | Default to empty; provide examples                        |
| 17  | No guidance on when to skip scripts entirely                                    | Medium   | Add applicability conditions                              |
| 18  | ci-patterns.md is primarily Swift/iOS-focused                                   | Medium   | Add Node.js / TypeScript sections or separate by language |

---

## Questions I Had to Guess the Answer To

1. **"Copy to workspace root" — correct assumption?** Guessed yes from naming; could be wrong.
2. **Should AGENTS.md be overwritten or merged?** Chose not to overwrite; no guidance given.
3. **Is workspace-kit itself a "repo" in the workspace map?** Listed it; felt odd.
4. **Should the scripts be wired into CI if they don't match the project's needs?** Chose no.
5. **Does "delete inapplicable sections" mean entire sections only, or individual items too?**
   Chose: entire sections for safety-critical, individual items where they don't apply.
6. **`<WORKSPACE_NAME>` — what value format is expected?** Guessed `ec-workspace` (kebab-case).

---

## Files Created / Modified

| File                                           | Action                    | Template source                                           |
| ---------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| `/Users/ec/Documents/Workspace/WORKSPACE.md`   | Created                   | `workspace-kit/WORKSPACE.md`                              |
| `TimeGuesser/.github/PULL_REQUEST_TEMPLATE.md` | Modified (merged)         | `workspace-kit/templates/PULL_REQUEST_TEMPLATE.md`        |
| `TimeGuesser/CONTRIBUTING.md`                  | Modified (sections added) | `workspace-kit/templates/CONTRIBUTING.md`                 |
| `TimeGuesser/CHECKLIST_definition-of-done.md`  | Created                   | `workspace-kit/templates/CHECKLIST_definition-of-done.md` |
| `TimeGuesser/WORKSPACE_KIT_ADOPTION_LOG.md`    | Created                   | (this file)                                               |

## Files Skipped

| File                                                             | Reason                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `workspace-kit/AGENTS.md` (workspace-level)                      | Workspace AGENTS.md already exists and is more complete than the template                         |
| `workspace-kit/scripts/check_no_sensitive_paths.sh`              | Not applicable — removed after review because TimeGuesser has no sensitive local data dir in-repo |
| `workspace-kit/scripts/check_no_git_remote_in_local_data_dir.sh` | Not applicable — not run against TimeGuesser (applies to `local-data-dir/`)                       |
| `workspace-kit/docs/cross-repo-interface-template.md`            | Not applicable — TimeGuesser has no cross-repo dependencies                                       |
| `workspace-kit/docs/safety-critical-changes.md`                  | Not applicable — TimeGuesser is non-safety-critical                                               |
| `workspace-kit/templates/SPEC_TEMPLATE.md`                       | Not listed in minimal adoption; TimeGuesser already has `TIMEGUESSER_SPEC.md`                     |
| `workspace-kit/templates/ADR_TEMPLATE.md`                        | Not listed in minimal adoption; no ADR needed yet                                                 |

---

## 2026-03-27 artifact-by-artifact review

This follow-up review re-checked TimeGuesser against the current workspace-kit adoption
model (`workspace-kit` v1.3.1) and confirmed which kit artifacts are applicable versus
intentionally out of scope for a standard adopted repo.

| Artifact                                           | Status         | Notes                                                                                                                                                            |
| -------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                        | Adopted        | Repo-specific constraints, architecture, and QA workflow remain intentionally richer than the kit baseline; sync marker updated to `workspace-kit-sync: v1.3.1`. |
| `CONTRIBUTING.md`                                  | Adopted        | Existing repo-specific setup and performance guidance remain, with kit-derived quality, changelog, and dependency sections in place.                             |
| `CHECKLIST_definition-of-done.md`                  | Adopted        | Includes the expected kit sections plus TimeGuesser-specific scoring/design checks.                                                                              |
| `.github/PULL_REQUEST_TEMPLATE.md`                 | Adopted        | Preserves the lightweight kit structure while adding repo-specific verification items.                                                                           |
| `CHANGELOG.md`                                     | Adopted        | Present and actively maintained; aligns with the standard repo expectation.                                                                                      |
| `scripts/check_no_sensitive_paths.sh`              | Not applicable | Removed during review because TimeGuesser has no sensitive local data directory inside the repo; the relevant protections live at workspace level.               |
| `scripts/check_no_git_remote_in_local_data_dir.sh` | Not applicable | TimeGuesser has no local-only data directory inside the repo.                                                                                                    |

### Review outcome

- TimeGuesser now satisfies the current repo-adoption definition for a `standard_adopted` repo.
- Remaining differences from the kit are product-specific enrichments, not drift.
- The workspace adoption metadata now records TimeGuesser as `adopted`.
