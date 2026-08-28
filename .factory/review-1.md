# Adversarial first-read review 1 — SQLite Sync Guard

Reviewed 2026-08-28 against commit `1845efbf64cc34127ab99a5cb133791cc38b1b18`
and the live site at `https://sqlite-sync-guard.sociobot.in`.

## Verdict: FAIL

There are blocking findings. The cold first screen does not identify its
audience or offer a sample-data action; the required demo and claims registry
do not exist; the live `/demo` and unknown routes use an unbranded Azure 404;
legal-page skip links and route focus fail; and the hero reveal briefly drops
text contrast below WCAG AA. Every claim-like sentence is unlisted because
`.factory/claims.json` is absent.

## Cold first read, before scrolling

Fresh Playwright contexts were opened at 390×844 and 1440×900. No scrolling or
interaction occurred before recording the visible content.

| Question | 390px answer | Desktop answer |
| --- | --- | --- |
| What does it do? | Unclear without decoding “mid-sentence,” “WAL,” “SHM,” and “handoff artifact.” My best guess was that it checks whether SQLite files are safe to copy and can produce another file. | The same guess; the wider layout does not add explanatory copy above the fold. |
| For whom? | Cannot answer. No audience is named. | Cannot answer. No audience is named. |
| What should I click first? | “Install from source” is the only prominent action. There is no try-first action. | “Install from source” is the only prominent action. There is no try-first action. |

Exact text that failed the test: headline, “Don’t sync a database
mid-sentence.”; support, “Live SQLite, WAL, and SHM files are a set—not
ordinary documents. Catch unsafe copies, then make one clean handoff
artifact.”; action, “Install from source.” Both captures also showed “A new
guide is ready” / “Reload now” on this fresh visit.

## Blocking findings

### F-1-1 — The first screen fails all three mandatory questions

- **Location/quote:** `/`, above the fold: “Don’t sync a database
  mid-sentence.” and “Live SQLite, WAL, and SHM files are a set—not ordinary
  documents. Catch unsafe copies, then make one clean handoff artifact.”
- **Why this blocks:** the headline is a metaphor, the audience is absent, and
  installation is presented before a visitor can try or understand the tool.
- **Concrete fix:** use “Check SQLite files before folder sync” as the headline;
  add “For developers syncing folders between computers, it finds files that
  are unsafe to copy and creates a safe transfer backup.”; make “Try it with
  sample data” primary and state beside it, “See a live database scan and safe
  export.” Add the three facts “Free.”, “Runs locally.”, and “No telemetry.”

### F-1-2 — There is no one-click, isolated demo

- **Location/evidence:** no “Try it with sample data” action exists. `/demo`
  returns 404. `/?demo=1` returns the ordinary landing page. The page only
  swaps hard-coded safe/unsafe terminal strings. In an empty temporary
  directory, `sqlite-sync-guard demo` and `sqlite-sync-guard --demo` both exit
  2 as unrecognised input. There is no `examples/` sample or
  `.factory/demo.md`.
- **Why this blocks:** a visitor cannot run the real CLI job without installing
  it and preparing their own database. There is no banner, Reset, Start for
  real, sandbox namespace, or proof that sample actions cannot touch real
  data.
- **Concrete fix:** ship realistic safe and live-WAL fixtures under
  `examples/`; add `sqlite-sync-guard demo` that copies them into a newly
  created temporary directory, runs the real scan/export path, and prints that
  directory; record that real command on the landing page. `/demo` must open
  the sample result immediately with “Demo — sample data, nothing is saved,”
  “Reset demo,” and “Start for real.” Document it in `.factory/demo.md` and the
  README.

### F-1-3 — The claims registry and claim tests are absent

- **Location/evidence:** `.factory/claims.json` does not exist and `rg
  '@claim:'` finds no tests. The clean-clone `npm test` suite passes, but it is
  not a claims suite.
- **Why this blocks:** none of the statements below has the required mapping
  from copy to one observable, clean-sandbox test. A passing general suite
  cannot substitute for the contract.
- **Concrete fix:** create `.factory/claims.json`; give every retained claim
  below one entry and one exactly tagged `@claim:<id>` test. Run every entry
  through only the bundled CLI demo fixture and `/demo`.

The following are individual unlisted-claim findings. Exact duplicate claims
on the landing page and README may share one registry entry if its `where`
lists every occurrence. For every finding F-1-4 through F-1-25, the visitor is
misled because the sentence presents behavior as dependable while no registry
entry or clean demo test proves it; the last column gives the concrete remedy.

