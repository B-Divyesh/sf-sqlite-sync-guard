# Adversarial first-read review 3 — SQLite Sync Guard

Reviewed 2026-08-28 against repository commit
`e58a0a792b8593ecd919ae5aa5d3d5720c71b78f` and the live site at
<https://sqlite-sync-guard.sociobot.in>.

## Verdict: FAIL

The first screen and demo pass, all 14 registered claim commands exit zero,
and the ordinary quality gates pass. The release still has 13 blocking
findings because earlier findings are incomplete or have regressed. In
particular, returning to the home route does not move focus, Back discards the
previous scroll position, an earlier “prevents” overclaim remains live, and
several claim tests do not prove the exact public statements they are assigned
to. There are also four new non-blocking findings. A PASS requires zero
findings and no untested claim.

## Cold first read — before scrolling

Fresh Chromium contexts were opened at 390 × 844 and 1440 × 900. No scrolling
or interaction occurred before the visible text and screenshots were captured.

| Question | 390 px and desktop answer |
| --- | --- |
| What does it do? | It checks SQLite files before a folder is synced and can create a verified transfer backup. |
| For whom? | Developers who sync folders between computers. |
| What should I click first? | **Try it with sample data**; the adjacent text says it will show a live scan and safe export. |

The exact text that makes this pass is “Check SQLite files before folder
sync,” “For developers syncing folders between computers, it finds unsafe
files and creates a verified transfer backup,” and “Try it with sample data” /
“See a live database scan and safe export.” The mobile action was fully visible
at y=478–526. The fresh contexts had no console error or horizontal overflow.

## Blocking findings

### F-2-3 — Navigation to the home route and Commands still leaves focus on `<body>`

- **Exact location/evidence:** live `/demo/` → wordmark Home and **Start for
  real** both load `/`, set the polite route-status text to “Check SQLite files
  before folder sync,” but leave `document.activeElement === document.body`.
  Live `/privacy/` → **Commands** loads `/#commands`, scrolls to y=2050, leaves
  focus on `<body>`, and leaves the route-status region empty.
- **Code evidence:** `site/src/main.ts` calls `h1.focus()`, but the home
  `<h1 id="hero-title">` in `site/index.html` has no `tabindex="-1"`. The
  `if (!location.hash ...)` branch skips all focus and announcement work for a
  cross-route `/#commands` navigation, while `#commands` is also not focusable.
- **Why this blocks:** this is the forward-navigation case from review 2 and
  is only partly fixed. Keyboard and screen-reader visitors still receive no
  focus change on two normal navigation paths.
- **Concrete fix:** make the home h1 focusable and focus it with
  `{preventScroll:true}` on route entry. For a cross-route hash, focus and
  announce the target heading (or a focusable target section) without changing
  its scrolled position. Add live browser assertions for Demo → Home, Start for
  real → Home, and Privacy → Commands.

### F-1-27 — Back navigation moves focus but destroys restored scroll

- **Exact location/evidence:** on live `/privacy/`, the maximum mobile scroll
  position was y=239. After navigating Home and pressing Back, the route
  returned to `/privacy/` with the h1 focused but y=19 rather than y=239.
- **Code evidence:** the `back_forward` branch calls `h1.focus()` without
  `{preventScroll:true}`.
- **Why this blocks:** the original finding required Back/forward to focus and
  announce the destination **while preserving restored scroll**. The current
  repair satisfies focus but regresses scroll restoration.
- **Concrete fix:** capture the restored position and call
  `h1.focus({preventScroll:true})`; add a browser test that scrolls each route,
  navigates away, presses Back and Forward, then asserts both focus and the
  previous scroll position.

### F-1-5 — “Prevents unsafe copies” still overstates a warning tool

- **Exact quote/location:** live `/`, warning band: “Prevents unsafe copies;
  does not sync database changes.”
- **Why this blocks:** the CLI cannot prevent a user or sync client from
  copying files. It warns, exports, and can write ignore rules. The registered
  `unsafe-detection` claim proves an exit status, not prevention. This exact
  overclaim was part of F-1-5 and was supposed to become “The scan warns…”.
