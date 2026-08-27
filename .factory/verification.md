# Independent verification — FAIL

Verified on 2026-08-27 for work order `sqlite-sync-guard-verify-1`.

- Candidate commit: `2d1620ea53f4b4f6641f10699ea41e62f6cd4817`
- Candidate repository: `https://github.com/B-Divyesh/sf-sqlite-sync-guard.git`
- Live URL: `https://sqlite-sync-guard.sociobot.in/`
- Method: a new no-local clone, detached at the candidate commit, with fresh
  `npm ci`. Product source was not changed during this verification.

## Verdict

**FAIL.** The CLI fulfils the researched safety workflow under independent
normal, live-WAL, live-rollback-journal, malformed, overwrite, ignore-rule,
and recovery exercises. The deployed static content is byte-for-byte the
candidate build and its ordinary web quality checks pass. Two P2 defects still
prevent a release handoff from meeting the factory PWA/distribution contract.

## P2 defects

1. **PWA updates retain a stale cache-first shell indefinitely.**

   `site/public/sw.js` uses a fixed `const CACHE =
   "sqlite-sync-guard-v1"`; it always answers a matching request from that
   cache and activation deletes only differently named caches. It has no
   deployment-derived cache revision. I copied the exact built site to a
   temporary local origin, loaded it under service-worker control, then changed
   the shell title and appended a harmless revision to `sw.js` to simulate a
   deployment. `registration.update()` installed a waiting worker
   (`{"waiting":true,"active":true}`), but a subsequent visit continued to
   receive the original cached title, not `UPDATED SERVICE WORKER TEST`.
   Even after activation, the unchanged cache name leaves that stale shell in
   place. Offline reload itself passes, but the required service-worker update
   path does not.

2. **The production “Get binary” / “Download latest release” route has no
   binary to download.**

   The two CTAs point at
   `https://github.com/B-Divyesh/sf-sqlite-sync-guard/releases`. On
   2026-08-27, `GET
   https://api.github.com/repos/B-Divyesh/sf-sqlite-sync-guard/releases`
   returned HTTP 200 with `[]`: no GitHub release and no platform binary
   asset exists. The site labels the action “Download latest release,” so this
   is a non-working acquisition path. Building from the displayed `cargo
   install --git …` command remains possible, but it does not make that CTA
   functional.

## Clean-install quality gates

All of the following passed in the isolated checkout:

```sh
npm ci
npm test
npm run build
npm run check:site
cargo clippy --all-targets -- -D warnings
cargo package --locked
npm audit --omit=dev
```

- `npm test`: 9 active Rust unit tests, 2 CLI integration tests, 1 compiling
  doctest, and the site checks passed. The one ignored lock-holder helper is
  exercised by its parent cross-process lock test.
- Exact production build produced
  `target/release/sqlite-sync-guard` (2.9 MiB) and `dist/site`.
- `cargo package --locked` produced and verified
  `sqlite-sync-guard-0.1.0.crate` (273.9 KiB compressed).
- Strict Clippy passed with warnings denied; production npm audit found 0
  vulnerabilities.

## Clean consumer and end-to-end CLI evidence

The packed crate was installed into a fresh consumer prefix:

```sh
cargo install --path target/package/sqlite-sync-guard-0.1.0 --root /tmp/consumer --locked
/tmp/consumer/bin/sqlite-sync-guard --version
# sqlite-sync-guard 0.1.0
```

Using that installed binary, independent SQLite fixtures produced these
results:

| Exercise | Evidence |
| --- | --- |
| Normal/safe | A closed `safe.db` was reported safe with an available lock. |
| Live WAL | An open WAL database with committed data produced exit 2, WAL + SHM sidecars, active lock, and “DO NOT SYNC”. |
| Live rollback journal | An open `BEGIN IMMEDIATE` transaction produced exit 2, a rollback-journal sidecar, and active lock. |
| Safe export | `export live.db --output … --json` succeeded while the WAL writer remained open. The staged backup had `PRAGMA integrity_check = ok` and included `committed-wal-value`; manifest SHA-256 and integrity fields matched the output. |
| Boundary/recovery | A second export failed with exit 1 without overwrite; `--force` succeeded. After writer rollback, checkpoint, and close, rescan exited 0 with all three sets safe. |
| Ignore rules | Syncthing rules preserved an existing custom rule, first write changed the file, the second was idempotent, and Resilio `--dry-run` did not write. |
| Malformed/errors | Exporting a non-SQLite file and scanning a nonexistent root both exited 1 and returned valid `{"ok":false,…}` JSON. |

## Live deployment comparison and web checks

The live page is the candidate build, not merely visually similar. Exact byte
comparisons passed for `/`, `/privacy/`, `/terms/`,
`/assets/main-C9l3Km1X.js`, `/assets/main-BqAetxyY.css`, both WebP
images, favicon, manifest, and `/sw.js`. The deployment configuration file
is intentionally not a public URL; its configured headers are present live.

- Initial live response: HTTP 200; title, `lang=en`, one `h1`, and one
  `main` verified.
- Desktop and 390×844 mobile: no horizontal overflow. Mobile body text was
  16px. Reduced-motion animation duration was effectively zero
  (`1e-05s`).
- Keyboard: first Tab focuses the visible “Skip to main content” link; Enter
  targets `#main`. The safe/unsafe fixture buttons update their pressed state
  and textual status.
- Console/page errors: none on home, privacy, or terms. Initial network
  requests made no third-party outbound connection. Source review found no
  telemetry, analytics, third-party fonts/scripts, localStorage, or
  sessionStorage; the only persistence is same-origin Cache API for the PWA.
- axe-core/Playwright: zero violations on `/`, `/privacy/`, and `/terms/`
  (therefore zero serious/critical).
- Offline: with an active live service worker, an offline reload returned 200
  and rendered the title and main landmark without console errors.
- Security headers on HTML, JS, CSS, and SW include HSTS,
  `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy,
  and a self-only CSP with `frame-ancestors 'none'`. Hashed assets use
  `Cache-Control: public, max-age=31536000, immutable`; `sw.js` uses
  `no-cache`.
- Production payloads: JS 2,400 B, CSS 11,116 B, desktop hero 196,492 B,
  mobile hero 36,842 B, no font payload. These meet the stated JavaScript,
  CSS, and image budgets.
- Lighthouse mobile simulation on the live URL: Performance 93,
  Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.8 s,
  TBT 290 ms, CLS 0.

## Scope limits

Linux was the only OS available, so Windows and macOS lock implementations
were not executed. The CLI has platform-specific code and CI declarations, but
that is not equivalent to runtime verification on those platforms.

## Required next steps

1. Version the service-worker cache on every deploy (and ensure stale caches
   are removed after activation), then repeat online update plus offline reload
   testing.
2. Publish the already verified crate/release binaries, or remove/reword the
   download CTAs until a real release exists.
3. Re-run this verification after those changes; no product-code changes were
   made in this verification commit.
