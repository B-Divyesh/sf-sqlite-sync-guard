# Adversarial first-read review 4 — SQLite Sync Guard

Reviewed 2026-08-28 against commit
`0d64fa8ca0c7ccf88fa0cb2d1a26c54b3e03f5f7` and the live site at
<https://sqlite-sync-guard.sociobot.in>.

## Verdict: FAIL

The first screen, one-click demo, CLI sandbox, registered claim tests, build,
accessibility checks, routes, links, and visual identity pass. The product still
has four findings. One is the earlier claims-completeness finding `F-3-4`, which
is BLOCKING again because the registry omits three public behavior or privacy
statements. All 18 registered claim commands pass; the failure is that the
public claim set is larger than the registered set.

## Cold first read — before scrolling

Fresh Chromium contexts were opened at 390 × 844 and 1440 × 900. No scrolling
or interaction occurred before the visible text and screenshots were captured.

| Question | Answer at both viewports |
| --- | --- |
| What does it do? | It checks SQLite files before folder sync and creates a verified transfer backup. |
| For whom? | Developers syncing folders between computers. |
| What should I click first? | **Try it with sample data**; the adjacent sentence says it shows a live database scan and safe export. |

The exact text that makes this pass is “Check SQLite files before folder
sync,” “For developers syncing folders between computers, it finds unsafe
files and creates a verified transfer backup,” and “Try it with sample data” /
“See a live database scan and safe export.” The action and all three facts were
visible at 390 px. There was no horizontal overflow, update prompt, or console
error.

Evidence:

- `.factory/evidence/review-4/home-mobile-cold.png`
- `.factory/evidence/review-4/home-desktop-cold.png`

## Findings

### F-3-4 — BLOCKING: the README still overstates claims-registry completeness

- **Exact quote/location:** `README.md`, Develop, test, and package: “The
  claims registry maps the public behavior described here to runnable tests.”
- **Evidence:** `.factory/claims.json` has no entry whose claim covers the
  query demo entrance quoted in F-4-1. Its `demo-isolation` entry describes the
  CLI workspace, not `/?demo=1`. The privacy claims in F-4-2 and F-4-3 are also
  absent from the entry text and `where` fields. `assertClaimCoverage()` is a
  hand-maintained allow-list and omits those sentences.
- **Why this blocks:** review 3 raised this exact completeness problem. The
  repair added a partial mapping but retained a statement that is still false.
  The history rule makes an incomplete earlier finding blocking again under
  its original ID.
- **Concrete fix:** add exact registry entries and tagged tests for F-4-1
  through F-4-3, then make the coverage check extract or enumerate every
  public behavior sentence. Alternatively remove the omitted sentences and
  rewrite the README sentence to describe only the mapped scope.

### F-4-1 — The query demo entrance is an unlisted claim

- **Exact quote/location:** `README.md`, Try the isolated demo: “Opening
  `https://sqlite-sync-guard.sociobot.in/?demo=1` also enters the isolated
  demo.”
- **Evidence:** the behavior works live and `site/test-browser.mjs` exercises
  it, but no `.factory/claims.json` claim says that the query URL enters demo
  mode. The `demo-isolation` claim is specifically about the CLI workspace.
- **Why this matters:** a passing assertion hidden inside another claim's
  browser suite does not give this public behavior its required claim entry or
  one exact tagged test.
- **Concrete fix:** add `web-demo-entry` with a claim that `/?demo=1` replaces
  the route with `/demo/`, shows the demo banner and recording, and never
  exposes normal storage. Give it one `@claim:web-demo-entry` test.

### F-4-2 — The CLI current-folder privacy promise is not registered or fully exercised

- **Exact quote/location:** live `/privacy/`, “It does not read the folder
  where you run it.”
- **Evidence:** `demo-isolation` omits `/privacy/` from `where`. Its tagged test
  runs `demo()` from the checkout and does not observe filesystem reads from
  the current directory. A separate review run from an empty temporary current
  directory confirmed no file was written there, and source inspection shows
  the sample is compiled with `include_str!`, but neither check proves the
  exact public no-read statement in the registered sandbox.
- **Why this matters:** this is a privacy boundary a visitor may rely on. The
  registry promises an “untouched current directory,” while the assigned test
  does not assert that part of its own sandbox description.
