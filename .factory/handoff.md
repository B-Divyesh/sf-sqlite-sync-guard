# Handoff — SQLite Sync Guard repair

Work order: `sqlite-sync-guard-repair-1`
Base reviewed: `f37c941c1ced1c490ac6b6cd4766d72adeb2e6a5`
Completed: 2026-08-27

## What changed

- The service worker is now generated after Vite emits `dist/site`. Its cache
  name is `sqlite-sync-guard-<16-char SHA-256>` where the digest covers every
  precached release file and its bytes (excluding the generated worker and
  deployment config). A content change therefore produces a new cache name.
- The worker precaches the three document shells and static assets, uses
  network-first navigation with a same-release cached fallback, cache-first
  assets, deletes older SQLite Sync Guard caches on activation, and claims
  clients. A waiting update is presented as an accessible “Reload now” toast;
  the user action sends `SKIP_WAITING` before reload.
- `site/test-pwa.mjs` is an exact regression: it creates two distinct release
  directories, generates both workers, activates A, then replaces it with B.
  While offline, the activated B worker serves the **Build B shell** and the A
  cache is absent. `site/check-dist.mjs` independently asserts that the final
  build's digest and generated cache identifier match.
- GitHub's releases API returned `[]`, and no GitHub publishing credentials or
  release CLI are present. In accordance with the library-publishing contract,
  no release was fabricated or published. The site and README now truthfully
  say that prebuilt binaries are not published and point to the usable,
  copyable source install command:

  ```sh
  cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard
  ```

  There are no `/releases` download CTAs left.
- The manifest now has standalone metadata, a version-query start URL, and
  project-owned SVG icons declared for 192/512, including a maskable icon.

## Verification

Ran from a fresh `npm ci` dependency install:

```sh
npm test
npm run build
npm run check:site
cargo clippy --all-targets -- -D warnings
cargo package --allow-dirty --locked
```

All passed. The final static build is 2.9 KB JavaScript and 11.3 KB CSS; both
are within the static performance budgets. The PWA regression output was:

```text
PWA update regression passed: build 4ecc8e834e1af636 → 7ecdacc8307e613f serves Build B shell offline
```

The package was independently installed from
`target/package/sqlite-sync-guard-0.1.0` into a fresh temporary Cargo root.
The installed executable reported `sqlite-sync-guard 0.1.0`; `--help` shows
the documented safety boundary and exit codes.

Live baseline checks confirmed the GitHub releases API is empty. The deployed
site must be allowed to receive this static-docs commit before its live shell
and CTAs can be rechecked; this worker does not alter deployment infrastructure
or publish GitHub releases.

## Remaining factory actions

- Standard static-docs deployment should publish `dist/site` from this commit.
  Re-run browser/axe/Lighthouse and an online A→B registration update after it
  is live. The local regression verifies the same worker lifecycle and offline
  cache replacement deterministically.
- To offer downloads later, create a GitHub release with checked cross-platform
  binary assets, then change the truthful source-install CTAs deliberately.
  The ready-to-publish crate is produced by `cargo package --locked` after the
  tree is committed.
- Linux was the only runtime available. Existing CI continues to cover the
  Rust build on Linux, macOS, and Windows.