| ID | Exact quote(s) and location | Required fix/test |
| --- | --- | --- |
| F-1-4 | Landing offline notice: “The guide and demo still work; release downloads need a connection.” | Remove “release downloads” because none are offered. Add `@claim:offline-demo` that loads `/demo`, goes offline, reloads, and operates the sample. |
| F-1-5 | Landing: “Catch unsafe copies, then make one clean handoff artifact.”; “This tool prevents unsafe file copies.” README: “It finds SQLite databases and their WAL, SHM, and rollback-journal companions, reports active SQLite locks, makes a consistent backup with a transfer manifest, and can write ignore rules for Syncthing or Resilio Sync.”; “It prevents unsafe file copying.” | Rewrite to “The scan warns when SQLite files are unsafe to copy.” Add a live-WAL and rollback-journal fixture test that asserts exit 2 and the warning. Split the long README sentence as proposed in F-1-39. |
| F-1-6 | Landing: “Free, open source, no telemetry.” README: “The project performs no telemetry and the docs site loads no third-party scripts, fonts, or analytics.” | Split the claims. Verify MIT/source status from shipped files and add a full demo-flow request interception test asserting same-origin requests only and no telemetry calls. |
| F-1-7 | Landing: “Build from the public source on Linux, macOS, or Windows; prebuilt binaries are not published yet.” README: “SQLite Sync Guard is a small, cross-platform preflight for developers who sync folders between computers.”; “Prebuilt binaries are not published yet.” | Add clean Linux, macOS, and Windows install/run jobs and an API check for release assets, or narrow the platform copy to what is executed. |
| F-1-8 | Landing recorded fixture: “UNSAFE profiles/session.db”; “WAL sidecar present”; “shared-memory sidecar present”; “active SQLite lock detected”; “DO NOT SYNC — 1 of 1 database set is unsafe to copy live.” Safe state: “SAFE profiles/session.db”; “SAFE — 1 database set has no sidecars or active locks.” | Replace the hard-coded strings with output recorded from the bundled demo command. Add `@claim:detect-live-set` and `@claim:detect-closed-set`; assert files, locks, counts, and exits 2/0. |
| F-1-9 | Landing: “Sidecars and lock bytes are explained in plain language, with stable exit codes for automation.”; “Exit 0 is safe, 2 is unsafe, and 1 means the check was incomplete.” README: “Exit code `0` means no unsafe live sets were found, `2` means at least one database has a sidecar or active lock, and `1` means the scan could not be completed.” | Add `@claim:scan-exit-codes` that produces safe, unsafe, and invalid cases and asserts 0/2/1 plus their messages. |
| F-1-10 | Landing: “The online backup API reads a consistent snapshot while your app can keep running.”; “SQLite’s supported backup mechanism captures one consistent point in time.” README: “Create a consistent, integrity-checked handoff artifact:”; “The backup is a handoff snapshot.” | Add `@claim:live-consistent-export`: export while a WAL writer is open, assert committed content exists and uncommitted content does not, transfer the file, and reopen it. |
| F-1-11 | Landing: “The staged copy must pass integrity_check before it is published.”; “The new database passes integrity check and gets a SHA-256 digest.” | Add `@claim:verified-export` that independently runs `PRAGMA integrity_check`, recalculates SHA-256, and compares the manifest. |
| F-1-12 | Landing: “Writes a verified `.backup.sqlite3` plus a digest-bearing manifest.” README: “This writes `data.backup.sqlite3` and `data.backup.manifest.json`.”; “The manifest contains the SHA-256 digest, byte length, source observations, SQLite version, and integrity result.”; “Existing exports are never overwritten unless `--force` is supplied.” | Add `@claim:export-files` for exact names/fields and `@claim:no-overwrite` for refusal followed by successful `--force`, or split the copy into matching claim entries. |
| F-1-13 | Landing: “Owns one marked block.”; “Existing rules stay intact; repeated runs are idempotent.” README: “The command manages one clearly marked block in `.stignore` or `.sync/IgnoreList`; unrelated rules are preserved and repeat runs are idempotent.” | Add `@claim:ignore-rules` that checks both clients, preservation, a byte-identical repeat run, and dry-run non-writing behavior. |
| F-1-14 | Landing: “Add `--json` anywhere.” README: “Use JSON for scripts:” | Add `@claim:json-output` that invokes `--json` in every documented position and parses stdout as JSON. If “anywhere” is not literal, narrow it. |
| F-1-15 | Landing: “No service, account, or network required.” | Run the bundled demo command with network syscalls denied and no credentials/environment; assert the complete scan/export succeeds. |
| F-1-16 | Landing: “One static binary.”; “Bundled SQLite.” README: “SQLite is bundled into the binary; a system SQLite installation is not needed.” | Add `@claim:self-contained-binary` in a clean container without the `sqlite3` executable and assert the installed CLI completes the demo. Remove “One static binary” unless static linkage is actually checked. |
| F-1-17 | Landing: “It does not make two SQLite writers safe.” README: “It does **not** make concurrent SQLite writes across devices safe, merge profiles, or replace a replication system.”; “Never open the same writable database from two machines through a file-sync folder.” | Keep the limitation but register it with scope tests/document checks, or phrase it as a warning rather than an untested product assertion. |
| F-1-18 | Landing: “Reads headers, sidecar names, and lock regions.”; “It never connects to SQLite.” README: “`scan` reads headers and metadata only.”; “It does not connect to a database or trigger journal recovery.” | Add `@claim:scan-read-only` that snapshots file bytes/timestamps, runs scan, checks no SQLite open/recovery writes, and compares the filesystem. |
| F-1-19 | Landing: “Live SQLite, WAL, and SHM files are a set—not ordinary documents.” README: “A matching `-wal`, `-shm`, or `-journal` file is treated as unsafe to copy, even if no process lock is visible.” | Rewrite the first sentence in plain words. Add `@claim:any-sidecar-unsafe` with WAL, SHM, and rollback-journal fixtures lacking a visible lock. |
| F-1-20 | README: “Lock probes use SQLite’s documented lock-byte regions on the database and WAL shared-memory files.” | Add `@claim:lock-regions` with process-held database and WAL shared-memory locks on every claimed operating system. |
| F-1-21 | README: “`export` is the only command that opens a database.”; “It uses SQLite’s online backup API, then runs `PRAGMA integrity_check` on the staged copy before an atomic rename.” | Add `@claim:export-boundary` that traces opens/writes for every subcommand and interrupts publication to verify atomic behavior. |
| F-1-22 | README: “`npm test` runs the Rust unit/integration suite and deterministic site/PWA checks.”; “`npm run test:browser` runs the pinned Chromium regression for the desktop and 390px mobile shells, keyboard flow, axe accessibility, no-outbound requests, and an online service-worker update followed by an offline reload.” | Add a docs-contract test that enumerates the advertised checks, or replace the prose with a short factual command list. The current commands passed but have no claim entries. |
| F-1-23 | README: “Requirements: Rust 1.85+, Node.js 20+, and npm 10+.” | Add a version-matrix claim test for the minimum versions or link to tested CI matrix evidence and register the claim. |
| F-1-24 | README: “Run `sqlite-sync-guard --help` or a command’s `--help` for all options.”; “`npm run build` produces the release binary and the static site at `dist/site/index.html`.”; “To work on the docs site, run `npm run dev`.” | Add separate `help`, `build-output`, and `dev-server` claim entries/tests. The clean build did produce both outputs, but the statements remain unlisted. |
| F-1-25 | Landing: “Not affiliated with the SQLite project or sync-client vendors.” | Cite the ownership/legal basis or move this disclaimer to Terms; it is not a sandbox-testable product claim. |