- **Concrete fix:** rewrite it as “Warns before unsafe copies; does not sync
  database changes.” Keep the narrower warning covered by
  `@claim:unsafe-detection`.

### F-1-9 — Exit code 1 is public but absent from the registered claim

- **Exact quotes/locations:** live `/`: “Scan exits 0 when safe, 2 when unsafe,
  and 1 on error.” README: “Exit code `1` means the scan failed.”
- **Why this blocks:** `.factory/claims.json` registers only “Scan exits 0 when
  safe and 2 when unsafe…” Although its implementation happens to assert one
  missing-path status, the claim registry does not list the public exit-1
  contract or require parseable error output. This is an incomplete repair of
  the earlier exit-code finding.
- **Concrete fix:** include exit 1 and its error-output contract in the
  `exit-codes-json` claim, then assert parseable JSON and a useful error reason
  for both documented `--json` positions.

### F-1-10 — The consistent-snapshot claim lost its registered test

- **Exact quotes/locations:** live `/`: “SQLite’s backup function captures
  committed data.” and “Capture one consistent point in time.”
- **Why this blocks:** the prior registry had `live-consistent-transfer`; the
  current registry does not. `@claim:verified-transfer` exports the demo’s
  closed database and never holds a live WAL writer open or checks committed
  versus uncommitted rows. A general Rust unit test exists, but no
  `.factory/claims.json` entry runs it for these public sentences.
- **Concrete fix:** restore a `live-consistent-transfer` entry. Its registered
  test must start from a fresh demo workspace, keep a WAL source open, commit
  one row, leave another transaction uncommitted, export, and verify the backup
  contains only committed data.

### F-1-11 — The registered integrity test trusts the product’s own manifest

- **Exact quotes/locations:** live `/`: “The tool checks the new backup before
  publishing it.” and “Verify the database and calculate its SHA-256
  checksum.”
- **Why this blocks:** `@claim:verified-transfer` only checks that the manifest
  says `integrity_check: "ok"`; it never opens the produced backup and runs an
  independent `PRAGMA integrity_check`. The independent assertion exists in a
  separate Rust test that the registered claim command does not execute.
- **Concrete fix:** make the registered claim test open the demo-produced
  backup independently, require `PRAGMA integrity_check = ok`, and continue to
  recalculate the checksum.

### F-1-12 — Several promised manifest fields are not asserted

- **Exact quote/location:** README: “The manifest records the checksum, size,
  source observations, SQLite version, and check result.”
- **Why this blocks:** the registered `verified-transfer` test asserts only
  `sha256` and `integrity_check`. It does not assert size, source observations,
  or SQLite version. The earlier finding required every named field to be
  tested.
- **Concrete fix:** either remove the untested field list or assert every named
  field against the fresh demo input, including an independently measured byte
  size and expected source observations.

### F-1-13 — Resilio rule writing is advertised but only a dry run is tested

- **Exact quote/location:** README introduction: “It can create a verified
  transfer backup and add rules for Syncthing or Resilio Sync.”
- **Why this blocks:** `@claim:ignore-rules` writes and verifies Syncthing
  rules, but invokes Resilio only with `--dry-run` and asserts that no file was
  created. It does not prove that the CLI can actually add or preserve Resilio
  rules. The earlier finding required both clients.
- **Concrete fix:** in a fresh demo workspace, run a real Resilio write, assert
  the exact marked block, preserve pre-existing content, repeat byte-identical,
  and separately retain the dry-run non-write assertion.

### F-1-19 — The sidecar claim test can pass when SHM and journal detection are broken

- **Exact claim/location:** `.factory/claims.json`: “The scan warns on WAL,
  SHM, and rollback-journal files.”
- **Why this blocks:** every loop iteration starts from the same demo workspace,
  which already contains unsafe `active-session.db-wal`. The test then adds
  `closed-project.db-wal`, `-shm`, and `-journal` cumulatively and asserts only
  exit 2. The original WAL keeps every later scan unsafe, so SHM or journal
  detection could be deleted and the test would still pass. It also never
  checks which warning was emitted.
- **Concrete fix:** use a fresh otherwise-safe demo workspace for each suffix,
  remove all pre-existing unsafe sidecars, assert exit 2, and assert that the
  JSON result names that exact sidecar kind and database.