- **Concrete fix:** either rewrite the page to the observable statement “The
  demo writes only to the temporary workspace it prints,” then assert a
  before/after current-directory tree, or add a Linux filesystem-access trace
  that rejects reads under a sentinel-filled current directory. Include
  `/privacy/` in the claim's `where` field.

### F-4-3 — The manifest source-path disclosure is unlisted and unasserted

- **Exact quote/location:** live `/privacy/`, “A manifest contains the source
  path you supplied, so inspect it before sharing.”
- **Evidence:** a review demo manifest did contain an absolute `source` value,
  but `@claim:verified-transfer` never asserts `manifest.source` and its
  registry `where` omits `/privacy/`.
- **Why this matters:** this sentence warns that an exported file can disclose
  a local path. A user deciding whether to share the manifest needs that field
  contract to be deliberate and tested.
- **Concrete fix:** extend the registered claim and `where` to include the
  privacy page, then assert that `manifest.source` equals the normalized source
  path supplied to `export`. Keep the privacy warning if that field remains.

## Demo and sandbox verification

- The first-screen action opened `/demo/` in one click.
- At 390 px, the banner, “Find an unsafe database before sync,” and the visible
  terminal recording were already on the first demo screen.
- The recording shows `active-session.db` as unsafe, `closed-project.db` as
  safe, and the transfer backup and manifest paths. Opening “Read demo
  transcript” exposes the same information as text.
- The persistent banner says “Demo — sample data, nothing is saved” and offers
  **Reset demo** and **Start for real**.
- Reset removed a seeded `demo:sqlite-sync-guard:test` key, preserved a seeded
  `sqlite-sync-guard:real` key, and announced the reset. Start for real returned
  to `/`, focused the home h1, and removed only demo-prefixed storage.
- After service-worker control, `/demo/` reloaded offline with HTTP 200, the
  demo h1, banner, and recording. The flow made no external request and set no
  cookie.
- The built CLI was run from a new empty `/tmp/sqlite-sync-guard-review4-cwd-*`
  directory. It created a distinct `/tmp/sqlite-sync-guard-demo-*` workspace,
  reported one unsafe WAL sample, exported a backup and manifest, and left its
  current directory empty.

## Registered claim execution

A clean local clone was created at
`/tmp/sqlite-sync-guard-review4-ocMzB3/repo`; it resolved to the reviewed SHA.
After `npm ci`, every command listed in `.factory/claims.json` was run
separately.

| Claim | Result | Observed scope |
| --- | --- | --- |
| `demo-recording` | PASS | Real command output matched the normalized SVG and transcript. |
| `demo-isolation` | PASS | Two distinct temporary workspaces; real scan, backup, and manifest. |
| `unsafe-detection` | PASS | Independent WAL, SHM, and rollback-journal samples. |
| `active-lock-detection` | PASS | Separate process held SQLite's lock range. |
| `exit-codes-json` | PASS | Safe 0, unsafe 2, error 1; both JSON positions. |
| `live-consistent-transfer` | PASS | Backup contained committed data and excluded an uncommitted row. |
| `verified-transfer` | PASS | Independent integrity, checksum, size, fields, refusal, and force. |
| `ignore-rules` | PASS | Syncthing, Resilio, preservation, repeats, and dry run. |
| `scan-read-only` | PASS | Database bytes remained unchanged. |
| `offline-demo` | PASS | Service-worker-controlled offline reload. |
| `no-telemetry` | PASS | Same-origin browser flow, no cookies, and CLI source/dependency audit. |
| `demo-reset` | PASS | Only the demo-prefixed namespace was cleared. |
| `mit-source` | PASS | LICENSE and Cargo metadata. |
| `bundled-sqlite` | PASS | Demo ran with a PATH that cannot contain `sqlite3`. |
| `help-output` | PASS | Root and every documented command supplied help. |
| `build-output` | PASS | Release CLI, `dist/site`, and routing configuration. |
| `dev-server` | PASS | Vite served the documentation home page. |
| `package-output` | PASS | `cargo package --locked` produced the crate. |

No registered test failed. Findings F-3-4 and F-4-1 through F-4-3 concern
public statements outside the exact registered claim set or assertions.