### F-1-26 — `/demo` and unknown routes use an unrelated Azure 404

- **Location/evidence:** `/demo` and `/does-not-exist-review-1` return HTTP 404
  with title “Azure Static Web Apps - 404: Not found,” no site header, footer,
  `<h1>`, or product styling. The page requests Bootstrap, jQuery, Azure
  scripts, CSS, and images from `ajax.aspnetcdn.com` and
  `appservice.azureedge.net`.
- **Why this blocks:** routing is broken for the required demo and the 404
  abandons the product, privacy boundary, and navigation.
- **Concrete fix:** ship a product-styled `/404.html` and configure the host to
  serve it with status 404. Add `/demo` as a real route. The 404 must use only
  self-hosted assets and link home.

### F-1-27 — The earlier skip-link focus finding regressed on legal routes

- **Location/evidence:** the historical handoff says `main#main` was made
  programmatically focusable. It is `tabindex="-1"` only on `/`. On `/privacy/`
  and `/terms/`, activating “Skip to main content” leaves focus on `<body>`.
  Following Privacy and using Back also leaves focus on `<body>`; no route
  announcement occurs.
- **Why this blocks:** this is an earlier finding that is only partly fixed;
  the work order requires any half-fix or regression to block again.
- **ID continuity:** the historical handoff did not assign this item an ID, so
  this review assigns `F-1-27` rather than inventing a prior identifier.
- **Concrete fix:** make `main` focusable on every route. After any route
  navigation and back/forward, focus the destination `<h1>` and announce its
  text in a polite live region while preserving restored scroll.

### F-1-28 — The reveal animation temporarily violates text contrast

