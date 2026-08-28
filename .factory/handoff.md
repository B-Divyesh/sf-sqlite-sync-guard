# Handoff — perfection loop polish 3

Work order: sqlite-sync-guard-polish-3
Product repair: 7248574c07ca2a00eeda7e83411abc1bbfc779b2
Base reviewed: e58a0a792b8593ecd919ae5aa5d3d5720c71b78f
Live URL: https://sqlite-sync-guard.sociobot.in
Static deployment: 2a7130d5-3836-438d-b74f-7d8f4eeca85d

## Delivered

- Fixed all blocking and minor findings from review 1, review 2, and review 3.
- Kept the risograph guarded-handoff identity, while correcting the warning
  wording to say the tool warns rather than prevents.
- Made /?demo=1 a one-click entrance to the isolated banner route. Reset and
  Start for real delete only demo:sqlite-sync-guard: storage.
- Exposed the complete normalized output of the real CLI demo in a visible
  Read demo transcript disclosure. The SVG, text file, and browser transcript
  are generated together from sqlite-sync-guard demo.
- Repaired Home, Start for real, Commands, Back, and Forward focus behavior.
  Focus is announced without destroying the browser-restored scroll position.
- Expanded claims from 14 to 18. New proof covers active lock detection, WAL
  committed-only transfer consistency, independent integrity and manifest
  fields, real Resilio writes, exact sidecars, JSON errors, dev server, and
  crate packaging.
- Rewrote README manifest language, the contextless usage heading, deployment
  instructions, and the catalog line. Added automated copy-to-claim mapping.

## Verification

Fresh clean clone: /tmp/sqlite-sync-guard-polish3-Sy2jOH/repo at the repair
commit. All commands exited zero:

    npm ci
    npm run test:claims
    npm test
    npm run check
    npm run build
    npm run check:site
    npm run test:browser
    cargo package --locked

The 18 independently runnable claim tags all passed:

    demo-recording, demo-isolation, unsafe-detection, active-lock-detection,
    exit-codes-json, live-consistent-transfer, verified-transfer, ignore-rules,
    scan-read-only, offline-demo, no-telemetry, demo-reset, mit-source,
    bundled-sqlite, help-output, build-output, dev-server, package-output

Claim fixtures begin from the demo command and operate only under its reported
temporary workspace. The live-WAL test uses a separate writer with one
committed and one uncommitted row. The backup contains only the committed row.
The lock test uses a second process holding SQLite's database lock range.

The static deployment used the work-order configuration:

    npm ci
    npm run build:site
    /opt/fleet/lib/deploy-static.sh sqlite-sync-guard /work/repo/dist/site

Cold live verification passed for /, /demo/, /privacy/, /terms/, and a missing
route. HTTP results were 200, 200, 200, 200, and 404. The live Playwright
check found zero axe WCAG A/AA/2.1-AA violations, zero console errors, no
external requests, no cookies, working offline demo reload, correct route
focus, preserved Back scroll, and no 390px horizontal overflow.

The worker verify-url.sh check recorded a 676 ms live load, title, lang=en,
one h1, one main landmark, no missing image alt text, no unlabeled button, and
no console errors in .factory/evidence/live/verify-url/verify.json.

Mobile Lighthouse on the live URL scored Performance 100, Accessibility 100,
Best Practices 100, and SEO 100. FCP and LCP were 0.5 s, CLS 0, and TBT 0 ms.

Evidence:

- .factory/evidence/home-mobile-390.png
- .factory/evidence/demo-desktop.png
- .factory/evidence/live/polish-3-home-desktop.png
- .factory/evidence/live/polish-3-home-mobile-390.png
- .factory/evidence/live/polish-3-demo-desktop.png
- .factory/evidence/live/verify-url/verify.json

## Run and release

Use npm run dev for local documentation preview. Use cargo run -- demo for the
isolated CLI demo. Build with npm run build; publish dist/site with its
staticwebapp.config.json. The factory owns registry credentials; the
ready-to-publish crate command is cargo package --locked.

## Known gaps

None for the accepted scope. Linux runtime verification includes the
cross-process lock probe. macOS and Windows lock paths remain compile-covered
by CI but are not claimed as separately runtime-verified behavior.
