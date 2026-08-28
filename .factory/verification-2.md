# Independent verification 2 — PASS

Verified 2026-08-28 for work order `sqlite-sync-guard-verify-2`.

- Candidate commit: `d81d77babbe77e4a54a09ddb8de0076ccca1a1ca`
- Repository: `https://github.com/B-Divyesh/sf-sqlite-sync-guard.git`
- Live URL: `https://sqlite-sync-guard.sociobot.in/`
- Verdict: **PASS**

## Scope and clean-install gates

Verification used a fresh detached clone at the candidate SHA in
`/tmp/sqlite-sync-guard-qa-f6ZyYY`; `npm ci` ran in that clone. Product source
was not changed. The following all exited successfully:

```sh
npm ci
npm test
npm run check
npm run build
npm run check:site
npm run test:browser
cargo package --allow-dirty --locked
npm audit --omit=dev
```

- `npm test`: 9 active Rust unit tests, 2 CLI integration tests, and 1
  compiling doctest passed; the ignored lock-holder helper is run by its
  cross-process parent test.
- `npm run check`: TypeScript no-emit, `cargo fmt --check`, and
  `cargo clippy --all-targets -- -D warnings` passed.
- Exact production build generated `target/release/sqlite-sync-guard` and
  `dist/site`; the distribution check passed. Built JS is 2,928 B, CSS is
  11,601 B, desktop hero 196,492 B, mobile hero 36,842 B, and there are no
  shipped font files, all within the stated budgets.
- The source PWA regression and Chromium regression both passed. The latter
  proves release A -> release B activation, old-cache deletion, and offline
  reload with the B shell.
- `cargo package --allow-dirty --locked` packaged and verified 41 files
  (402.3 KiB / 283.7 KiB compressed). The package was installed into an
  independent Cargo root, `/tmp/sqlite-sync-guard-consumer-PzmoW3`; its binary
  reported `sqlite-sync-guard 0.1.0` and supplied useful versioned help.
- `npm audit --omit=dev` reported 0 production vulnerabilities.

## Independent CLI acceptance exercises

All exercises used the packaged-and-installed consumer binary, not the build
tree binary.

| Scenario | Fresh evidence |
| --- | --- |
| Safe/recovery scan | After the writer closed, JSON scan reported `safe: true`, `unsafe_count: 0`, and exit 0. |
| Live WAL | A separate Python SQLite writer with committed WAL data and an open immediate transaction produced exit 2, `wal` and `shm` sidecars, and `lock_state: active`. |
| Consistent export | `export --json` while that writer stayed open succeeded. The backup had `PRAGMA integrity_check = ok`, its manifest SHA-256 equalled the independently recalculated digest, and it contained `committed-wal-value` but not the uncommitted row. A copied transfer artifact also passed a new Python SQLite `integrity_check`; the `sqlite3` executable is not installed in this container. |
| Overwrite recovery | A repeat export failed exit 1 with `--force` guidance; `--force` then completed successfully. |
| Live rollback journal | A separate default-journal writer in `BEGIN IMMEDIATE` produced exit 2 with a `journal` sidecar and active lock; after the writer exited, scan was safe. |
| Ignore paths | Syncthing exclusions retained a pre-existing unrelated rule and were byte-identical on a second run; Resilio `--dry-run` did not create `.sync/IgnoreList`. |
| Invalid input | A nonexistent scan root and a non-SQLite export each exited 1 with valid `--json` error output; the latter reports `file is not a database`. |

This meets the brief's safety workflow: unsafe WAL and rollback-journal sets
were detected, and the handoff backup survives transfer with an integrity
check. The CLI never modified a live database except on the explicit `export`
command, which uses SQLite's backup API.

## Live deployment and web quality

The public deployment was tested live on 2026-08-28. SHA-256 comparisons show
it is the candidate's exact production build for `/`, `/privacy/`, `/terms/`,
the emitted JS and CSS, both hero WebPs, favicon, web manifest, and `sw.js`.
The live worker cache is release-specific:
`sqlite-sync-guard-73f532b0e32dd2e6`.

- Real Chromium on the live URL: desktop and 390 x 844 mobile loaded without
  horizontal overflow; mobile lead text is 16.96px. Keyboard Tab reaches the
  visible skip link, Enter moves focus to `main`, and Space toggles the fixture
  button with its text result. No page errors, console errors, or initial
  outbound requests were observed across home, privacy, and terms.
- The same live-browser session installed the service worker, confirmed the
  candidate cache name, went offline, and reloaded a working main landmark.
  Under `prefers-reduced-motion`, animation and transition durations are
  `1e-05s` (effectively disabled).
- The built-shell Playwright axe test found zero WCAG A/AA violations on home,
  privacy, and terms; this is the same byte-identical shell served live.
  Therefore serious and critical axe findings are zero.
- Live headers include a self-only CSP (`default-src 'self'`, self-only
  script/style/connect), HSTS, `nosniff`, strict-origin referrer policy, and
  disabled camera/microphone/geolocation. `/sw.js` is `no-cache`; hashed JS
  and CSS are `public, max-age=31536000, immutable`.
- Source and browser-request audit found no analytics, telemetry, cookies,
  third-party runtime resources, `localStorage`, `sessionStorage`, or
  IndexedDB. The only browser persistence is the same-origin Cache API needed
  for offline PWA operation. User-activated GitHub source links remain.
- Mobile Lighthouse against the live URL: Performance 92, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.1 s, LCP 2.3 s, CLS 0, TBT 310 ms.

## Defects and limits

No P0, P1, P2, or P3 defects were found.

Linux runtime verification was performed. The Windows and macOS lock-probing
implementations compile as part of the cross-platform source but were not run
on those operating systems in this container.

## Release decision

**PASS.** The candidate satisfies the researched CLI job-to-be-done and the
factory build, privacy, accessibility, PWA, packaging, and deployment
requirements. The ready-to-publish command remains `cargo package --locked`;
the factory, not this verifier, owns publishing credentials.