- **Location/evidence:** immediate-load axe 4.11.0 on `/` reports the install
  command at 2.91:1 and its Copy button at 2.32:1 during `.print-in` opacity.
  Both require 4.5:1. The violation clears after about 100ms and steady-state
  axe is clean.
- **Why this blocks:** the baseline requires contrast throughout the
  experience, not only after animation settles.
- **Concrete fix:** do not animate opacity on required text or controls. Limit
  the registration reveal to decorative layers, then add an immediate-load
  axe regression before waiting for animation completion.

## Major findings

### F-1-29 — Required social and canonical metadata is missing

All three real routes have descriptions and SVG favicons, but none has a
canonical URL, Open Graph title/description/image, Twitter card, or 180px
apple-touch icon. Add route-specific canonical tags, the required social tags,
a real 1200×630 image derived from the risograph art, and an apple-touch icon.
Without them, search engines and shared links cannot identify the canonical
route or present the product accurately.

### F-1-30 — `robots.txt` and `sitemap.xml` are missing

Both return 404. Add a robots file and a sitemap listing `/`, `/demo`,
`/privacy/`, and `/terms/`. Keep the designed 404 out of the sitemap. Their
absence prevents crawlers from discovering and interpreting the route set.

### F-1-31 — Header and footer skeletons vary by route

The home header omits Demo and Privacy; policy headers replace the product
navigation with Home and one policy. Policy footers omit the product one-line
description, “Built by Param Factory,” and a version/build id; the home footer
also lacks a version/build id. Use one consistent shell on every route with
wordmark, Demo, product navigation, Privacy, Terms, the one-liner, factory
credit, and build id. The current changes force visitors to relearn navigation
and remove required provenance on policy pages.

### F-1-32 — An update prompt appears in a fresh browser context

Both fresh cold captures displayed “A new guide is ready.” and “Reload now.”
There had been no prior visit in either browser context. Change the service
worker lifecycle so the update prompt appears only when an already controlled
client receives a genuinely newer release; cover a first-ever visit in the PWA
test. A first-time visitor is otherwise told to reload an update they never
received, competing with the actual first action.

### F-1-33 — The output concept changes names

Landing and README alternate among “handoff artifact,” “snapshot,” “backup,”
“safe copy,” “transfer pair,” and “parcel.” A visitor cannot know whether these
are one output or several. Use **transfer backup** for the `.backup.sqlite3`
file and **manifest** for its JSON metadata everywhere. Rewrite “handoff
artifact” as “transfer backup,” “verified snapshot” as “verified transfer
backup,” and “safe copy” as “transfer backup.”

### F-1-34 — Core landing copy uses unexplained jargon

Flagged terms are “preflight,” “WAL,” “SHM,” “sidecars,” “lock bytes,” “online
backup API,” “integrity_check,” “sync root,” “digest-bearing,” “idempotent,” and
“safety boundary.” “Live set,” “client guard,” “put it on the path,” and the
footer’s “small guardrail” are also unexplained. Suggested replacements in
first-read copy: “check,” “SQLite journal files,” “active database use,”
“SQLite’s backup function,” “the tool checks the backup,” “synced folder,”
“manifest with a checksum,” “repeat runs leave the file unchanged,” “live
database files,” “ignore rules,” “use the three commands,” and “a local SQLite
safety tool.” Keep the technical names only in the detailed command reference
after defining them. The current wording makes a new visitor translate
implementation terms before deciding whether the tool addresses their task.

### F-1-35 — README jargon is denser than its introduction allows

The README introduces “preflight,” “WAL,” “SHM,” “rollback-journal
companions,” “transfer manifest,” “sync root,” “sidecar,” “lock-byte regions,”
“online backup API,” “atomic rename,” and “idempotent” before or without plain
definitions. Use the same replacements as F-1-34, then retain technical terms
in parentheses where they help an experienced reader. Rewrite “trigger journal
recovery” as “change the database while checking it” in the overview, and
explain “atomic rename” as “publish the completed file in one filesystem
operation” in the technical section. The current density obscures the basic
install, scan, and export path.

## Minor findings

### F-1-36 — Visible Copy buttons do not name the result

Four buttons say only “Copy.” Their accessible names are better, but sighted
users do not get that context. Use “Copy install command,” “Copy scan
command,” “Copy export command,” and “Copy ignore command.” A sighted visitor
cannot predict which result each repeated label produces out of context.

### F-1-37 — Fixture buttons are nouns rather than result-naming verbs

“Live WAL set” and “Closed set” are buttons. Rename them “Show unsafe sample”
and “Show safe sample.” The current noun labels do not state the result of the
press and require a new visitor to know WAL.

