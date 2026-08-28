# Perfection loop polish 4

Candidate: `0d64fa8ca0c7ccf88fa0cb2d1a26c54b3e03f5f7`  
Review: `022e366f07eb1f65f97918f22a57eb4e43f22eda`  
Work order: `sqlite-sync-guard-polish-4`

Every finding from reviews 1–4 is mapped below. “Retained” means the earlier
repair was inspected and exercised again in this round, not assumed from the
older report.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the direct job headline, named audience, one-click sample action, outcome, and three facts. | `site/test-browser.mjs`; `.factory/evidence/polish-4-home-mobile-390.png`; live `/` cold check |
| F-1-2 | Retained the real CLI demo and isolated web demo; the first action now has its own exact query-entry claim. | `@claim:demo-isolation`; `@claim:web-demo-entry`; live `/?demo=1` |
| F-1-3 | Expanded the registry to 19 exact tagged tests and made source annotations reject missing mappings. | `.factory/claims.json`; `site/test-claims.mjs`; clean-clone claim sweep |
| F-1-4 | Retained the cache-backed demo and its offline notice. | `@claim:offline-demo`; offline browser reload |
| F-1-5 | Retained “warns” wording and isolated WAL, SHM, and journal detection fixtures. | `@claim:unsafe-detection`; live `/` |
| F-1-6 | Retained separate MIT and no-telemetry claims. | `@claim:mit-source`; `@claim:no-telemetry`; live network/cookie check |
| F-1-7 | Kept unsupported platform and release-download promises removed. | `.factory/copy-audit.md`; link crawl |
| F-1-8 | Regenerated the recording from the repaired real command. | `@claim:demo-recording`; `site/public/demo-recording.txt` |
| F-1-9 | Retained exact safe, unsafe, and error exits with JSON in both positions. | `@claim:exit-codes-json` |
| F-1-10 | Retained the committed-only backup test with an open WAL writer. | `@claim:live-consistent-transfer` |
| F-1-11 | Retained independent SQLite integrity and SHA-256 verification. | `@claim:verified-transfer` |
| F-1-12 | Retained filename, manifest-field, refusal, and force assertions; added the disclosed source field. | `@claim:verified-transfer` |
| F-1-13 | Retained Syncthing and Resilio writes, preservation, idempotency, and dry run. | `@claim:ignore-rules` |
| F-1-14 | Retained the narrowed before-or-after JSON placement and parser checks. | `@claim:exit-codes-json` |
| F-1-15 | Kept the broad service/account/network promise removed. | `.factory/copy-audit.md`; source audit in `@claim:no-telemetry` |
| F-1-16 | Kept static-binary wording removed and verified bundled SQLite without `sqlite3`. | `@claim:bundled-sqlite` |
| F-1-17 | Retained the concurrent-writer safety warning as a limitation. | README; live `/terms/` |
| F-1-18 | Retained byte-for-byte read-only scan coverage. | `@claim:scan-read-only` |
| F-1-19 | Retained one otherwise-safe workspace per WAL, SHM, and journal fixture. | `@claim:unsafe-detection` |
| F-1-20 | Retained a separate process holding SQLite’s actual lock range. | `@claim:active-lock-detection` |
| F-1-21 | Kept the unproved atomic-publication sentence removed. | README copy audit; `rg 'one filesystem operation|atomic'` |
| F-1-22 | Kept detailed test-suite outcome advertising removed. | README copy audit |
| F-1-23 | Kept unproved minimum-version promises removed. | README copy audit |
| F-1-24 | Retained exact help, build, dev-server, and package claims. | `@claim:help-output`; `@claim:build-output`; `@claim:dev-server`; `@claim:package-output` |
| F-1-25 | Retained ownership wording only as a Terms disclosure. | live `/terms/` |
| F-1-26 | Retained the real demo route and risograph 404 with HTTP 404. | browser route matrix; live `/missing-polish-4` |
| F-1-27 | Retained focusable mains/headings, announcements, and scroll-preserving history focus. | `npm run test:browser`; live route/history check |
| F-1-28 | Kept required text outside opacity animation and retested immediate axe results and reduced motion. | browser axe sweep; reduced-motion assertion |
| F-1-29 | Retained route titles, descriptions, canonicals, OG/Twitter metadata, social image, favicon, Apple icon, and manifests. | browser metadata matrix; live head checks |
| F-1-30 | Retained `robots.txt` and the four-route sitemap. | `npm run check:site`; live `/robots.txt` and `/sitemap.xml` |
| F-1-31 | Updated every route’s shared header/footer to build `polish-4`. | browser shell matrix; live all-route crawl |
| F-1-32 | Retained first-visit update suppression and versioned worker updates. | `site/test-pwa.mjs`; `npm run test:browser` |
| F-1-33 | Retained “transfer backup” and “manifest” as the output terms. | `.factory/copy-audit.md` |
| F-1-34 | Retained task language on the first screen and technical detail below it. | cold screenshots; `.factory/copy-audit.md` |
| F-1-35 | Retained plain journal-file and lock wording instead of “source observations.” | README; `@claim:verified-transfer` |
| F-1-36 | Retained result-naming Copy controls. | browser accessible-name and touch-target crawl |
| F-1-37 | Retained the generated real recording instead of noun-only fixture toggles. | `@claim:demo-recording` |
| F-1-38 | Retained task-specific headings on every route. | browser heading matrix; live crawl |
| F-1-39 | Retained the split README introduction. | `.factory/copy-audit.md` |
| F-1-40 | Retained separate exit-code sentences. | `.factory/copy-audit.md`; `@claim:exit-codes-json` |
| F-1-41 | Kept the long browser-suite advertisement removed. | README copy audit |
| F-1-42 | Retained the plain 50-character home title and checked every route title. | browser title matrix; live `/` |
| F-1-43 | Retained clipboard denial reason, selection, focus, and exact recovery keys. | `site/src/main.ts`; browser source regression |
| F-2-1 | Regenerated SVG, text, and readable transcript from the real repaired demo output. | `@claim:demo-recording`; live transcript |
| F-2-2 | Retained fresh `demo --json` workspaces for CLI behavior claims; isolation now checks a sentinel current directory. | `@claim:demo-isolation`; `site/test-claims.mjs` |
| F-2-3 | Retained Home, Commands, legal, demo, and history focus/announcement behavior. | `npm run test:browser`; live keyboard check |
| F-2-4 | Replaced the partial phrase allow-list with public-copy claim annotations tied to registry IDs and exact tests. | `assertClaimCoverage()`; clean-clone claim sweep |
| F-2-5 | Retained the full shared 404 shell, local assets, metadata, manifest, and `noindex`. | browser route matrix; live 404 check |
| F-3-1 | Retained the visible disclosure with the complete normalized terminal transcript. | `@claim:demo-recording`; live `/demo/` |
| F-3-2 | Retained the context-complete “Use SQLite Sync Guard” README heading. | README heading audit |
| F-3-3 | Retained the `dist/site` deployment section and routing-config instruction. | README; `@claim:build-output` |
| F-3-4 | Repaired completeness: every public behavior annotation must resolve to a registry ID, exact command, test function, and declared location. | `assertClaimCoverage()`; all 19 clean-clone claim commands |
| F-4-1 | Added `web-demo-entry`; its browser path clicks `/?demo=1`, observes that request, lands on `/demo/`, and checks banner, recording, reset, and storage separation. | `@claim:web-demo-entry`; `.factory/evidence/polish-4-demo-mobile-390.png`; live `/?demo=1` |
| F-4-2 | Replaced the unobservable no-read promise with the exact write boundary. The test runs from a sentinel-filled CWD and compares its recursive byte snapshot before and after two demos. | `@claim:demo-isolation`; live `/privacy/` |
| F-4-3 | Registered `/privacy/` under `verified-transfer` and asserted `manifest.source` equals the canonical supplied source path. | `@claim:verified-transfer`; live `/privacy/` |

## Local evidence

- `npm run check`, `npm test`, `npm run build`, `npm run check:site`, and
  `npm run test:browser` pass.
- The production bundle is 4.1 KB JavaScript and 12.5 KB CSS; the mobile hero
  is 36.0 KB.
- Browser coverage includes route-specific titles/status/metadata, one h1 and
  main per route, shared legal links, 404, keyboard focus, history scroll,
  390 px overflow/touch targets, reduced motion, axe, no outbound requests,
  cookies, update behavior, and an offline demo reload.
- Fresh captures: `.factory/evidence/polish-4-home-desktop.png`,
  `.factory/evidence/polish-4-home-mobile-390.png`,
  `.factory/evidence/polish-4-demo-desktop.png`, and
  `.factory/evidence/polish-4-demo-mobile-390.png`.

## Deployment evidence

To be filled with the repair commit, deployment result, and post-deploy cold
verification after the clean-clone gate passes.
