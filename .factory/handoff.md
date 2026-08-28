# Handoff — adversarial review 1

Work order: `sqlite-sync-guard-review-1`

Reviewed commit: `1845efbf64cc34127ab99a5cb133791cc38b1b18`

Live URL: `https://sqlite-sync-guard.sociobot.in`
Date: 2026-08-28

## Outcome

**FAIL.** The complete report is in `.factory/review-1.md`. No product code was
changed.

Primary blockers are the unclear cold first screen, missing one-click CLI demo
and sandbox, missing `.factory/claims.json` and tagged claim tests, unbranded
Azure `/demo`/404 routing, a legal-route skip-link focus regression, and
transient sub-AA contrast during the initial text reveal.

## Verification performed

- Fresh 390×844 and 1440×900 live browser contexts, before scrolling.
- Full landing/README copy inventory with word counts and proposed rewrites.
- `/demo`, `/?demo=1`, fixture controls, storage state, request interception,
  service-worker offline reload, Back behavior, skip links, reduced motion,
  touch targets, console, metadata, 404, and link crawl.
- `/opt/fleet/lib/verify-url.sh` against the live site: passed its basic checks.
- axe-core 4.11.0 through Playwright on `/`, `/privacy/`, and `/terms/`:
  steady-state clean; immediate-load home found the contrast defect documented
  as F-1-28. The standalone axe CLI was attempted but its webdriver integration
  errored, so the same engine was executed through Playwright.
- Fresh clone at the reviewed SHA: `npm ci`, `npm test`, `npm run build`,
  `npm run check:site`, and `npm run test:browser` all passed.
- `sqlite-sync-guard demo` and `sqlite-sync-guard --demo` in an empty temporary
  directory both failed as unsupported, confirming the demo blocker.
- Historical handoff/verification findings were rechecked. PWA cache revisioning
  and removal of unavailable binary CTAs are fixed. Skip-link focus is fixed
  only on home and remains broken on Privacy and Terms.

## Known limits

- No claim tests could be run because the required claims registry is absent.
- This review did not modify or deploy the product, per the reviewer work order.
- The standalone axe CLI failure is a tool integration issue; the equivalent
  local axe engine completed through Playwright and its result is recorded.

## Next step

Repair every finding in `.factory/review-1.md`, add the real demo and claims
contract first, deploy, and rerun the entire adversarial checklist from a fresh
browser and clean clone.
