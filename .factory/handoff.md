# Handoff — SQLite Sync Guard v0.1.0

Work order: `sqlite-sync-guard-build-1`
Completed: 2026-08-27

## What shipped

- A single Rust binary with a small typed library surface:
  - `scan ROOT` recognizes SQLite headers and `-wal`, `-shm`, and `-journal`
    sets, probes SQLite database and WAL-index lock byte ranges, and returns
    exit 2 when copying is unsafe.
  - `export DATABASE --output DIR` uses SQLite's online backup API, stages the
    result, runs `PRAGMA integrity_check`, computes SHA-256, and atomically
    publishes the backup plus JSON manifest. Existing exports require
    `--force`.
  - `ignore ROOT --client syncthing|resilio` safely manages one marked ignore
    block, preserves user rules, supports `--dry-run`, and is idempotent.
  - Global `--json`, actionable errors, empty-state output, and documented exit
    codes; no prompt or network behavior.
- A responsive Vite documentation site at `dist/site` with a product-specific
  risograph system, an original 192 KB hero plus 36 KB mobile derivative, a
  keyboard-operable recorded fixture demo, copy feedback, explicit limitation
  language, privacy and terms pages, and offline service-worker shell.
- README usage/safety docs, Rust doctest, changelog, MIT license, CI for Linux,
  macOS, and Windows, cache/security headers, product brief, and visual thesis.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run check:site
cargo clippy --all-targets -- -D warnings
cargo package --locked
```

- Exact static-only build: `npm run build:site` → `dist/site/index.html`.
- Full build: `npm run build` → release binary at
  `target/release/sqlite-sync-guard` and site at `dist/site`.
- Publish-ready crate: `target/package/sqlite-sync-guard-0.1.0.crate`; verified
  with `cargo package --locked`. The factory should publish—this worker did not.

## Verification results

- `npm test`: pass — 9 active library tests, 2 CLI integration tests, and 1
  compiling doctest. One internal lock-holder helper is intentionally marked
  ignored and is launched by its parent cross-process lock test.
- Real fixtures: WAL and rollback-journal sets both detected unsafe; an export
  made while a WAL database remained open contained the committed WAL row and
  passed `integrity_check`.
- Strict Clippy: pass with `-D warnings`; `npm audit`: 0 vulnerabilities.
- Production assets: 2.3 KB JS, 10.9 KB CSS, 192 KB desktop hero, 36 KB mobile
  hero, and no font payload. Release binary: 2.84 MiB.
- Factory `verify-url.sh`: pass; one H1, `lang=en`, main landmark, complete alt
  text, no unlabeled buttons, and no browser console errors.
- axe-core 4.13 via Playwright: 0 violations on `/`, `/privacy/`, and `/terms/`.
- Lighthouse mobile (simulated throttling): Performance 99, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 2.1 s, TBT 0 ms, CLS 0.
- Playwright at 390×844: no horizontal overflow; skip link is first Tab stop;
  demo state is announced; reduced-motion duration is effectively zero; full
  page reload succeeds offline under service-worker control.

## Known gaps and next steps

- No registry package, GitHub release binaries, or production deployment were
  created; registry credentials and deployment belong to the factory. Publish
  the verified crate, attach cross-platform binaries from CI, then deploy
  `dist/site` to `https://sqlite-sync-guard.sociobot.in`.
- Windows and macOS are covered by platform-specific lock code and the CI
  matrix, but only Linux was executed in this container.
- An unwritable database cannot be probed for an exclusive byte-range lock and
  is intentionally reported as `unknown`/unsafe instead of receiving a false
  safe result.

There are no product-scope deviations. SQLite Sync Guard prevents unsafe copy
operations; it deliberately does not implement multi-writer replication,
Firefox profile merging, or a sync service.