### F-1-38 — Several headings fail out of context

“An unambiguous preflight.” is both jargon and an untested adjective. “Export
through SQLite, not around it.” requires implementation knowledge. “Three
commands. One safety boundary.” and “Make the safe copy obvious.” are vague.
“Guardrail, not replication.” also depends on a metaphor. Use “See whether
files are safe to copy,” “Create a verified transfer backup,”
“Scan, export, or add ignore rules,” and “Create a transfer backup.”
Replace the guardrail heading with “Prevents unsafe copies; does not sync
database changes.” In a headings list, the current phrases do not identify the
section content without surrounding paragraphs.

### F-1-39 — README opening sentence is over the hard cap

The 33-word sentence beginning “It finds SQLite databases…” exceeds 22 words.
Rewrite: “It finds SQLite databases and their journal files, then reports
active locks. It can export a consistent backup and add rules for Syncthing or
Resilio Sync.” The current sentence makes the reader hold four capabilities
and two client names at once.

### F-1-40 — README exit-code sentence is over the hard cap

The 31-word sentence beginning “Exit code `0` means…” exceeds 22 words.
Rewrite: “Exit code `0` means no unsafe files were found. Exit code `2` means a
database has a journal file or active lock. Exit code `1` means the scan
failed.” The current sentence makes three outcomes harder to scan.

### F-1-41 — README browser-test sentence is over the hard cap

The 32-word sentence beginning “`npm run test:browser` runs…” exceeds 22 words.
Rewrite: “`npm run test:browser` checks desktop and mobile layouts, keyboard
use, accessibility, and outbound requests. It also checks an update followed
by an offline reload.” The current sentence buries distinct checks in one
list.

### F-1-42 — The home title uses the same unexplained term

`SQLite Sync Guard — preflight SQLite before folder sync` is 55 characters and
has the correct structural pattern, but “preflight” is not plain first-read
copy. Use `SQLite Sync Guard — check SQLite files before sync`. The current
title is unclear in a browser tab or search result without body context.

### F-1-43 — The clipboard error omits the reason and does not perform its advice

The live-region error is “Copy failed. Select the command: [command].” It says
what failed and suggests an action, but does not say whether clipboard access
was denied or unavailable, and it does not select the command. Use “Could not
copy because this browser denied clipboard access. The command is selected;
press Ctrl+C or Command+C.” Then actually select and focus the command text.

## Complete copy audit

Word count treats a hyphenated token as one word. Code blocks in the README are
commands rather than sentences and are excluded there; visible landing-page
commands and every visible heading, label, link, and button are included.
`U` means unlisted claim, `J` jargon, `H` heading/context problem, `B` button
does not name a result, `L` over 22 words, `T` inconsistent term, and `M`
misleading/stale. No banned plain-words term appears.

### Landing page