### F-1-20 — Active-lock detection remains a public but unregistered claim

- **Exact quotes/locations:** live `/`: “The scan warns when a database has
  journal files or is in active use.” README: “Exit code `2` means a journal
  file or active lock was found.” and “`scan` reads file headers, names, and
  documented lock regions.”
- **Why this blocks:** no claim entry mentions active locks, and no registered
  claim command starts another process that holds a SQLite lock. General Rust
  tests do not replace the required claim-registry mapping. Active-lock
  detection is also part of the core brief.
- **Concrete fix:** add `active-lock-detection` to `claims.json`; from a fresh
  demo workspace, hold a real database/WAL lock in a separate process and
  assert exit 2 plus the specific active-lock explanation.

### F-1-21 — Atomic publication is still an unlisted claim

- **Exact quote/location:** README safety details: “It publishes the completed
  file in one filesystem operation.”
- **Why this blocks:** no current claim entry names atomic publication and no
  registered claim test interrupts staging to prove that a partial output is
  never published. This is the same unlisted implementation promise identified
  in review 1.
- **Concrete fix:** remove the sentence, or add an `atomic-publication` claim
  whose test interrupts before rename and verifies that only a complete backup
  can appear at the final path.

### F-1-24 — Development and packaging outcomes remain unlisted

- **Exact quotes/locations:** README: “Run `npm run dev` to start the local
  documentation site.” and “Run `cargo package --locked` to create the
  publishable crate.”
- **Why this blocks:** `help-output` and `build-output` are registered, but no
  claim entry starts and probes the dev server or runs and inspects the package.
  Review 1 explicitly required separate `dev-server` coverage for the first
  sentence; the second is another public outcome without an entry.
- **Concrete fix:** register `dev-server` and `package-output` tests that start
  the server and receive a 200, then package from a clean clone and inspect the
  crate. Alternatively remove these outcome sentences from the README.

### F-1-35 — “Source observations” remains unexplained README jargon

- **Exact quote/location:** README: “The manifest records the checksum, size,
  source observations, SQLite version, and check result.”
- **Why this blocks:** “source observations” does not tell a first-time reader
  what the manifest contains. It was named in the earlier jargon finding and
  remains unchanged.
- **Concrete fix:** split and rewrite: “The manifest records the backup’s
  checksum, size, SQLite version, and check result. It also records the journal
  files and locks found beside the source database.”

## Other findings

### F-3-1 — The demo’s essential terminal output has no readable transcript

- **Exact location:** `/` and `/demo/`, `<img src="/demo-recording.svg">`.
  The 22-word alt text summarizes the result, but the visible SVG contains the
  actual unsafe filename, WAL warning, exit instruction, backup paths, and
  cleanup instruction. `site/public/demo-recording.txt` is shipped but is not
  exposed on the page.
- **Why this matters:** a screen-reader user cannot inspect the product output
  that constitutes the CLI demo. Axe does not catch text baked into an image.
- **Concrete fix:** render the normalized transcript in an adjacent `<pre>` or
  provide a visible “Read demo transcript” disclosure linked with the figure.
  Keep the image alt concise and mark duplicate decorative text appropriately.

### F-3-2 — The README heading “Use it” fails out of context

- **Exact location/quote:** `README.md`, h2: “Use it”.
- **Why this matters:** “it” has no referent when headings are listed by a
  screen reader or shown in generated documentation navigation.
- **Concrete fix:** rename it “Use SQLite Sync Guard” or “Scan and export
  SQLite databases”.

### F-3-3 — README does not explain deployment

- **Exact location:** `README.md` has Install, Use, and Develop sections but no
  deployment section. It only says the build creates `dist/site`.
- **Why this matters:** the repository contract requires the README to say how
  to deploy. A maintainer is not told that `dist/site` is the static artifact
  or how routing configuration must accompany it.
- **Concrete fix:** add a short “Deploy” section that identifies `dist/site` as
  the publish directory, states that `staticwebapp.config.json` must ship with
  it, and notes that factory infrastructure owns the actual deployment.

### F-3-4 — README incorrectly says every public claim has a listed test

- **Exact quote/location:** README: “See `.factory/claims.json` for each public
  claim and its test.”