The same clean clone also passed `npm test`, `npm run check`, `npm run build`,
and `npm run check:site`. The build produced a 4.1 KB raw JavaScript bundle,
12.5 KB CSS, the release CLI, and `dist/site`.

## Copy audit

Counts below use whitespace-delimited words, ignore punctuation-only marks, and
treat paths or flags without spaces as one word. Executable command lines are
not prose. Repeated navigation and footer labels are consolidated by exact
text. No item exceeds 22 words and no banned marketing adjective appears.
Technical terms occur after the direct first-screen explanation and match the
developer audience. Output terminology remains **transfer backup** and
**manifest**; companion `-wal`, `-shm`, and `-journal` files are called
**journal files**.

### Landing-page sentences

| Words | Exact copy | Flag |
| ---: | --- | --- |
| 17 | Warn when SQLite files are unsafe to copy and create a verified transfer backup before folder sync. | Metadata; mapped behavior |
| 2 | You’re offline. | Conditional state |
| 7 | This guide and its sample still work. | `offline-demo` |
| 16 | For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. | Mapped behavior |
| 8 | See a live database scan and safe export. | Mapped demo behavior |
| 1 | Free. | `mit-source` |
| 2 | Runs locally. | Demo/CLI behavior |
| 2 | No telemetry. | `no-telemetry` |
| 15 | Printed collage showing journal pages stopped before sync and a tied transfer backup leaving safely | Image alternative |
| 3 | Live files stopped. | Figure caption |
| 3 | Transfer backup ready. | Figure caption |
| 9 | Warns before unsafe copies; does not sync database changes. | `unsafe-detection`; safety limit |
| 10 | Never open the same writable database from two synced computers. | Safety instruction |
| 14 | The scan warns when a database has journal files or is in active use. | `unsafe-detection`, `active-lock-detection` |
| 6 | Its exit code works in scripts. | `exit-codes-json` |
| 7 | Terminal-style image of the bundled CLI demo. | Image alternative; `demo-recording` |
| 4 | Read the transcript below. | Image alternative |
| 6 | SQLite’s backup function captures committed data. | `live-consistent-transfer` |
| 9 | The tool checks the new backup before publishing it. | `verified-transfer` |
| 6 | Capture one consistent point in time. | `live-consistent-transfer` |
| 8 | Verify the database and calculate its SHA-256 checksum. | `verified-transfer` |
| 7 | Copy the transfer backup and its manifest. | Workflow instruction |
| 11 | Reports database journal files and active use without changing the database. | Three registered CLI behaviors |
| 10 | Writes a checked `.backup.sqlite3` and a manifest with its checksum. | `verified-transfer` |
| 3 | Preserves other rules. | `ignore-rules` |
| 7 | Running it again leaves the file unchanged. | `ignore-rules` |
| 7 | Put `--json` before or after a command. | `exit-codes-json` |
| 12 | Scan exits 0 when safe, 2 when unsafe, and 1 on error. | `exit-codes-json` |
| 7 | Rust builds the CLI with SQLite included. | `bundled-sqlite` |
| 5 | A local SQLite safety tool. | Footer description |
| 5 | A newer guide is ready. | Conditional update state |
| 9 | Could not copy because this browser denied clipboard access. | Conditional error |
| 8 | The command is selected; press Ctrl+C or Command+C. | Conditional recovery |
| 11 | DEMO — isolated sample data; your files were not read or changed. | Recorded output; `demo-isolation` |
| 13 | DO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live. | Recorded result |
| 9 | Close writers or run `sqlite-sync-guard export <db> --output <dir>`. | Recorded next step |
| 8 | Delete this temporary workspace when you are finished. | Recorded cleanup instruction |

### Landing-page headings, controls, and standalone labels