| # | Words | Exact sentence or standalone UI text | Flag / finding |
| ---: | ---: | --- | --- |
| 1 | 2 | You’re offline. | — |
| 2 | 11 | The guide and demo still work; release downloads need a connection. | U, M — F-1-4 |
| 3 | 3 | SQLITE SYNC GUARD | — |
| 4 | 3 | How it works | — |
| 5 | 1 | Commands | — |
| 6 | 3 | Install from source | — |
| 7 | 4 | PREFLIGHT FOR SYNCED FOLDERS | J — F-1-34 |
| 8 | 5 | Don’t sync a database mid-sentence. | H — F-1-1 |
| 9 | 12 | Live SQLite, WAL, and SHM files are a set—not ordinary documents. | U, J — F-1-19, F-1-34 |
| 10 | 9 | Catch unsafe copies, then make one clean handoff artifact. | U, J, T — F-1-5, F-1-33 |
| 11 | 8 | `cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard` | U — F-1-7 |
| 12 | 1 | Copy | B — F-1-36 |
| 13 | 5 | Free, open source, no telemetry. | U — F-1-6 |
| 14 | 16 | Build from the public source on Linux, macOS, or Windows; prebuilt binaries are not published yet. | U — F-1-7 |
| 15 | 3 | Live set in. | J — F-1-34 |
| 16 | 3 | Verified snapshot out. | U, T — F-1-11, F-1-33 |
| 17 | 3 | Guardrail, not replication. | H — F-1-38 |
| 18 | 6 | This tool prevents unsafe file copies. | U — F-1-5 |
| 19 | 8 | It does not make two SQLite writers safe. | U — F-1-17 |
| 20 | 4 | 01 / SEE THE RISK | — |
| 21 | 3 | An unambiguous preflight. | J, H — F-1-38 |
| 22 | 8 | Run the scan before your sync client does. | — |
| 23 | 15 | Sidecars and lock bytes are explained in plain language, with stable exit codes for automation. | U, J — F-1-9, F-1-34 |
| 24 | 2 | RECORDED FIXTURE | M — F-1-2 |
| 25 | 3 | Live WAL set | B, J — F-1-37 |
| 26 | 2 | Closed set | B — F-1-37 |
| 27 | 3 | WAL sidecar present | U, J — F-1-8 |
| 28 | 3 | shared-memory sidecar present | U, J — F-1-8 |
| 29 | 4 | active SQLite lock detected | U — F-1-8 |
| 30 | 13 | DO NOT SYNC — 1 of 1 database set is unsafe to copy live. | U, J — F-1-8 |
| 31 | 5 | Exit 2 · do not sync | U — F-1-9 |
| 32 | 4 | 02 / MAKE THE HANDOFF | T — F-1-33 |
| 33 | 6 | Export through SQLite, not around it. | H — F-1-38 |
| 34 | 14 | The online backup API reads a consistent snapshot while your app can keep running. | U, J, T — F-1-10, F-1-33, F-1-34 |
| 35 | 10 | The staged copy must pass `integrity_check` before it is published. | U, J — F-1-11, F-1-34 |
| 36 | 1 | Snapshot | T — F-1-33 |
| 37 | 10 | SQLite’s supported backup mechanism captures one consistent point in time. | U — F-1-10 |
| 38 | 1 | Verify | — |
| 39 | 11 | The new database passes integrity check and gets a SHA-256 digest. | U, J — F-1-11, F-1-34 |
| 40 | 1 | Transfer | — |
| 41 | 12 | Sync the backup and JSON manifest—not the live database and sidecars. | J, T — F-1-33, F-1-34 |
| 42 | 6 | 03 / PUT IT ON THE PATH | J — F-1-34 |
| 43 | 2 | Three commands. | H — F-1-38 |
| 44 | 3 | One safety boundary. | H, J — F-1-38 |
| 45 | 2 | INSPECT ONLY | — |
| 46 | 4 | Scan a sync root | J — F-1-34 |
| 47 | 3 | `sqlite-sync-guard scan ~/Sync` | — |
| 48 | 1 | Copy | B — F-1-36 |
| 49 | 7 | Reads headers, sidecar names, and lock regions. | U, J — F-1-18, F-1-34 |
| 50 | 5 | It never connects to SQLite. | U — F-1-18 |
| 51 | 2 | EXPLICIT WRITE | — |
| 52 | 3 | Export a snapshot | T — F-1-33 |
| 53 | 6 | `sqlite-sync-guard export app.db -o ./handoff` | T — F-1-33 |
| 54 | 1 | Copy | B — F-1-36 |
| 55 | 9 | Writes a verified `.backup.sqlite3` plus a digest-bearing manifest. | U, J — F-1-12, F-1-34 |
| 56 | 2 | CLIENT GUARD | J — F-1-34 |
| 57 | 3 | Write ignore rules | — |
| 58 | 5 | `sqlite-sync-guard ignore ~/Sync --client syncthing` | — |
| 59 | 1 | Copy | B — F-1-36 |
| 60 | 4 | Owns one marked block. | U, J — F-1-13, F-1-34 |
| 61 | 8 | Existing rules stay intact; repeated runs are idempotent. | U, J — F-1-13, F-1-34 |
| 62 | 4 | Built for scripts, too. | — |
| 63 | 3 | Add `--json` anywhere. | U — F-1-14 |
| 64 | 14 | Exit 0 is safe, 2 is unsafe, and 1 means the check was incomplete. | U — F-1-9 |
| 65 | 4 | BEFORE THE NEXT SYNC | — |
| 66 | 5 | Make the safe copy obvious. | H, T — F-1-33, F-1-38 |
| 67 | 3 | One static binary. | U — F-1-16 |
| 68 | 2 | Bundled SQLite. | U — F-1-16 |
| 69 | 6 | No service, account, or network required. | U — F-1-15 |
| 70 | 3 | Install from source | — |
| 71 | 3 | Read the source | — |
| 72 | 3 | SQLite Sync Guard | — |
| 73 | 6 | A small guardrail from Param Factory. | J — F-1-34 |
| 74 | 1 | Privacy | — |
| 75 | 1 | Terms | — |
| 76 | 1 | GitHub | — |
| 77 | 9 | Not affiliated with the SQLite project or sync-client vendors. | U — F-1-25 |
| 78 | 5 | A new guide is ready. | M — F-1-32 |
| 79 | 2 | Reload now | — |
| 80 | 4 | UNSAFE profiles/session.db | U — F-1-8 |
| 81 | 4 | SAFE profiles/session.db | U — F-1-8 |
| 82 | 10 | SAFE — 1 database set has no sidecars or active locks. | U, J — F-1-8 |
| 83 | 5 | Exit 0 · safe to copy | U — F-1-9 |
| 84 | 1 | Copied | — |
| 85 | 2 | Copied: [command] | — |
| 86 | 2 | Copy failed. | Error — F-1-43 |
| 87 | 4 | Select the command: [command] | Error — F-1-43 |