- **Why this matters:** the statement directs reviewers to a registry that
  omits or incompletely covers the claims identified in F-1-9 through F-1-24.
  It makes the verification surface appear more complete than it is.
- **Concrete fix:** complete the registry and its assertions first. Keep this
  sentence only after an automated copy-to-registry coverage check passes.

## Demo and sandbox verification

- The first-screen action opened `/demo/` in one click.
- At 390 × 844, the demo banner, realistic headline, and top of the generated
  terminal recording were visible without scrolling; the recording occupied
  y=603–826.
- The banner says “Demo — sample data, nothing is saved” and provides **Reset
  demo** and **Start for real**.
- Reset deleted a seeded `demo:sqlite-sync-guard:test` key, preserved a seeded
  non-demo `sqlite-sync-guard:real` key, and announced “Demo reset. The recorded
  sample is unchanged.” Start for real also left the non-demo key untouched.
- After service-worker control, `/demo/` reloaded offline with HTTP 200 and the
  demo h1. Every captured demo-flow request was same-origin.
- Running `/work/repo/target/debug/sqlite-sync-guard demo` from an empty
  temporary current directory created a separate
  `/tmp/sqlite-sync-guard-demo-*` workspace, reported one unsafe WAL sample,
  produced a backup and manifest, and left the current directory empty.
- The generated recording matches the real command after only the documented
  workspace-path normalization. F-3-1 concerns access to that text, not its
  authenticity.

## Registered claim execution

A clean clone of the remote `main` branch was created at
`/tmp/sqlite-sync-guard-review3-eQ1hTN/repo`; it resolved to the reviewed commit
`e58a0a792b8593ecd919ae5aa5d3d5720c71b78f`. `npm ci` completed, then every
listed command was invoked separately.

| Claim id | Command result | Contract result |
| --- | --- | --- |
| `demo-recording` | PASS | Proven |
| `demo-isolation` | PASS | Proven; manual temp-directory run also passed |
| `unsafe-detection` | PASS | **Not proven** — false-positive test setup, F-1-19 |
| `exit-codes-json` | PASS | Incomplete public claim text/error assertion, F-1-9 |
| `verified-transfer` | PASS | Incomplete integrity/manifest assertions, F-1-10–F-1-12 |
| `ignore-rules` | PASS | Resilio write path untested, F-1-13 |
| `scan-read-only` | PASS | Proven for the database bytes it names |
| `offline-demo` | PASS | Proven; repeated live |
| `no-telemetry` | PASS | Proven for the registered web-demo claim; repeated live |
| `demo-reset` | PASS | Proven; repeated live with a non-demo sentinel |
| `mit-source` | PASS | Proven |
| `bundled-sqlite` | PASS | Proven |
| `help-output` | PASS | Proven |
| `build-output` | PASS | Proven |

No registered command failed. The verdict still fails because a command name
and zero exit status do not prove assertions that the test does not make, and
the public claims above have no complete registry entry.

## Structure, links, privacy, and accessibility

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. An unknown route
  returns the designed risograph 404 with HTTP 404, `noindex`, shared shell,
  metadata, and a working home action.
- Every public route has `lang="en"`, one h1, one main, a route title,
  description, canonical, Open Graph/Twitter metadata, favicon, and 180 px
  Apple icon. The social card is 1200 × 630. The noindex 404 intentionally has
  no canonical.
- Every link was crawled. Internal routes and the GitHub source/issues links
  returned 200; the deliberate missing route returned 404. Every hash target
  exists. F-2-3 is about focus after the valid Commands deep link, not a dead
  target.
- `robots.txt` and `sitemap.xml` are live and list all four public routes.
- Live axe-core 4.11.0 reported zero WCAG A/AA/2.1-AA violations on all four
  public routes and the 404. The worker `verify-url.sh` reported title, lang,
  one h1, a main landmark, complete image alts, no unlabeled button, and no
  console error on `/`. F-3-1 is a content-equivalence issue outside axe’s
  automated detection.
- The production CSP is self-only for scripts, styles, images, and connections.
  The demo flow made no third-party request. Reduced-motion CSS disables the
  registration animation. All tested controls meet the 44 px target.
