---
name: iaps-release
description: Manage iAPS TestFlight release operations: check pipeline status, inspect upstream drift, trigger builds, and diagnose failures. Use whenever the user asks about iAPS release status, expired TestFlight builds, monthly build cadence, or release pipeline troubleshooting.
metadata:
  version: "0.3.0"
  status: "stable"
  owner: "workspace-maintainer"
  last_updated: "2026-03-24"
---

<!-- workspace-kit-source: .workspace-kit/packages/skills/iaps-release.SKILL.md -->
<!-- workspace-kit-sync: v1.5.0 | synced: 2026-04-18 -->

# iAPS Release Management

Manages the iAPS TestFlight release pipeline for `edubloop/iAPS`.

**Upstream repo:** `Artificial-Pancreas/iAPS`
**Distribution:** TestFlight → 2 testers
**Build expiry:** 90 days — scheduled monthly release provides ~30-day buffer
**Signing:** Fastlane Match via `edubloop/Match-Secrets` (appstore type)

---

## 1. Check Current Status

Always start here. Get the lay of the land before taking any action.

```bash
# Last 5 runs across all workflows
gh run list --repo edubloop/iAPS --limit 5 \
  --json workflowName,status,conclusion,createdAt,displayTitle \
  --jq '.[] | "\(.createdAt[:10]) \(.workflowName) → \(.conclusion // .status) (\(.displayTitle))"'

# Last build specifically
gh run list --repo edubloop/iAPS --workflow build_iAPS.yml --limit 3 \
  --json status,conclusion,createdAt,url \
  --jq '.[] | "\(.createdAt[:10]) \(.conclusion // .status) \(.url)"'

# Check scheduled release history
gh run list --repo edubloop/iAPS --workflow scheduled_release.yml --limit 3 \
  --json status,conclusion,createdAt \
  --jq '.[] | "\(.createdAt[:10]) \(.conclusion // .status)"'
```

---

## 2. Check Upstream Changes

Review what has changed in `Artificial-Pancreas/iAPS` since the last build before triggering.

```bash
# Compare fork main vs upstream main — list commits in upstream not yet in fork
gh api "repos/Artificial-Pancreas/iAPS/commits?sha=main&per_page=10" \
  --jq '.[] | "\(.commit.committer.date[:10]) \(.sha[:7]) \(.commit.message | split("\n")[0])"'

# Check if build_iAPS.yml has drifted between fork and upstream
FORK_SHA=$(gh api "repos/edubloop/iAPS/contents/.github/workflows/build_iAPS.yml" --jq '.sha')
UPSTREAM_SHA=$(gh api "repos/Artificial-Pancreas/iAPS/contents/.github/workflows/build_iAPS.yml" --jq '.sha')
echo "Fork:     $FORK_SHA"
echo "Upstream: $UPSTREAM_SHA"
[ "$FORK_SHA" = "$UPSTREAM_SHA" ] && echo "In sync" || echo "DRIFTED — review before building"

# View upstream changes to build_iAPS.yml if drifted
gh api "repos/Artificial-Pancreas/iAPS/contents/.github/workflows/build_iAPS.yml" \
  --jq '.content' | base64 -d
```

---

## 3. Trigger a Build

Use after confirming upstream is in good shape. This fires `build_iAPS.yml` on main via workflow_dispatch — the full pipeline: cert check → sync → build → TestFlight upload.

```bash
# Trigger build on main
gh workflow run build_iAPS.yml --repo edubloop/iAPS --ref main

# Confirm it started (wait a few seconds first)
sleep 5
gh run list --repo edubloop/iAPS --workflow build_iAPS.yml --limit 1 \
  --json status,url --jq '.[] | "Status: \(.status) — \(.url)"'
```

---

## 4. Monitor a Running Build

The build takes ~15-20 minutes on GitHub's macOS runners.

```bash
# Watch live — streams log output until complete
gh run watch --repo edubloop/iAPS $(
  gh run list --repo edubloop/iAPS --workflow build_iAPS.yml --limit 1 --json databaseId --jq '.[0].databaseId'
)

# Or poll status without streaming
gh run list --repo edubloop/iAPS --workflow build_iAPS.yml --limit 1 \
  --json status,conclusion,url \
  --jq '.[] | "Status: \(.status) | Conclusion: \(.conclusion // "in progress") | \(.url)"'
```

---

