# Definition of Done

A PR is not done until every applicable item below is checked.
Delete inapplicable items; do not leave unchecked items that don't apply.

---

## Code

- [ ] Implementation matches the acceptance criteria in the spec / issue
- [ ] No TODO / FIXME / HACK comments introduced without a linked issue
- [ ] No hard-coded secrets, credentials, or absolute local paths
- [ ] No dead code introduced

## Tests

- [ ] New behaviour has a unit test
- [ ] Edge cases and error paths are tested
- [ ] All existing tests pass locally (`npm run test`)
- [ ] Test names describe the scenario, not the implementation

## Code quality

- [ ] Lint passes with zero new warnings (`npm run lint`)
- [ ] Type checker passes with zero errors (`npm run typecheck`)
- [ ] Formatter has been run (`npm run format`)
- [ ] Pre-commit hooks pass (automatic on commit; hooks installed via `npm install`)

## CI

- [ ] All required CI checks are green
- [ ] Any advisory CI checks (`continue-on-error: true`) have been reviewed;
      new failures are understood and not caused by this PR

## Documentation

- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Public API or user-facing behaviour is documented (if changed)
- [ ] `README.md` updated (if setup steps, config, or usage changed)

## Security

- [ ] No new dependencies introduced without reviewing their CVE status (`npm audit`)
- [ ] If new network requests: endpoint, data sent, and auth method are intentional
      (approved external APIs: Wikimedia Commons, Library of Congress, Europeana, Open-Meteo, Nominatim)
- [ ] If new local storage: what is stored and why is documented
      (AsyncStorage key `timeguesser.settings.v1` — must not change; breaks user data)

## TimeGuesser-specific

- [ ] Scoring constants in `constants/scoring.ts` and `lib/scoring.ts` are unchanged
      (or change is intentional and explicitly approved — see `AGENTS.md` hard constraints)
- [ ] Design system tokens used — no hard-coded color, spacing, or typography values

<!-- Safety-critical section: NOT APPLICABLE — TimeGuesser is Tier 1, non-safety-critical. -->
<!-- If this project ever adds safety-critical modules, restore the section below.          -->
<!--
## Safety-critical (apply if PR touches safety-critical paths)

- [ ] Safety impact section completed in PR description
- [ ] Algorithm constants / calibration values are intentionally changed and justified
- [ ] Second reviewer has signed off on the safety impact section
- [ ] Regression test added or referenced
-->

## Review

- [ ] PR description explains _why_, not just _what_
- [ ] PR is scoped to one concern
- [ ] Reviewer comments are resolved or explicitly acknowledged
- [ ] PR author has self-reviewed the diff before requesting review