- The risograph folder/guard/transfer artwork, paper palette, system type, hard
  print shadows, and restrained registration motion match `.factory/design.md`
  and are distinct from a generic SaaS template.
- Built JavaScript is 3.21 KB raw (1.36 KB gzip), well below the 150/200 KB
  limits.

## Quality gates

The current checkout passed:

```text
npm test
npm run check
npm run build
npm run check:site
```

The build produced `target/release/sqlite-sync-guard` and `dist/site`.

## Complete copy audit

Counts treat a hyphenated term, path, or command name as one word. Command
lines are excluded as commands rather than sentences. The landing table also
includes headings, controls, image alternatives, and transient UI copy so
non-sentence labels are not hidden from the audit. There are no items over 22
words and no banned marketing adjectives. Terminology is consistent for
**transfer backup**, **manifest**, **journal file**, **synced folder**, and
**demo workspace**. Flags are shown in the last column.

### Landing page

| # | Words | Exact sentence or standalone copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 4 | Skip to main content | — |
| 2 | 2 | You’re offline. | — |
| 3 | 7 | This guide and its sample still work. | Registered: `offline-demo` |
| 4 | 3 | SQLite Sync Guard | — |
| 5 | 1 | Demo | — |
| 6 | 1 | Commands | — |
| 7 | 1 | Privacy | — |
| 8 | 1 | Terms | — |
| 9 | 5 | A local SQLite safety check | — |
| 10 | 6 | Check SQLite files before folder sync | — |
| 11 | 16 | For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. | Registered product behaviors |
| 12 | 5 | Try it with sample data | — |
| 13 | 8 | See a live database scan and safe export. | Registered demo behaviors |
| 14 | 1 | Free. | Registered: `mit-source` |
| 15 | 2 | Runs locally. | Registered demo/local behavior |
| 16 | 2 | No telemetry. | Registered: `no-telemetry` |
| 17 | 15 | Printed collage showing journal pages stopped before sync and a tied transfer backup leaving safely | — |
| 18 | 3 | Live files stopped. | — |
| 19 | 3 | Transfer backup ready. | — |
| 20 | 8 | Prevents unsafe copies; does not sync database changes. | Overclaim: F-1-5 |
| 21 | 10 | Never open the same writable database from two synced computers. | Safety instruction |
| 22 | 4 | 01 / Check the files | — |
| 23 | 7 | See whether files are safe to copy | — |
| 24 | 14 | The scan warns when a database has journal files or is in active use. | Active-use claim unregistered: F-1-20 |
| 25 | 6 | Its exit code works in scripts. | Registered in part: F-1-9 |
| 26 | 7 | Normalized recording from the bundled CLI demo | Registered: `demo-recording` |
| 27 | 22 | Terminal recording: the demo finds an unsafe active-session database, a safe closed-project database, and creates a transfer backup in an isolated workspace. | Text alternative only summarizes essential image text: F-3-1 |
| 28 | 4 | 02 / Make the transfer | — |
| 29 | 5 | Create a verified transfer backup | Registered: `verified-transfer` |
| 30 | 6 | SQLite’s backup function captures committed data. | Unlisted live-snapshot behavior: F-1-10 |
| 31 | 9 | The tool checks the new backup before publishing it. | Weak registered assertion: F-1-11 |
| 32 | 2 | Back up | — |
| 33 | 6 | Capture one consistent point in time. | Unlisted consistency claim: F-1-10 |
| 34 | 1 | Check | — |
| 35 | 8 | Verify the database and calculate its SHA-256 checksum. | Weak integrity assertion: F-1-11 |
| 36 | 1 | Transfer | — |
| 37 | 7 | Copy the transfer backup and its manifest. | — |
| 38 | 4 | 03 / Use the tool | — |
| 39 | 6 | Scan, export, or add ignore rules | — |
| 40 | 2 | Read-only check | — |
| 41 | 4 | Scan a synced folder | — |
| 42 | 3 | Copy scan command | Result-naming control |
| 43 | 11 | Reports database journal files and active use without changing the database. | Active-use claim unregistered: F-1-20 |
| 44 | 2 | Explicit write | — |
| 45 | 4 | Export a transfer backup | — |
| 46 | 3 | Copy export command | Result-naming control |
| 47 | 10 | Writes a checked `.backup.sqlite3` and a manifest with its checksum. | Registered: `verified-transfer` |
| 48 | 2 | Ignore rules | — |
| 49 | 6 | Keep live files out of sync | — |
| 50 | 3 | Copy ignore command | Result-naming control |
| 51 | 3 | Preserves other rules. | Registered: `ignore-rules` |
| 52 | 7 | Running it again leaves the file unchanged. | Registered: `ignore-rules` |
| 53 | 4 | Use JSON in scripts | — |
| 54 | 7 | Put `--json` before or after a command. | Registered: `exit-codes-json` |
| 55 | 12 | Scan exits 0 when safe, 2 when unsafe, and 1 on error. | Exit 1 missing from claim text: F-1-9 |
| 56 | 4 | Ready for your files | — |
| 57 | 5 | Install from the public source | — |
| 58 | 7 | Rust builds the CLI with SQLite included. | Registered: `bundled-sqlite` |
| 59 | 3 | Copy install command | Result-naming control |
| 60 | 3 | Read the source | Result-naming action |
| 61 | 5 | A local SQLite safety tool. | — |
| 62 | 7 | Built by Param Factory · v0.1.0 · build polish-2 | — |
| 63 | 5 | A newer guide is ready. | — |
| 64 | 2 | Reload update | Result-naming control |
| 65 | 1 | Copied | — |
| 66 | 9 | Could not copy because this browser denied clipboard access. | — |
| 67 | 8 | The command is selected; press Ctrl+C or Command+C. | — |