### README

| # | Words | Exact sentence, heading, or standalone lead-in | Flag / finding |
| ---: | ---: | --- | --- |
| 1 | 3 | SQLite Sync Guard | — |
| 2 | 15 | SQLite Sync Guard is a small, cross-platform preflight for developers who sync folders between computers. | U, J — F-1-7, F-1-35 |
| 3 | 33 | It finds SQLite databases and their WAL, SHM, and rollback-journal companions, reports active SQLite locks, makes a consistent backup with a transfer manifest, and can write ignore rules for Syncthing or Resilio Sync. | L, U, J — F-1-5, F-1-39 |
| 4 | 5 | It prevents unsafe file copying. | U — F-1-5 |
| 5 | 17 | It does **not** make concurrent SQLite writes across devices safe, merge profiles, or replace a replication system. | U — F-1-17 |
| 6 | 1 | Install | — |
| 7 | 6 | Prebuilt binaries are not published yet. | U — F-1-7 |
| 8 | 9 | Install the current source from the public repository instead: | — |
| 9 | 13 | SQLite is bundled into the binary; a system SQLite installation is not needed. | U — F-1-16 |
| 10 | 1 | Usage | — |
| 11 | 7 | Check a sync root before copying it: | J — F-1-35 |
| 12 | 31 | Exit code `0` means no unsafe live sets were found, `2` means at least one database has a sidecar or active lock, and `1` means the scan could not be completed. | L, U, J — F-1-9, F-1-40 |
| 13 | 4 | Use JSON for scripts: | U — F-1-14 |
| 14 | 6 | Create a consistent, integrity-checked handoff artifact: | U, J, T — F-1-10, F-1-33, F-1-35 |
| 15 | 10 | This writes `data.backup.sqlite3` and `data.backup.manifest.json`. | U — F-1-12 |
| 16 | 15 | The manifest contains the SHA-256 digest, byte length, source observations, SQLite version, and integrity result. | U, J — F-1-12, F-1-35 |
| 17 | 9 | Existing exports are never overwritten unless `--force` is supplied. | U — F-1-12 |
| 18 | 9 | Keep live database files out of a sync client: | — |
| 19 | 21 | The command manages one clearly marked block in `.stignore` or `.sync/IgnoreList`; unrelated rules are preserved and repeat runs are idempotent. | U, J — F-1-13, F-1-35 |
| 20 | 10 | Run `sqlite-sync-guard --help` or a command’s `--help` for all options. | U — F-1-24 |
| 21 | 2 | Safety model | — |
| 22 | 6 | `scan` reads headers and metadata only. | U — F-1-18 |
| 23 | 11 | It does not connect to a database or trigger journal recovery. | U, J — F-1-18, F-1-35 |
| 24 | 20 | A matching `-wal`, `-shm`, or `-journal` file is treated as unsafe to copy, even if no process lock is visible. | U, J — F-1-19, F-1-35 |
| 25 | 14 | Lock probes use SQLite’s documented lock-byte regions on the database and WAL shared-memory files. | U, J — F-1-20, F-1-35 |
| 26 | 9 | `export` is the only command that opens a database. | U — F-1-21 |
| 27 | 18 | It uses SQLite’s online backup API, then runs `PRAGMA integrity_check` on the staged copy before an atomic rename. | U, J — F-1-21, F-1-35 |
| 28 | 6 | The backup is a handoff snapshot. | U, T — F-1-10, F-1-33 |
| 29 | 13 | Never open the same writable database from two machines through a file-sync folder. | U — F-1-17 |
| 30 | 3 | Develop and verify | — |
| 31 | 10 | Requirements: Rust 1.85+, Node.js 20+, and npm 10+. | U — F-1-23 |
| 32 | 13 | `npm test` runs the Rust unit/integration suite and deterministic site/PWA checks. | U — F-1-22 |
| 33 | 32 | `npm run test:browser` runs the pinned Chromium regression for the desktop and 390px mobile shells, keyboard flow, axe accessibility, no-outbound requests, and an online service-worker update followed by an offline reload. | L, U, J — F-1-22, F-1-41 |
| 34 | 16 | `npm run build` produces the release binary and the static site at `dist/site/index.html`. | U — F-1-24 |
| 35 | 10 | To work on the docs site, run `npm run dev`. | U — F-1-24 |
| 36 | 3 | Useful release checks: | — |
| 37 | 16 | The project performs no telemetry and the docs site loads no third-party scripts, fonts, or analytics. | U — F-1-6 |
| 38 | 8 | See \[CHANGELOG.md\](CHANGELOG.md) for release history. | — |
| 39 | 1 | License | — |
| 40 | 5 | MIT © 2026 Sociobot (Param Factory) | — |

