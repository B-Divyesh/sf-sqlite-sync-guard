# Handoff — adversarial first-read review 4

- Work order: `sqlite-sync-guard-review-4`
- Reviewed commit: `0d64fa8ca0c7ccf88fa0cb2d1a26c54b3e03f5f7`
- Live URL: <https://sqlite-sync-guard.sociobot.in>

## Delivered

- Wrote `.factory/review-4.md` with a **FAIL** verdict, complete first-read and
  copy audits, all registered claim results, full historical finding
  verification, structure/accessibility checks, and missed-leverage review.
- Recorded two fresh cold-view screenshots and the live home response under
  `.factory/evidence/review-4/`.
- Did not modify product code.

## Verification

A fresh clone at `/tmp/sqlite-sync-guard-review4-ocMzB3/repo` resolved to the
reviewed SHA. `npm ci` succeeded. All 18 commands in `.factory/claims.json`
were run individually and passed. The clean clone also passed:

```sh
npm test
npm run check
npm run build
npm run check:site
```

Live Chromium checks covered 390 × 844 and 1440 × 900 cold views, the one-click
demo, reset isolation, Start for real, offline reload, route focus and history,
all public routes, the designed 404, link crawling, console/network/cookie
inspection, reduced motion, touch targets, and axe-core on every route.

The CLI demo was also run from a new empty temporary current directory. It
created only a separate `/tmp/sqlite-sync-guard-demo-*` workspace and left the
current directory empty.

## Remaining findings

- `F-3-4` is BLOCKING again: the README's claims-completeness statement remains
  false.
- `F-4-1`: the `/?demo=1` behavior has no exact claims entry.
- `F-4-2`: the current-folder no-read privacy promise is not registered or
  fully observed by its assigned test.
- `F-4-3`: the manifest source-path privacy disclosure is not registered and
  `manifest.source` is not asserted.

See `.factory/review-4.md` for exact quotes and concrete fixes.