The visible recording adds the following copy. Paths are output labels rather
than sentences and remain under the same cap.

| Words | Exact recording copy | Flag |
| ---: | --- | --- |
| 11 | DEMO — isolated sample data; your files were not read or changed. | Registered: `demo-isolation` |
| 2 | UNSAFE `active-session.db` | — |
| 4 | WAL sidecar present | Claim test false positive: F-1-19 |
| 2 | SAFE `closed-project.db` | — |
| 13 | DO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live. | — |
| 9 | Close writers or run `sqlite-sync-guard export <db> --output <dir>`. | — |
| 3 | TRANSFER BACKUP CREATED | — |
| 8 | Delete this temporary workspace when you are finished. | — |

### README

| # | Words | Exact sentence, heading, or standalone copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 3 | SQLite Sync Guard | — |
| 2 | 12 | SQLite Sync Guard checks database files before you copy a synced folder. | — |
| 3 | 9 | It warns about active use and SQLite journal files. | Active-use claim unregistered: F-1-20 |
| 4 | 15 | It can create a verified transfer backup and add rules for Syncthing or Resilio Sync. | Resilio write untested: F-1-13 |
| 5 | 11 | The tool does not make writes from two synced computers safe. | Safety limitation |
| 6 | 10 | Use a transfer backup to move committed data between computers. | — |
| 7 | 4 | Try the isolated demo | — |
| 8 | 9 | The command creates a new temporary workspace from `examples/sample.sql`. | Registered: `demo-isolation` |
| 9 | 13 | It runs the real scan and export code, then prints the workspace path. | Registered: `demo-isolation` |
| 10 | 6 | The web demo is at `https://sqlite-sync-guard.sociobot.in/demo/`. | — |
| 11 | 7 | See `.factory/demo.md` for reset and isolation details. | — |
| 12 | 1 | Install | — |
| 13 | 5 | Install from the public source: | — |
| 14 | 4 | The build includes SQLite. | Registered: `bundled-sqlite` |
| 15 | 7 | It does not need the `sqlite3` command. | Registered: `bundled-sqlite` |
| 16 | 2 | Use it | Contextless heading: F-3-2 |
| 17 | 4 | Check a synced folder: | — |
| 18 | 10 | Exit code `0` means the files look safe to copy. | Registered: `exit-codes-json` |
| 19 | 12 | Exit code `2` means a journal file or active lock was found. | Active-lock claim unregistered: F-1-20 |
| 20 | 7 | Exit code `1` means the scan failed. | Missing from claim text: F-1-9 |
| 21 | 5 | Use JSON in a script: | — |
| 22 | 5 | Create a verified transfer backup: | Registered: `verified-transfer` |
| 23 | 5 | This writes `data.backup.sqlite3` and `data.backup.manifest.json`. | Registered: `verified-transfer` |
| 24 | 13 | The manifest records the checksum, size, source observations, SQLite version, and check result. | Untested fields and jargon: F-1-12, F-1-35 |
| 25 | 8 | Existing files are preserved unless you add `--force`. | Registered: `verified-transfer` |
| 26 | 7 | Keep live database files out of sync: | — |
| 27 | 10 | The command owns one marked block in the ignore file. | Registered in part: F-1-13 |
| 28 | 4 | It preserves other rules. | Registered: `ignore-rules` |
| 29 | 7 | A repeated run leaves the file unchanged. | Registered: `ignore-rules` |
| 30 | 6 | Run `sqlite-sync-guard --help` for every option. | Registered: `help-output` |
| 31 | 2 | Safety details | — |
| 32 | 9 | `scan` reads file headers, names, and documented lock regions. | Unlisted lock claim: F-1-20 |
| 33 | 9 | It does not change the database while checking it. | Registered: `scan-read-only` |
| 34 | 17 | A `-wal`, `-shm`, or `-journal` file makes the set unsafe to copy, even without a visible lock. | False-positive test setup: F-1-19 |
| 35 | 10 | `export` uses SQLite’s backup function and checks the completed file. | Incomplete claim proof: F-1-10, F-1-11 |
| 36 | 9 | It publishes the completed file in one filesystem operation. | Unlisted claim: F-1-21 |
| 37 | 13 | Never open the same writable database from two computers through a synced folder. | Safety instruction |
| 38 | 3 | Develop and verify | — |
| 39 | 10 | Run `npm run dev` to start the local documentation site. | Unlisted claim: F-1-24 |
| 40 | 9 | Run `cargo package --locked` to create the publishable crate. | Unlisted claim: F-1-24 |
| 41 | 9 | See `.factory/claims.json` for each public claim and its test. | Incorrect completeness claim: F-3-4 |
| 42 | 3 | Privacy and license | — |
| 43 | 6 | See the privacy page and terms. | — |
| 44 | 6 | MIT © 2026 Sociobot (Param Factory) | — |

