# Adversarial first-read review 2 — SQLite Sync Guard

Reviewed 2026-08-28 against repository commit
`3dd4c7ab2762dcbe177940482d4573a3a3febe83` and the live site at
<https://sqlite-sync-guard.sociobot.in>.

## Verdict: FAIL

The first read is clear and the isolated web demo functions, but the CLI
"recording" is hand-written presentation text rather than a recording of the
real command. The claim suite also does not exercise most CLI claims through
the documented demo entry point. Normal route navigation does not move focus
or announce the new page. There are unlisted claims and the 404 is missing the
required route metadata. There are no failed registered tests.

## Cold first read — no scrolling

Fresh Chromium contexts at 390 x 844 and 1440 x 900 both showed the headline,
audience sentence, primary action, result sentence, and three facts before
scrolling. The mobile primary action occupied y=478–526; there was no horizontal
overflow or console error.

| Question | Answer from the first screen |
| --- | --- |
| What does it do? | It checks SQLite files before folder sync and creates a verified transfer backup when files are unsafe. |
| For whom? | Developers syncing folders between computers. |
| What should I click first? | **Try it with sample data**, which says it will show a live scan and safe export. |

The exact copy that made this pass is: “Check SQLite files before folder sync”; “For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup.”; and “Try it with sample data” / “See a live database scan and safe export.”

## Findings

### F-2-1 — BLOCKING: the claimed CLI recording is hard-coded and differs from the real CLI

- **Location / quote:** `/demo/`: “This recorded output comes from the bundled `sqlite-sync-guard demo` command and realistic sample databases.” The home labels the same component “Output from the bundled CLI demo.”
- **Evidence:** `site/src/main.ts` defines two literal `fixtures` strings. Running the real command from a clean clone, `cargo run --quiet -- demo`, starts with `DEMO — isolated sample data; your files were not read or changed.`, prints absolute temporary paths, a `workspace:` line, and `Delete this temporary workspace when you are finished.` None of those appear in the page transcript. The web’s safe state also invents `sample-after-close`, which the CLI demo does not run.
- **Why this blocks:** a CLI needs a self-hosted recording of the real binary doing its main job. A manually maintained imitation makes the demo’s central proof stale and turns the quoted assertion into an unlisted, unverifiable claim.
- **Concrete fix:** generate and commit a normalized terminal SVG/asciinema from `sqlite-sync-guard demo` (replace only the random temporary-directory portion with a documented placeholder). Render that asset in the landing and `/demo/`. Add `@claim:demo-recording` that runs the command in a temporary directory and compares normalized output to the shipped recording. If safe-after-close is retained, make it a second real command/recording rather than a synthetic fixture.

### F-2-2 — BLOCKING: most CLI claim tests bypass the documented demo sandbox

- **Location / evidence:** `.factory/claims.json` says claims are sandboxed, but `site/test-claims.mjs` runs `cargo test --test cli ...` and `cargo test ...` for `unsafe-detection`, `exit-codes-json`, `verified-transfer`, `live-consistent-transfer`, `ignore-rules`, `scan-read-only`, and `bundled-sqlite`. Those tests create their own databases and call `scan`, `export`, or `ignore` directly; they do not enter `sqlite-sync-guard demo` or consume the shipped `examples/sample.sql` input.
- **Why this blocks:** the required verifier path for this CLI is its demo command and bundled sample. Passing tests of separately constructed fixtures do not prove that the visitor’s one-click demo is the product operation being claimed.
- **Concrete fix:** have `demo --json` expose its created workspace and the exact bundled sample identifiers, then write every CLI claim test around a fresh `demo` run and inspect or operate only that workspace. Keep extra unit tests, but do not use them as the registered claim tests. The claim runner should assert that every registry entry invokes the demo entry point.

### F-2-3 — normal navigation leaves focus on `<body>` and makes no route announcement

