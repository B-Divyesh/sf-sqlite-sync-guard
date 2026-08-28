# Handoff — SQLite Sync Guard repair 2

Work order: `sqlite-sync-guard-repair-2`
Candidate investigated: `2d1620ea53f4b4f6641f10699ea41e62f6cd4817`
Independent verifier report: `f37c941c1ced1c490ac6b6cd4766d72adeb2e6a5`
Completed: 2026-08-28

## Release blockers repaired

1. **PWA shell updates no longer retain the old release.** The production
   worker is generated from the emitted site and names its cache with a
   16-character SHA-256 digest of the precached release files. It precaches
   each release shell, deletes prior SQLite Sync Guard caches on activation,
   claims clients, and accepts an explicit `SKIP_WAITING` message from the
   accessible “Reload now” update notice. Navigations are network-first with a
   same-release offline fallback; assets are cache-first.

   There are two regressions: `site/test-pwa.mjs` exercises the worker lifecycle
   in a cache model, and `site/test-browser.mjs` uses pinned Chromium to install
   release A, deploy release B under the same origin, activate B, go offline,
   reload, and prove that only B’s shell/cache remains.

2. **The unavailable binary-download claim is removed.** GitHub’s releases API
   remains empty, so the site and README honestly offer the working source
   installation command instead of a `/releases` CTA:

   ```sh
   cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard
   ```

   Site source, built-dist, and browser regressions assert that no unavailable
   release route or “Download latest release” claim is present.

## Additional repair found during reproduction

The skip link previously changed the hash but left keyboard focus outside the
main landmark. `main#main` is now programmatically focusable with
`tabindex="-1"`; the Chromium regression tabs to the visible skip link, presses
Enter, and verifies focus moves into main. This preserves the visual design and
removes the keyboard dead end.

## Verification evidence

Final clean dependency installation and checks passed:

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

- Rust: 9 active unit tests, 2 CLI integration tests, and 1 compiling doctest
  passed (the lock-holder helper is intentionally ignored and exercised by its
  parent cross-process test).
- `npm run check` passed TypeScript `--strict` checking, `cargo fmt --check`,
  and `cargo clippy --all-targets -- -D warnings`.
- Production build passed. Built assets are 2.9 KB JavaScript and 11.3 KB CSS;
  the desktop hero is 191.9 KB and its mobile derivative is 36.0 KB.
- `check:site` verified all shells, budgets, no fixed cache name, and that the
  calculated PWA digest matches the generated worker. This build’s cache is
  `sqlite-sync-guard-73f532b0e32dd2e6`.
- The real Chromium test passed desktop and 390×844 mobile layout, keyboard
  fixture interaction and skip link, zero axe WCAG A/AA violations on home,
  privacy, and terms, no console errors, no outbound requests, CSP/nosniff
  response policy, no unavailable download CTA, and the A→B offline PWA
  update: `73f532b0e32dd2e6 → 7ddfeb9a6fc16bff`.
- `cargo package --allow-dirty --locked` packaged and verified 40 files
  (400.1 KiB / 283.0 KiB compressed). It was installed from
  `target/package/sqlite-sync-guard-0.1.0` into a fresh temporary Cargo root;
  the consumer binary reported `sqlite-sync-guard 0.1.0` and its helpful usage
  text and documented exit codes.
- `npm audit --omit=dev` reported 0 production vulnerabilities.

Before this repair push, the configured live URL was checked for identity and
response policy: it served the repaired source-install shell, its generated
digest worker, no release CTA, self-only CSP, HSTS, `nosniff`, referrer policy,
and permissions policy. The static deployment is triggered by the committed
`main` branch using `site/public/staticwebapp.config.json`; live identity is
rechecked after the push below.

## Run and publish

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
cargo package --locked
```

`npm run build` produces the CLI at `target/release/sqlite-sync-guard` and the
static deployment artifact at `dist/site`. The factory owns registry/release
credentials, so no crate or GitHub release was published. `cargo package
--locked` produces the ready-to-publish crate once the tree is committed.

## Known limits

Linux runtime verification was available. CI retains Linux, macOS, and Windows
build/test coverage, but lock behavior was not executed on macOS or Windows in
this container. Prebuilt binary downloads will remain intentionally absent
until the factory publishes tested release assets.
