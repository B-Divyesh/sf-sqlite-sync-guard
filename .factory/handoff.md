# Handoff — perfection loop polish 1

Work order: `sqlite-sync-guard-polish-1`  
Repair commit: `150db5032d3eb725f1a95e72bea0fe80d8679537`  
Live URL: <https://sqlite-sync-guard.sociobot.in>  
Deployed: 2026-08-28

## Outcome

All findings F-1-1 through F-1-43 in `.factory/review-1.md` are resolved. The complete finding-to-change-to-evidence map is in `.factory/polish-1.md`.

The product remains a Rust CLI with a Vite static documentation site. Its risograph field-manual identity, original art, paper palette, and print interaction grammar remain intact.

## Delivered

- Replaced the first screen with a plain job, named audience, one-click sample action, expected result, and three short facts.
- Added `sqlite-sync-guard demo`. Each run creates unique temporary SQLite samples, runs the production scanner and exporter, and prints its workspace.
- Added `/demo/` and `?demo=1`, a persistent isolation banner, demo-only storage namespace, reset, and start-real exit.
- Added `.factory/claims.json` with 14 executable claim tests and the `npm run test:claims` runner.
- Added consistent `/`, `/demo/`, `/privacy/`, `/terms/`, and branded 404 shells with focus handling, route titles, canonical/social metadata, self-hosted social art, robots, and sitemap.
- Rewrote landing, CLI help, README, errors, buttons, headings, and policy copy in plain words. Output terminology is now “transfer backup” and “manifest.”
- Removed text opacity animation, fixed first-visit update prompting, preserved 390 px layout, and kept visible focus and reduced-motion behavior.

## Clean-clone verification

Fresh clone: `/tmp/sqlite-sync-guard-clean-MUJpJ3`, detached from local state at repair commit.

All commands passed:

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
npm run test:claims
npm audit --omit=dev
cargo package --locked
```

Evidence:

- Rust: 9 active unit tests, 6 CLI integration tests, and 1 doctest passed. The ignored helper is executed by its cross-process parent.
- Claims: all 14 registry entries passed from the fresh clone, including live-WAL export, all journal types, checksum/integrity, overwrite, ignore rules, isolation, privacy, reset, and offline operation.
- Browser: desktop and 390 px mobile, keyboard activation, immediate/steady axe, same-origin requests, service-worker A→B update, and offline demo reload passed.
- Build: 4.33 KB JavaScript and 13.16 KB CSS uncompressed; hero 191.9 KB and mobile hero 36.0 KB.
- Supply chain: production npm audit found 0 vulnerabilities. `cargo package --locked` verified the publishable crate.

## Deployment and cold live checks

The factory static deploy completed successfully to the existing Azure Static Web App. The custom domain returned HTTPS 200.

- `/`, `/demo/`, `/?demo=1`, `/privacy/`, `/terms/`, `/robots.txt`, and `/sitemap.xml` passed. An unknown route returned the branded page with HTTP 404.
- A fresh Chromium context followed `?demo=1` to `/demo/`, changed and reset the sample, and confirmed the demo key was removed.
- All four valid routes had one h1, one main, working skip focus, no mobile overflow, no outbound requests, and no console errors.
- Live axe found 0 serious or critical issues on all valid routes and the 404.
- A fresh service-worker context reloaded `/demo/` offline and operated the sample.
- `/opt/fleet/lib/verify-url.sh` passed with title, `lang=en`, one h1, main, alt text, zero console errors, and an 857 ms cold load.
- Live Lighthouse desktop: Performance 100, Accessibility 100, Best Practices 100, SEO 100.

Evidence is in `.factory/evidence/`, including live desktop/mobile/demo screenshots, `verify.json`, and `lighthouse.json`.

## Run and publish

```sh
cargo run -- demo
npm run dev
cargo package --locked
```

The factory owns registry publication. No crate was published from this worker.

## Known gaps

None found after the final cold live pass.