- **Location / quote:** from `/demo/`, activating the primary-nav “Privacy” link loads `/privacy/` with `document.activeElement === document.body` and `[data-route-status]` empty.
- **Why this matters:** a keyboard or screen-reader visitor receives no indication that the destination page is ready. Back navigation is handled, but forward navigation is only half-fixed.
- **Concrete fix:** on each full-page route load, focus the destination `<h1>` and set the polite route-status text (without disrupting a hash target or a direct link to a control). Add a browser regression that follows each header/footer link and asserts h1 focus plus the announcement.

### F-2-4 — unlisted claims remain in README and policy/demo copy

- **Locations / quotes:**
  - `/demo/`: “This recorded output comes from the bundled `sqlite-sync-guard demo` command and realistic sample databases.”
  - `README.md`: “Use Rust 1.85 or newer, Node.js 20 or newer, and npm 10 or newer.”
  - `README.md`: “The test suite checks the CLI, demo, site, accessibility, privacy, offline reload, and update path.”
  - `README.md` and `/privacy/`: “The CLI has no telemetry or network client.”
  - `/privacy/`: “SQLite Sync Guard does not collect or sell personal information.”
- **Why this matters:** none has its own entry in `.factory/claims.json`. In particular, the current `no-telemetry` browser test only checks same-origin requests from the static demo; it does not establish that the compiled CLI has no network client or that the project neither collects nor sells personal information.
- **Concrete fix:** either remove the claims or add precise entries and observable tests. For the version sentence, run the clean build under the declared minimum toolchains. For the suite sentence, remove it or test a declared check manifest. For CLI privacy, use a fixture that rejects outbound socket creation while running `demo` and audit the binary/source for network crates. For collection/sale language, make it a scoped policy statement with an owner/contact, or remove it if it cannot be verified in the product sandbox.

### F-2-5 — the designed 404 is not a complete route shell

- **Location / evidence:** live `/missing-review-2` returns a styled HTTP 404 with one h1 and a working home link, but its head contains only a description, favicon, and title. It lacks a canonical link, Open Graph title/description/image, Twitter card, apple-touch icon, and theme color. Its header also omits the Commands link and the normal illustrated wordmark.
- **Why this matters:** a shared or indexed missing URL has no product metadata, and visitors see a different navigation identity at the point of recovery.
- **Concrete fix:** give `404.html` the same complete metadata set and header shell as the four public routes, with a canonical 404 URL only if the project’s indexing policy requires it; otherwise add `noindex` while retaining OG/Twitter/favicon/apple/theme metadata. Add the route to the metadata and shell crawl.

## Demo and sandbox checks

- Clicking the first-screen sample action opened `/demo/` in one step. Its initial screen already showed an unsafe `active-session.db`, a safe `closed-project.db`, an export, and a status.
- The persistent banner read “Demo — sample data, nothing is saved” and contained both **Reset demo** and **Start for real**.
- Selecting the safe sample wrote only `demo:sqlite-sync-guard:fixture`. Reset removed that key and restored the unsafe sample. There were no non-`demo:` local-storage keys. Start-for-real’s handler removes the same key before leaving.
- After service-worker control, live `/demo/` reloaded offline with HTTP 200 and `Show safe sample` worked. Captured requests were same-origin only; console errors were zero.
- `cargo run --quiet -- demo` from the clean clone created a unique `/tmp/sqlite-sync-guard-demo-*` workspace and produced the transfer backup. This confirms the command is isolated, but also exposes F-2-1’s mismatch with the web transcript.

## Registered-claim execution

A fresh clone at `/tmp/sqlite-sync-guard-review-2-6bR84N` was created from the remote at `3dd4c7a`; `npm ci` completed. Every command listed in `.factory/claims.json` was invoked individually. All passed:

| Claim id | Result |
| --- | --- |
| `demo-isolation` | pass |
| `unsafe-detection` | pass |
| `exit-codes-json` | pass |
| `verified-transfer` | pass |
| `live-consistent-transfer` | pass |
| `ignore-rules` | pass |
| `scan-read-only` | pass |
| `offline-demo` | pass |
| `no-telemetry` | pass |
| `demo-reset` | pass |
| `mit-source` | pass |
| `bundled-sqlite` | pass |
| `help-output` | pass |
| `build-output` | pass |

The pass results do not remove F-2-1, F-2-2, or F-2-4: those findings concern the stated sandbox/claim contract and unlisted assertions, not a failed command.

## Earlier finding verification

All F-1 findings were checked against live content and source, rather than relying on `polish-1.md`. F-1-1 through F-1-26 and F-1-28 through F-1-43 are fixed: first-read copy, isolated demo, claims registry, plain copy, route assets, offline update behavior, canonical/social metadata on public routes, output terminology, buttons, and immediate contrast all match the repair claims. F-1-27’s specific skip-link and back/forward behaviors are fixed: main is focusable on every public route and Back focuses/announces the h1. F-2-3 identifies the remaining forward-navigation case, which was not covered by that earlier finding’s live reproduction.

## Route, link, and identity checks

`/`, `/demo/`, `/privacy/`, and `/terms/` have their expected route titles, one h1, one main, descriptions, canonicals, Open Graph metadata, Twitter card, favicon, and apple-touch icon. The four routes share the header/footer and have no dead internal or GitHub links; all crawled destinations returned HTTP 200. The unknown route returned the designed page with HTTP 404. The original risograph collage, print geometry, palette, and system type are visibly product-specific rather than a generic SaaS template. No AI feature is present or implied, which fits the local safety-check job.

## Copy audit

Word counts treat command names and hyphenated terms as one token. All prose sentences are at or below 22 words. No banned marketing adjectives appear. The only flags are the unlisted claims identified in F-2-1 and F-2-4; technical terms appear in command/safety detail after the core explanation.

### Landing page sentences

| Words | Sentence |
| ---: | --- |
| 16 | For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. |
| 8 | See a live database scan and safe export. |
| 1 | Free. |
| 2 | Runs locally. |
| 2 | No telemetry. |
| 3 | Live files stopped. |
| 3 | Transfer backup ready. |
| 8 | Prevents unsafe copies; does not sync database changes. |
| 10 | Never open the same writable database from two synced computers. |
| 14 | The scan warns when a database has journal files or is in active use. |
| 6 | Its exit code works in scripts. |
| 12 | SQLite’s backup function captures committed data while your app stays open. |
| 9 | The tool checks the new backup before publishing it. |
| 6 | Capture one consistent point in time. |
| 8 | Verify the database and calculate its SHA-256 checksum. |
| 7 | Copy the transfer backup and its manifest. |
| 11 | Reports database journal files and active use without changing the database. |
| 10 | Writes a checked `.backup.sqlite3` and a manifest with its checksum. |
| 3 | Preserves other rules. |
| 7 | Running it again leaves the file unchanged. |
| 7 | Put `--json` before or after a command. |
| 12 | Scan exits 0 when safe, 2 when unsafe, and 1 on error. |
| 7 | Rust builds the CLI with SQLite included. |
| 5 | A local SQLite safety tool. |

The remaining landing sentences and rendered terminal text are included here so
the audit does not treat labels as invisible copy:

| Words | Sentence or standalone UI text |
| ---: | --- |
| 5 | A local SQLite safety check |
| 6 | Check SQLite files before folder sync |
| 4 | Output from the bundled CLI demo |
| 3 | Show unsafe sample |
| 3 | Show safe sample |
| 2 | `$ sqlite-sync-guard demo` |
| 2 | UNSAFE `active-session.db` |
| 3 | WAL sidecar present |
| 2 | SAFE `closed-project.db` |
| 12 | DO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live. |
| 5 | Close writers or run `sqlite-sync-guard export`. |
| 3 | Transfer backup created |
| 4 | Backup: `transfer/closed-project.backup.sqlite3` |
| 4 | Manifest: `transfer/closed-project.backup.manifest.json` |
| 5 | Unsafe scan · do not copy |
| 6 | Safe scan · ready to copy |
| 6 | See whether files are safe to copy |
| 5 | Create a verified transfer backup |
| 6 | Scan, export, or add ignore rules |
| 4 | Scan a synced folder |
| 5 | Export a transfer backup |
| 5 | Keep live files out of sync |
| 4 | Use JSON in scripts |
| 4 | Install from the public source |
| 3 | Copy install command |
| 2 | Read the source |