## Earlier finding verification

Every earlier review and polish/handoff file was read. Each item below was
checked against both the live route and current source/test code.

| Earlier id | Live verification | Code/test verification | Result |
| --- | --- | --- | --- |
| F-1-1 | Clear headline, audience, action, outcome, three facts in both viewports | Browser/source assertions retained | Fixed |
| F-1-2 | One-click `/demo/`, banner, reset, start-real, visible sample | CLI temp workspace and `demo:` cleanup retained | Fixed |
| F-1-3 | Claims registry exists | 14 individually runnable entries | Fixed |
| F-1-4 | Offline demo reload works | `offline-demo` passes | Fixed |
| F-1-5 | “Prevents unsafe copies” remains live | Test proves warning, not prevention | **Regressed; blocking** |
| F-1-6 | Free/MIT and no-telemetry copy retained | `mit-source` and `no-telemetry` pass | Fixed |
| F-1-7 | No cross-platform binary/release promise | Source regression rejects release CTA | Fixed |
| F-1-8 | Generated real-command recording is live | Normalized comparison passes | Fixed |
| F-1-9 | Exit 1 is still public | Registry claim omits exit 1/error JSON contract | **Incomplete; blocking** |
| F-1-10 | Consistent-point/committed-data copy remains | Prior live-consistency claim entry was removed | **Regressed; blocking** |
| F-1-11 | Integrity promise remains | Registered test trusts manifest value | **Regressed; blocking** |
| F-1-12 | Five manifest fields remain public | Registered test asserts only two | **Incomplete; blocking** |
| F-1-13 | Syncthing and Resilio remain public | Only Syncthing writes; Resilio is dry-run only | **Incomplete; blocking** |
| F-1-14 | JSON placement is narrowed to before/after | Both positions parse in registered test | Fixed |
| F-1-15 | Broad service/account/network claim remains removed | No corresponding copy regression | Fixed |
| F-1-16 | Static-binary wording remains removed; bundled SQLite remains | PATH-without-sqlite test passes | Fixed |
| F-1-17 | Limitation is presented as a warning | Terms/README remain explicit | Fixed |
| F-1-18 | Read-only wording is plain | Database bytes compared around scan | Fixed |
| F-1-19 | All three sidecars remain public | Registered loop has a pre-existing unsafe WAL false positive | **Regressed; blocking** |
| F-1-20 | Active use/locks and lock regions remain public | No registered active-lock claim/test | **Incomplete; blocking** |
| F-1-21 | One-filesystem-operation promise remains | No registered interruption/atomicity test | **Incomplete; blocking** |
| F-1-22 | Detailed suite advertisement remains removed | Command list only | Fixed |
| F-1-23 | Exact minimum-version claim remains removed | No unsupported version promise | Fixed |
| F-1-24 | Dev server and package outcomes remain | Only help/build are registered | **Incomplete; blocking** |
| F-1-25 | Affiliation statement remains in Terms only | Designed Terms route is live | Fixed |
| F-1-26 | `/demo/` works; unknown URL has branded 404 | Host override and local assets retained | Fixed |
| F-1-27 | Back focuses Privacy h1 but loses restored scroll | Focus call lacks `preventScroll` | **Regressed; blocking** |
| F-1-28 | No transient axe contrast failure | Immediate live axe sweep is clean | Fixed |
| F-1-29 | Canonical/social/icon metadata present | Route source and image dimensions verified | Fixed |
| F-1-30 | Robots and sitemap return 200 | All four public routes listed | Fixed |
| F-1-31 | Shared header/footer visible on all routes | Shell source remains consistent | Fixed |
| F-1-32 | No update prompt in either fresh cold context | `hadController` guard retained | Fixed |
| F-1-33 | Transfer backup/manifest terms are consistent | Copy/source search confirmed | Fixed |
| F-1-34 | First-screen jargon was replaced | Technical terms occur after the clear introduction | Fixed |
| F-1-35 | “source observations” remains in README | No definition or rewrite | **Unfixed; blocking** |
| F-1-36 | Copy controls name each command | Browser/source labels verified | Fixed |
| F-1-37 | Obsolete fixture toggles are gone | Generated recording replaces them | Fixed |
| F-1-38 | Landing headings are task-specific | Heading outline verified | Fixed |
| F-1-39 | README opening was split | Maximum copy count is 22 | Fixed |
| F-1-40 | Exit outcomes are separate sentences | Maximum copy count is 22 | Fixed |
| F-1-41 | Long browser-test sentence removed | README audit confirmed | Fixed |
| F-1-42 | Home title uses plain words | Live title matches required pattern | Fixed |
| F-1-43 | Clipboard failure explains and selects | Source retains selection/focus fallback | Fixed |
| F-2-1 | Real normalized recording is live | `demo-recording` passes | Fixed |
| F-2-2 | Every CLI claim helper begins with `demo()` | Current runner uses demo workspaces | Fixed |
| F-2-3 | Demo/Privacy/Terms focus, but Home and Commands do not | Home h1/hashed target are not focusable | **Incomplete; blocking** |
| F-2-4 | The exact version/suite/privacy-sale claims were removed | Copy search confirmed | Fixed |
| F-2-5 | 404 has metadata, shared shell, and noindex | Live crawl/source check confirmed | Fixed |

## Missed leverage

No additional AI step is justified for a deterministic SQLite safety CLI.
The brief-implied scan, verified export, and sync-client ignore-rule paths are
all present. The findings above concern proof and accessibility of those
features, not a missing decorative feature.

## What would make this perfect

Fix the two route-navigation regressions; narrow “prevents” to “warns”; restore
complete claim entries and clean-sandbox assertions for exit 1, live snapshot
consistency, independent integrity, all manifest fields, both ignore clients,
each sidecar independently, active locks, atomic publication, the dev server,
and crate packaging; replace “source observations”; expose the demo transcript;
rename “Use it”; correct the registry-completeness statement; and document deployment. Then repeat the entire cold, demo,
claims, history, route, accessibility, offline, and copy review. There is no
PASS-adjacent exception: all findings must be gone.