## 5. Diagnose a Failed Build

When a build fails, fetch the logs and look for known error patterns.

```bash
# Get the failed run ID
FAILED_RUN=$(gh run list --repo edubloop/iAPS --workflow build_iAPS.yml \
  --status failure --limit 1 --json databaseId --jq '.[0].databaseId')

# View failure summary
gh run view $FAILED_RUN --repo edubloop/iAPS --log-failed 2>&1 | head -100
```

### Known Failure Patterns

| Error in logs | Cause | Resolution |
|---------------|-------|------------|
| `required agreement` or `license agreement` | Apple Developer Program agreement updated — must be manually accepted | Go to [developer.apple.com/account](https://developer.apple.com/account), accept the agreement, then re-run |
| `bad decrypt` | `MATCH_PASSWORD` secret is wrong or changed | Verify `MATCH_PASSWORD` in repo secrets matches the one used when Match-Secrets was created |
| `Your certificate .* is not valid` or `No valid distribution certificate` | Distribution cert expired | `ENABLE_NUKE_CERTS` is already `true` — re-run `create_certs.yml` workflow manually to force renewal |
| `No profiles for .* were found` | Provisioning profiles missing or expired | Run `add_identifiers.yml` first, then `create_certs.yml`, then re-trigger build |
| `xcode-select: error` or wrong Xcode version | Upstream updated the Xcode version in `build_iAPS.yml` but GitHub runner doesn't have it yet | Check if `build_iAPS.yml` was recently updated upstream; GitHub runners may need time to provision new Xcode |
| `error: SPM package resolution failed` | Swift Package Manager dependency fetch failure | Transient network issue on GitHub runner — re-trigger the build |
| `Unable to connect to GitHub using the GH_PAT` | `GH_PAT` secret expired | Generate a new classic PAT with `repo` + `workflow` scopes at [github.com/settings/tokens](https://github.com/settings/tokens), update secret |
| `invalid byte sequence` or `Base64` decode error | `FASTLANE_KEY` secret malformed | Re-paste the full `.p8` key content including `-----BEGIN PRIVATE KEY-----` header |

---

## 6. Manual Certificate Renewal

If certs are expired and auto-renewal didn't fire:

```bash
# Step 1: Force-run create_certs workflow
gh workflow run create_certs.yml --repo edubloop/iAPS --ref main

# Step 2: Monitor cert creation
gh run watch --repo edubloop/iAPS $(
  gh run list --repo edubloop/iAPS --workflow create_certs.yml --limit 1 --json databaseId --jq '.[0].databaseId'
)

# Step 3: Once certs are green, trigger the build
gh workflow run build_iAPS.yml --repo edubloop/iAPS --ref main
```

---

## 7. Validate Secrets

Run this first if multiple failures are occurring — it validates all required secrets in one pass.

```bash
gh workflow run validate_secrets.yml --repo edubloop/iAPS --ref main

gh run watch --repo edubloop/iAPS $(
  gh run list --repo edubloop/iAPS --workflow validate_secrets.yml --limit 1 --json databaseId --jq '.[0].databaseId'
)
```

---

## Repo Variables Reference

| Variable | Current Value | Purpose |
|----------|--------------|---------|
| `ENABLE_NUKE_CERTS` | `true` | Auto-renew expired distribution certs |
| `AUTO_BUILD_BRANCHES` | _(not set)_ | Branches that auto-build on push — intentionally off |
| `SCHEDULED_SYNC` | _(not set)_ | Whether build workflow also syncs upstream — daily sync handles this |
| `APP_IDENTIFIER` | _(not set — uses default)_ | Defaults to `ru.artpancreas.{TEAMID}.FreeAPS` |

---

## Secrets Reference

All secrets live in `edubloop/iAPS` repo settings. Required for any build:

| Secret | Purpose |
|--------|---------|
| `GH_PAT` | GitHub PAT with `repo` + `workflow` scopes — used for Match-Secrets access |
| `TEAMID` | Apple Developer Team ID (10-char alphanumeric) |
| `FASTLANE_KEY_ID` | App Store Connect API Key ID |
| `FASTLANE_ISSUER_ID` | App Store Connect Issuer ID (UUID) |
| `FASTLANE_KEY` | App Store Connect API Key content (full `.p8` file content) |
| `MATCH_PASSWORD` | Encryption password for Match-Secrets repo |