| Words | Exact copy | Assessment |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | SQLite Sync Guard | Product name |
| 1 each | Demo · Commands · Privacy · Terms | Clear navigation |
| 5 | A local SQLite safety check | Clear context |
| 6 | Check SQLite files before folder sync | Clear h1; within nine words |
| 5 | Try it with sample data | Result-naming primary action |
| 3 | Check the files | Numbered section label |
| 7 | See whether files are safe to copy | Context-complete h2 |
| 7 | Normalized recording from the bundled CLI demo | Clear figure label |
| 3 | Read demo transcript | Result-naming disclosure |
| 3 | Make the transfer | Numbered section label |
| 5 | Create a verified transfer backup | Context-complete h2 |
| 2 / 1 / 1 | Back up · Check · Transfer | Ordered workflow labels |
| 3 | Use the tool | Numbered section label |
| 6 | Scan, export, or add ignore rules | Context-complete h2 |
| 2 | Read-only check | Command tag |
| 4 | Scan a synced folder | Context-complete h3 |
| 3 | Copy scan command | Result-naming button |
| 2 | Explicit write | Command tag |
| 4 | Export a transfer backup | Context-complete h3 |
| 3 | Copy export command | Result-naming button |
| 2 | Ignore rules | Command tag |
| 6 | Keep live files out of sync | Context-complete h3 |
| 3 | Copy ignore command | Result-naming button |
| 4 | Use JSON in scripts | Context-complete h3 |
| 4 | Ready for your files | Clear section label |
| 5 | Install from the public source | Context-complete h2 |
| 3 | Copy install command | Result-naming button |
| 3 | Read the source | Result-naming link |
| 2 | Reload update | Result-naming conditional button |
| 1 | Copied | Clear completion state |
| 2 / 3 / 2 / 3 | UNSAFE active-session.db · WAL sidecar present · SAFE closed-project.db · TRANSFER BACKUP CREATED | Recorded result labels |

### README sentences

| Words | Exact copy | Flag |
| ---: | --- | --- |
| 12 | SQLite Sync Guard checks database files before you copy a synced folder. | Mapped behavior |
| 8 | It warns about journal files and active use. | Registered detection behavior |
| 10 | It creates verified transfer backups and adds sync-client ignore rules. | Two registered behaviors |
| 11 | The tool does not make writes from two synced computers safe. | Safety limit |
| 10 | Use a transfer backup to move committed data between computers. | Transfer instruction |
| 9 | The command creates a new temporary workspace from `examples/sample.sql`. | `demo-isolation` |
| 8 | It runs the real scan and export code. | `demo-isolation` |
| 6 | It then prints the workspace path. | `demo-isolation` |
| 6 | The web demo is at `https://sqlite-sync-guard.sociobot.in/demo/`. | Route fact |
| 7 | Opening `https://sqlite-sync-guard.sociobot.in/?demo=1` also enters the isolated demo. | **F-4-1** |
| 7 | See `.factory/demo.md` for reset and isolation details. | Documentation link |
| 4 | The build includes SQLite. | `bundled-sqlite` |
| 7 | It does not need the `sqlite3` command. | `bundled-sqlite` |
| 10 | Exit code `0` means the files look safe to copy. | `exit-codes-json` |
| 12 | Exit code `2` means a journal file or active lock was found. | Detection and exit claims |
| 7 | Exit code `1` means the scan failed. | `exit-codes-json` |
| 5 | This writes `data.backup.sqlite3` and `data.backup.manifest.json`. | `verified-transfer` |
| 9 | The manifest records the backup checksum and byte size. | `verified-transfer` |
| 8 | It records the SQLite version and check result. | `verified-transfer` |
| 12 | It also records journal files and locks found beside the source database. | `verified-transfer` |
| 8 | Existing files are preserved unless you add `--force`. | `verified-transfer` |
| 10 | The command owns one marked block in the ignore file. | `ignore-rules` |
| 4 | It preserves other rules. | `ignore-rules` |
| 7 | A repeated run leaves the file unchanged. | `ignore-rules` |
| 6 | Run `sqlite-sync-guard --help` for every option. | `help-output` |
| 9 | `scan` reads file headers, names, and documented lock regions. | Registered scan behavior |
| 9 | It does not change the database while checking it. | `scan-read-only` |
| 17 | A `-wal`, `-shm`, or `-journal` file makes the set unsafe to copy, even without a visible lock. | `unsafe-detection` |
| 10 | `export` uses SQLite’s backup function and checks the completed file. | Transfer claims |
| 13 | Never open the same writable database from two computers through a synced folder. | Safety instruction |
| 9 | Run `npm run dev` to preview the documentation site. | `dev-server` |
| 9 | Run `cargo package --locked` to create the publishable crate. | `package-output` |
| 12 | The claims registry maps the public behavior described here to runnable tests. | **F-3-4** |
| 10 | `npm run build` creates the static publish directory at `dist/site`. | `build-output` |
| 13 | Deploy its contents with `staticwebapp.config.json` so routes and the 404 response stay configured. | `build-output` |
| 5 | Factory infrastructure owns the actual deployment. | Ownership statement |
| 6 | See the privacy page and terms. | Documentation links |

