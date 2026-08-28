# Handoff — perfection loop polish 4

- Work order: `sqlite-sync-guard-polish-4`
- Candidate repaired: `0d64fa8ca0c7ccf88fa0cb2d1a26c54b3e03f5f7`
- Review commit: `022e366f07eb1f65f97918f22a57eb4e43f22eda`
- Product repair/deployed commit: `7e6846c8f768bd8ca9cf4e1d73db2a48c11d52b1`
- Live URL: <https://sqlite-sync-guard.sociobot.in>

## Delivered

- Closed all cumulative findings F-1-1 through F-4-3. The complete mapping is
  in `.factory/polish-4.md`.
- Added the exact `web-demo-entry` claim. The browser now clicks the first
  action, observes `/?demo=1`, lands on `/demo/`, and verifies the persistent
  banner, real recording, Reset demo, Start for real, and storage separation.
- Replaced the CLI demo’s unobservable no-read promise with its exact write
  boundary. `@claim:demo-isolation` runs twice from a sentinel-filled current
  directory, requires distinct external workspaces, and compares the recursive
  current-directory byte snapshot before and after.
- Extended `verified-transfer` to `/privacy/` and asserted that
  `manifest.source` equals the canonical source path supplied to `export`.
- Replaced the incomplete copy allow-list with `data-claim` and README claim
  annotations. The coverage check rejects unknown IDs, undeclared locations,
  missing exact commands, missing tagged tests, duplicate IDs, unannotated
  registered claims, or an invalid catalog line.
- Rechecked and retained the direct first screen, risograph identity, real
  recording/transcript, route titles and metadata, shared shell, focus and
  history behavior, designed 404, legal links, 390 px layout, 44 px touch
  targets, reduced motion, privacy, and offline behavior.
- Updated `.factory/catalog-description.txt` to the 76-character verb-first
  sentence: “Check SQLite files before folder sync and create a verified
  transfer backup.”
- Added `npm run verify:live` as the repeatable cold production audit. No AI
  feature was added because the deterministic local safety job does not benefit
  from model inference.

## Clean-clone verification

A fresh clone at `/tmp/sqlite-sync-guard-polish4-NUB1XS/repo` resolved to
`7e6846c8f768bd8ca9cf4e1d73db2a48c11d52b1`. After `npm ci`, all 19 commands
from `.factory/claims.json` ran individually and passed:

`demo-recording`, `demo-isolation`, `web-demo-entry`, `unsafe-detection`,
`active-lock-detection`, `exit-codes-json`, `live-consistent-transfer`,
`verified-transfer`, `ignore-rules`, `scan-read-only`, `offline-demo`,
`no-telemetry`, `demo-reset`, `mit-source`, `bundled-sqlite`, `help-output`,
`build-output`, `dev-server`, and `package-output`.

The same clean clone also passed:

```sh
npm run check
npm test
npm run build
npm run check:site
npm run test:browser
cargo package --locked
```

Observed results:

- Rust: 9 unit tests passed, 1 helper ignored by design; 6 CLI integration
  tests and 1 doctest passed.
- PWA: changed releases updated correctly and the demo shell reloaded offline.
- Browser: route/status/title/metadata matrix, one h1/main per route, keyboard
  and history focus, 390 px layout, 44 px targets, reduced motion, axe,
  privacy, one-click demo, and offline behavior passed.
- Build: 4.1 KB raw JavaScript, 12.5 KB CSS, 191.9 KB desktop hero, 36.0 KB
  mobile hero; release CLI and `dist/site` produced.
- Package: `target/package/sqlite-sync-guard-0.1.0.crate`, 7.7 MiB compressed,
  verified by Cargo. Publishing remains factory-owned and was not performed.

## Deployment and live verification

The configured work-order command (`npm ci && npm run build:site`, publish
`dist/site`) deployed successfully through `/opt/fleet/lib/deploy-static.sh`.
Azure deployment ID: `db2ae2d0-052b-44c6-b81a-005721a1741e`.

Cold production evidence:

- Factory `verify-url.sh`: HTTP 200, 814 ms load, correct title/lang/h1/main,
  complete alt/button names, and no console errors. Evidence:
  `.factory/evidence/live/polish-4/verify-url/`.
- `npm run verify:live`: `/`, `/demo/`, `/privacy/`, and `/terms/` returned 200;
  `/missing-polish-4` returned the designed 404 with HTTP 404. All route titles,
  metadata, landmarks, legal links, focus paths, and eight crawled links passed.
- The live first-screen link requested `/?demo=1` and replaced it with
  `/demo/`. The banner and recording were visible at 390 px. Reset removed only
  `demo:sqlite-sync-guard:*`; Start for real and normal storage stayed isolated.
  The demo then reloaded offline from the active service worker.
- All valid routes had zero console errors, cookies, outbound runtime requests,
  or axe violations. The deliberate missing-page navigation produced only the
  expected browser network 404 message.
- Independent axe-core CLI 4.11.0: zero violations on all four public routes.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100, LCP 1,828 ms, CLS 0, total blocking time 24 ms. Evidence:
  `.factory/evidence/live/polish-4/lighthouse.json`.
- Cold screenshots:
  `.factory/evidence/live/polish-4/home-mobile-cold.png` and
  `.factory/evidence/live/polish-4/demo-mobile-cold.png`.

## How to run

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
npm run test:claims
npm run verify:live -- https://sqlite-sync-guard.sociobot.in
cargo run -- demo
```

## Known gaps and next steps

No review finding or in-scope product gap remains. Registry publication is the
only future release operation, and the factory owns it; do not publish from a
worker.