## Demo, privacy, and offline evidence

- The hard-coded fixture toggle changes to “Exit 0 · safe to copy,” but reloading
  returns to the hard-coded unsafe string. No demo banner appears.
- At `/?demo=1`, localStorage and sessionStorage were empty, IndexedDB had no
  databases, and the only Cache Storage entry was the PWA shell. This does not
  prove demo isolation because no demo mode exists.
- All requests on `/`, `/?demo=1`, `/privacy/`, and `/terms/` were same-origin.
  After the PWA controlled the page, an offline reload succeeded and restored
  the landing page. The valid-site privacy/offline behavior passes, but the
  claims remain unlisted and the 404 makes third-party requests.

## Structure and accessibility checks that passed

- `/`, `/privacy/`, and `/terms/` return 200, have route-appropriate titles,
  `lang="en"`, one `<h1>`, one `<main>`, descriptions, meaningful image alt
  text, and no console errors.
- Every link on those routes was crawled. Internal pages and GitHub targets
  returned 200; all in-page targets exist.
- Browser Back restored the home scroll position. It did not restore useful
  focus, as recorded in F-1-27.
- At 390px there is no horizontal overflow and tested interactive targets are
  at least 44px. Reduced-motion styles reduce animation and transition
  duration to `0.00001s`.
- Steady-state axe 4.11.0 found no WCAG A/AA violation on the three valid
  routes. The immediate-load violation is F-1-28. The standalone axe CLI was
  also attempted but failed inside its webdriver integration; the same axe
  engine was then run successfully through Playwright.
- The risograph/cut-paper system, art, palette, typography, and hard-shadow
  controls are visibly product-specific and match `.factory/design.md`; this
  does not look like a generic SaaS template.
- Built JavaScript is 2.93 KB and CSS is 11.60 KB. No CDN font or valid-route
  third-party runtime was found.

## Claim and clean-clone execution

No claim commands could be run because there are zero entries in a missing
`.factory/claims.json`. From a fresh local clone at the reviewed SHA:

| Command/exercise | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm test` | PASS: 9 Rust tests, 2 CLI integration tests, 1 doctest, site and PWA source checks |
| `npm run build` | PASS; produced release CLI and `dist/site/` |
| `npm run check:site` | PASS |
| `npm run test:browser` | PASS, including the A→B service-worker cache regression |
| `sqlite-sync-guard demo` in an empty temp directory | FAIL: unrecognised subcommand, exit 2 |
| `sqlite-sync-guard --demo` in the same directory | FAIL: unexpected argument, exit 2 |

## History audit

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists in the
working tree or its reachable path history. The earlier `.factory/handoff.md`
and both verification reports were read.

| Earlier item | Live check | Code/test check | Result |
| --- | --- | --- | --- |
| Fixed cache name retained a stale shell | Live worker uses `sqlite-sync-guard-73f532b0e32dd2e6`. | Generated digest, old-cache deletion, and A→B browser regression pass. | Confirmed fixed. |
| Download CTAs pointed to an empty release page | Live page offers source installation and has no release link. | Source/browser regression rejects release URLs and “Download latest release.” | Confirmed fixed. |
| Skip link changed the hash without moving focus | Home now focuses `main`. Privacy and Terms still leave focus on `<body>`. | Only home `main` has `tabindex="-1"`; browser test checks home only. | Half-fixed/regressed; blocking F-1-27. |

The earlier macOS/Windows runtime coverage limit is still unresolved. It now
also makes the unlisted “cross-platform” claim part of F-1-7.

## What would make this perfect

Resolve every finding, then repeat this review cold. The acceptance state is:
the first screen plainly names the developer and job; `/demo` and the CLI demo
run the real bundled sample in isolation with reset/start controls; every
retained claim has one passing clean-sandbox test; all routes share the product
shell and metadata; the branded 404 makes no third-party request; keyboard
focus works on every route; immediate and steady-state accessibility checks
are clean; and the full copy audit has no flags. Anything less remains FAIL.