Landing headings are context-complete: “Check SQLite files before folder sync”, “See whether files are safe to copy”, “Create a verified transfer backup”, and “Scan, export, or add ignore rules”. Controls name their result: “Try it with sample data”, “Show unsafe sample”, “Show safe sample”, and the four specific Copy controls.

### README sentences

| Words | Sentence |
| ---: | --- |
| 12 | SQLite Sync Guard checks database files before you copy a synced folder. |
| 9 | It warns about active use and SQLite journal files. |
| 15 | It can create a verified transfer backup and add rules for Syncthing or Resilio Sync. |
| 11 | The tool does not make writes from two synced computers safe. |
| 10 | Use a transfer backup to move committed data between computers. |
| 11 | The command creates a new temporary workspace from the bundled sample. |
| 13 | It runs the real scan and export code, then prints the workspace path. |
| 5 | Your files are never read. |
| 4 | The build includes SQLite. |
| 7 | It does not need the `sqlite3` command. |
| 10 | Exit code `0` means the files look safe to copy. |
| 12 | Exit code `2` means a journal file or active lock was found. |
| 7 | Exit code `1` means the scan failed. |
| 5 | This writes `data.backup.sqlite3` and `data.backup.manifest.json`. |
| 13 | The manifest records the checksum, size, source observations, SQLite version, and check result. |
| 8 | Existing files are preserved unless you add `--force`. |
| 10 | The command owns one marked block in the ignore file. |
| 4 | It preserves other rules. |
| 7 | A repeated run leaves the file unchanged. |
| 6 | Run `sqlite-sync-guard --help` for every option. |
| 9 | `scan` reads file headers, names, and documented lock regions. |
| 9 | It does not change the database while checking it. |
| 17 | A `-wal`, `-shm`, or `-journal` file makes the set unsafe to copy, even without a visible lock. |
| 11 | `export` uses SQLite’s backup function and checks the completed file. |
| 9 | It publishes the completed file in one filesystem operation. |
| 13 | Never open the same writable database from two computers through a synced folder. |
| 14 | Use Rust 1.85 or newer, Node.js 20 or newer, and npm 10 or newer. **F-2-4** |
| 9 | `npm run build` creates the release CLI and `dist/site`. |
| 8 | `npm run dev` starts the local documentation site. |
| 11 | `cargo package --locked` creates the publishable crate; the factory owns publishing. |
| 15 | The test suite checks the CLI, demo, site, accessibility, privacy, offline reload, and update path. **F-2-4** |
| 8 | The CLI has no telemetry or network client. **F-2-4** |
| 11 | The documentation site loads no analytics, third-party scripts, or third-party fonts. |

README headings and lead-ins are also clear in isolation: “Try the isolated
demo”, “Install”, “Use it”, “Check a synced folder”, “Use JSON in a script”,
“Create a verified transfer backup”, “Keep live database files out of sync”,
“Safety details”, “Develop and verify”, and “Privacy and license”. The command
blocks are commands, not sentences; their controls are result-naming verbs
(`scan`, `export`, `ignore`, and `demo`).

## What would make this perfect

Ship a generated, normalized recording of the real demo command and prove it
on every build; make registered CLI claims use that one isolated demo path;
restore focus and a polite announcement on every normal route transition;
register or remove every remaining claim; and complete the 404’s metadata and
shared shell. Then re-run this full review with no findings.