### README headings and lead-ins

| Words | Exact copy | Assessment |
| ---: | --- | --- |
| 3 | SQLite Sync Guard | Product name |
| 4 | Try the isolated demo | Context-complete h2 |
| 1 | Install | Context-complete h2 |
| 5 | Install from the public source | Clear lead-in |
| 4 | Use SQLite Sync Guard | Context-complete h2 |
| 4 | Check a synced folder | Clear lead-in |
| 5 | Use JSON in a script | Clear lead-in |
| 5 | Create a verified transfer backup | Clear lead-in |
| 7 | Keep live database files out of sync | Clear lead-in |
| 2 | Safety details | Context-complete h2 |
| 4 | Develop, test, and package | Context-complete h2 |
| 1 | Deploy | Context-complete h2 |
| 3 | Privacy and license | Context-complete h2 |
| 5 | MIT © 2026 Sociobot (Param Factory) | License attribution |

## Structure, links, privacy, and accessibility

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. An unknown route
  returns the designed risograph 404 with HTTP 404 and `noindex`.
- Every public route has `lang="en"`, one h1, one main landmark, a route title,
  description, canonical, Open Graph/Twitter metadata, favicon, and 180 px
  Apple icon. The noindex 404 intentionally omits a canonical but retains the
  rest of the product metadata. The social card is 1200 × 630.
- Titles are route-specific and at most 50 characters. `robots.txt` and
  `sitemap.xml` return 200 and list the four public routes.
- Every distinct internal route, query entrance, asset link, source link, and
  issue-tracker link was crawled and returned 200. Every hash target exists.
- Normal Demo, Privacy, Terms, Home, Commands, Start for real, Back, and Forward
  navigation focuses and announces the destination. A footer navigation and
  Back exercise restored the prior 390 px scroll position.
- Live axe-core 4.11.0 found zero WCAG A/AA/2.1-AA violations on all four
  public routes and the 404. The 390 px page has no horizontal overflow;
  interactive targets are at least 44 px; reduced motion reduces animation and
  transitions to `0.00001s`.
- The live CSP is self-only. Security headers include HSTS, `nosniff`, strict
  origin referrer policy, and disabled camera, microphone, and geolocation.
- The risograph guarded-handoff collage, paper palette, hard print shadows,
  system serif/monospace pairing, and registration motion match
  `.factory/design.md`. The result is product-specific, not a generic SaaS
  template.

## Earlier finding verification

Every earlier review, polish report, verification, and handoff was read. The
following checks were repeated against live behavior and current code/tests.

