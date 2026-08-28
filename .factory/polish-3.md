# Perfection loop polish 3

Repair commit: 7248574c07ca2a00eeda7e83411abc1bbfc779b2.
Base review: 8c21eb7d484810e4669916ec07e1c457c669fdc8.
Deployment: https://sqlite-sync-guard.sociobot.in (deployment 2a7130d5-3836-438d-b74f-7d8f4eeca85d).

The live cold check passed on 2026-08-28. It covers home, demo, privacy,
terms, and a missing route; zero axe violations; focus, history, reset,
same-origin requests, offline reload, 390px layout, and no console errors.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the direct job headline, named audience, sample action, outcome, and three facts. | site/test-browser.mjs; live home screenshot |
| F-1-2 | Retained the isolated CLI demo and made the first action enter /?demo=1 before the banner route. | @claim:demo-isolation; live demo check |
| F-1-3 | Expanded the registry to 18 precise claims and asserted every registered tag exists. | @claim:all; test-claims coverage check |
| F-1-4 | Retained the cache-backed offline demo flow. | @claim:offline-demo; live offline reload |
| F-1-5 | Replaced Prevents unsafe copies with Warns before unsafe copies. | source check; @claim:unsafe-detection; live home |
| F-1-6 | Retained MIT and no-tracking evidence; browser now checks all routes, same-origin requests, and cookies. | @claim:mit-source; @claim:no-telemetry |
| F-1-7 | Kept unproved cross-platform and release-download promises removed. | copy audit; link crawl |
| F-1-8 | Retained a normalized recording generated from the real demo command. | @claim:demo-recording |
| F-1-9 | Registered exit 1 and asserted useful JSON errors for safe, unsafe, and missing roots in both flag positions. | @claim:exit-codes-json |
| F-1-10 | Restored a live WAL consistency claim using a committed and uncommitted writer fixture. | @claim:live-consistent-transfer |
| F-1-11 | Opened the shipped demo backup independently and ran integrity_check before checking its digest. | @claim:verified-transfer |
| F-1-12 | Asserted manifest byte size, SQLite version, source database observations, checksum, and integrity result. | @claim:verified-transfer |
| F-1-13 | Added real Resilio writes with preservation and idempotency, plus retained dry-run coverage. | @claim:ignore-rules |
| F-1-14 | Retained both documented JSON flag positions and JSON parsing. | @claim:exit-codes-json |
| F-1-15 | Kept the broad service, account, and network promise removed. | copy audit |
| F-1-16 | Retained the bundled SQLite test and removed the static-binary promise. | @claim:bundled-sqlite |
| F-1-17 | Retained the explicit concurrent-writer safety warning. | README and Terms live check |
| F-1-18 | Retained byte-for-byte read-only scan coverage. | @claim:scan-read-only |
| F-1-19 | Rebuilt sidecar coverage with one fresh, otherwise-safe demo workspace per suffix and exact JSON assertions. | @claim:unsafe-detection |
| F-1-20 | Registered and tested a separate process holding SQLite's actual database lock range. | @claim:active-lock-detection |
| F-1-21 | Removed the unproved one-filesystem-operation publication statement. | README copy audit |
| F-1-22 | Kept detailed suite outcome advertising removed. | README copy audit |
| F-1-23 | Kept unproved version minimums removed. | README copy audit |
| F-1-24 | Added runnable dev-server and exact cargo package claims. | @claim:dev-server; @claim:package-output |
| F-1-25 | Kept ownership and endorsement wording in Terms. | live Terms check |
| F-1-26 | Retained the configured product 404 shell and response override. | live missing route HTTP 404 |
| F-1-27 | Home and Commands have focusable targets; route focus uses preventScroll and browser history preserves scroll. | site/test-browser.mjs; live mobile history check |
| F-1-28 | Kept required text outside the decorative reveal. | immediate browser axe sweep |
| F-1-29 | Retained canonical, social, icon, and theme metadata. | route metadata crawl |
| F-1-30 | Retained robots and sitemap routes. | live route crawl |
| F-1-31 | Retained the shared header, footer, links, version, and factory credit. | route shell crawl |
| F-1-32 | Retained first-visit update suppression and versioned worker cache. | PWA regression |
| F-1-33 | Retained transfer backup and manifest terminology. | copy audit |
| F-1-34 | Retained plain first-screen language and technical details below it. | cold home check |
| F-1-35 | Replaced source observations with journal files and locks found beside the source database. | README; @claim:verified-transfer |
| F-1-36 | Retained result-naming Copy controls. | browser accessible-name check |
| F-1-37 | Retained result-naming sample controls by using the real generated recording. | browser route check |
| F-1-38 | Retained task-specific headings. | heading crawl |
| F-1-39 | Retained a split README introduction. | copy audit |
| F-1-40 | Retained separate exit-code sentences. | copy audit |
| F-1-41 | Retained short test documentation. | copy audit |
| F-1-42 | Retained the plain-language home title. | verify-url report |
| F-1-43 | Retained the clipboard selection and reason fallback. | browser source regression |
| F-2-1 | Retained the generated real-command SVG and now exposes its complete text transcript. | @claim:demo-recording; live transcript |
| F-2-2 | Every CLI behavior claim begins from demo --json and operates only under its returned workspace. | test-claims.mjs; clean-clone claim run |
| F-2-3 | Added focusable home and Commands headings; same-origin links announce focus without disrupting hash scroll. | browser navigation regression; live focus check |
| F-2-4 | Added the remaining dev/package claims and an automated public-copy-to-registry mapping. | test-claims coverage check |
| F-2-5 | Retained complete metadata, shell, and noindex on the designed 404. | live missing-route metadata crawl |
| F-3-1 | Added a visible Read demo transcript disclosure backed by the generated normalized CLI output. | live demo transcript; browser assertion |
| F-3-2 | Renamed the README heading to Use SQLite Sync Guard. | README heading audit |
| F-3-3 | Added a Deploy section naming dist/site, staticwebapp.config.json, and factory deployment ownership. | README; @claim:build-output |
| F-3-4 | Added copy-to-claim coverage assertions before retaining the registry statement. | test-claims.mjs coverage check |

## Evidence

- Fresh clone: /tmp/sqlite-sync-guard-polish3-Sy2jOH/repo at 7248574.
  npm ci, all 18 claim commands, npm test, npm run check, npm run build,
  npm run check:site, npm run test:browser, and cargo package --locked passed.
- Local browser evidence: .factory/evidence/home-mobile-390.png and
  .factory/evidence/demo-desktop.png.
- Live evidence: .factory/evidence/live/polish-3-home-desktop.png,
  .factory/evidence/live/polish-3-home-mobile-390.png,
  .factory/evidence/live/polish-3-demo-desktop.png, and
  .factory/evidence/live/verify-url/verify.json.
- Live URL checks: /?cold=polish3-live, /demo/, /privacy/, /terms/, and
  /missing-polish3-live. Results were 200, 200, 200, 200, and 404.