| Earlier ID | Current verification | Result |
| --- | --- | --- |
| F-1-1 | Direct h1, audience, sample action, result sentence, and three facts at both viewports. | Fixed |
| F-1-2 | One-click web demo, banner, reset/start actions, real CLI demo, and temporary workspace. | Fixed |
| F-1-3 | Claims registry and 18 tagged tests exist. Completeness is separately reopened as F-3-4. | Fixed as scoped |
| F-1-4 | Live service-worker-controlled demo reloads offline. | Fixed |
| F-1-5 | Live copy says “Warns,” not “prevents.” | Fixed |
| F-1-6 | MIT and no-telemetry entries pass; browser requests and cookies are clean. | Fixed |
| F-1-7 | No unproved platform or release-download promise remains. | Fixed |
| F-1-8 | Generated recording matches the normalized real demo command. | Fixed |
| F-1-9 | Safe, unsafe, and error exits plus both JSON positions are asserted. | Fixed |
| F-1-10 | A live WAL writer test proves committed-only transfer content. | Fixed |
| F-1-11 | Independent SQLite integrity and SHA-256 checks pass. | Fixed |
| F-1-12 | The earlier README manifest fields, overwrite refusal, and force path are asserted. F-4-3 is a new privacy field omission. | Fixed as scoped |
| F-1-13 | Syncthing and Resilio writes, preservation, repeat bytes, and dry run pass. | Fixed |
| F-1-14 | `--json` works before and after the command. | Fixed |
| F-1-15 | The broad service/account/network sentence remains removed. | Fixed |
| F-1-16 | Static-binary wording remains removed; bundled SQLite passes without `sqlite3`. | Fixed |
| F-1-17 | Concurrent writers are presented as a safety warning, not a capability. | Fixed |
| F-1-18 | Scan leaves copied database bytes unchanged. | Fixed |
| F-1-19 | WAL, SHM, and journal each use a separate otherwise-safe workspace. | Fixed |
| F-1-20 | A separate process holds the actual database lock range in the registered test. | Fixed |
| F-1-21 | The unproved one-filesystem-operation sentence remains removed. | Fixed |
| F-1-22 | Detailed test-suite outcome advertising remains removed. | Fixed |
| F-1-23 | Exact unsupported toolchain minimum promises remain removed. | Fixed |
| F-1-24 | Help, build, dev server, and package outcomes are registered and pass. | Fixed |
| F-1-25 | Affiliation wording remains a Terms disclosure. | Fixed |
| F-1-26 | `/demo/` works and unknown routes use the product 404 with HTTP 404. | Fixed |
| F-1-27 | Skip, normal route, history focus, announcements, and visible-link scroll restoration pass. | Fixed |
| F-1-28 | Immediate and steady-state live axe checks have no contrast violation. | Fixed |
| F-1-29 | Canonical, OG/Twitter, social image, favicon, and Apple icon are present. | Fixed |
| F-1-30 | Robots and sitemap are live and complete. | Fixed |
| F-1-31 | Shared header/footer, one-liner, factory credit, version, and build id remain. | Fixed |
| F-1-32 | Neither fresh cold context showed an update prompt. | Fixed |
| F-1-33 | Transfer backup and manifest terminology remains consistent. | Fixed |
| F-1-34 | The first screen uses task language; technical terms occur in later developer detail. | Fixed |
| F-1-35 | “Source observations” remains replaced with journal-file and lock wording. | Fixed |
| F-1-36 | Copy controls name the command they copy. | Fixed |
| F-1-37 | Synthetic sample toggles remain replaced by the generated recording. | Fixed |
| F-1-38 | Landing headings remain task-specific and context-complete. | Fixed |
| F-1-39 | README introduction remains split into short sentences. | Fixed |
| F-1-40 | README exit outcomes remain separate sentences. | Fixed |
| F-1-41 | The long browser-suite advertisement remains removed. | Fixed |
| F-1-42 | Home title is plain, route-specific, and 50 characters. | Fixed |
| F-1-43 | Clipboard denial selects the command and gives exact recovery keys. | Fixed |
| F-2-1 | SVG and readable transcript match normalized real CLI output. | Fixed |
| F-2-2 | Each CLI claim helper starts with a fresh `demo --json` workspace. | Fixed |
| F-2-3 | Home and Commands focus/announcement paths pass live. | Fixed |
| F-2-4 | The specific version, suite, CLI-network, and privacy-sale quotes remain removed. | Fixed |
| F-2-5 | The 404 retains the shared shell, metadata, `noindex`, and home route. | Fixed |
| F-3-1 | “Read demo transcript” exposes the complete terminal text. | Fixed |
| F-3-2 | README heading is “Use SQLite Sync Guard.” | Fixed |
| F-3-3 | README names `dist/site`, routing configuration, and factory deployment ownership. | Fixed |
| F-3-4 | The completeness sentence remains, but the mapping omits F-4-1 through F-4-3. | **Incomplete; BLOCKING** |

## Missed leverage

No additional AI feature is justified for a deterministic SQLite safety CLI.
The brief-implied scan, verified export, and Syncthing/Resilio ignore-rule paths
are present. The product correctly states that it does not synchronize or merge
database changes; adding a decorative AI step would not improve this job.

## What would make this perfect

Register and independently test the query demo entrance, the CLI current-folder
privacy boundary, and the manifest source-path disclosure. Replace the
hand-maintained partial coverage assertion with a complete public-copy mapping,
or narrow the README's completeness sentence to an exact tested scope. Then
repeat the full cold, demo, claims, copy, history, routing, offline, privacy,
and accessibility review. Nothing else remains from this round.
