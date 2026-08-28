# Adversarial first-read review 5 — SQLite Sync Guard

Reviewed 2026-08-28 against remote and checked-out commit
`343a0ff264ef0712ff239d8ded5d82f8c33f7f31` and the live site at
<https://sqlite-sync-guard.sociobot.in>.

## Verdict: PASS

There are zero findings. The live product is clear, tryable, honest, and all
registered claims passed from a clean remote clone.

## Cold first read

Fresh Chromium contexts opened `/` before scrolling at 390 × 844 and 1440 ×
900. Both screens answered the required questions:

| Question | Answer in my own words | Exact establishing copy |
| --- | --- | --- |
| What does it do? | Checks SQLite files before sync and makes a safe transfer backup. | “Check SQLite files before folder sync” |
| For whom? | Developers synchronizing folders between computers. | “For developers syncing folders between computers…” |
| First click? | Try the sample to see scan and export results. | “Try it with sample data” / “See a live database scan and safe export.” |

At 390 px, the headline, audience, primary action, outcome, and “Free.”,
“Runs locally.”, and “No telemetry.” were above the fold, with no overflow,
update toast, or console error. At desktop, the same content ended at y=696.
The cold captures are in `/tmp/sqlite-sync-guard-review-5-live/` and
`/tmp/sqlite-sync-guard-review-5-desktop.png` in this review container.

## Copy audit

Counts are whitespace-delimited. Command blocks are executable input rather
than prose. The following is the complete landing and README sentence
inventory; no item is over 22 words or contains a banned marketing adjective.

### Landing

| Words | Sentence |
| ---: | --- |
| 17 | Warn when SQLite files are unsafe to copy and create a verified transfer backup before folder sync. |
| 7 | This guide and its sample still work. |
| 16 | For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. |
| 8 | See a live database scan and safe export. |
| 1 / 2 / 2 | Free. / Runs locally. / No telemetry. |
| 15 | Printed collage showing journal pages stopped before sync and a tied transfer backup leaving safely. |
| 3 / 3 | Live files stopped. / Transfer backup ready. |
| 9 | Warns before unsafe copies; does not sync database changes. |
| 10 | Never open the same writable database from two synced computers. |
| 14 | The scan warns when a database has journal files or is in active use. |
| 6 | Its exit code works in scripts. |
| 7 / 4 | Terminal-style image of the bundled CLI demo. / Read the transcript below. |
| 6 / 9 | SQLite’s backup function captures committed data. / The tool checks the new backup before publishing it. |
| 6 / 8 / 7 | Capture one consistent point in time. / Verify the database and calculate its SHA-256 checksum. / Copy the transfer backup and its manifest. |
| 11 | Reports database journal files and active use without changing the database. |
| 10 | Writes a checked `.backup.sqlite3` and a manifest with its checksum. |
| 3 / 7 | Preserves other rules. / Running it again leaves the file unchanged. |
| 7 / 11 | Put `--json` before or after a command. / Scan exits 0 when safe, 2 when unsafe, and 1 on error. |
| 8 | Rust builds the CLI with SQLite included. |
| 5 | A local SQLite safety tool. |
| 5 | A newer guide is ready. |
| 9 / 8 | Could not copy because this browser denied clipboard access. / The command is selected; press Ctrl+C or Command+C. |
| 11 | DEMO — bundled sample data; output stays in the workspace printed below. |
| 13 | DO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live. |
| 9 / 8 | Close writers or run sqlite-sync-guard export with an output directory. / Delete this temporary workspace when you are finished. |

The heading list is contextual: “Check SQLite files before folder sync,” “See
whether files are safe to copy,” “Create a verified transfer backup,” “Scan,
export, or add ignore rules,” and “Install from the public source.” All visible
buttons name outcomes: Try sample data, Read transcript, Copy scan/export/
ignore/install command, or Reload update. Required demo actions are Reset demo
and Start for real.

### README

| Words | Sentence |
| ---: | --- |
| 11 / 8 / 10 | SQLite Sync Guard checks database files before you copy a synced folder. / It warns about journal files and active use. / It creates verified transfer backups and adds sync-client ignore rules. |
| 11 / 8 | The tool does not make writes from two synced computers safe. / Use a transfer backup to move committed data between computers. |
| 11 / 8 / 15 | The command creates a new temporary workspace from `examples/sample.sql`. / It runs the real scan and export code. / It writes only inside that workspace, so the folder where you run it stays unchanged. |
| 8 / 7 | The web demo is at `https://sqlite-sync-guard.sociobot.in/demo/`. / Opening `https://sqlite-sync-guard.sociobot.in/?demo=1` also enters the isolated demo. |
| 6 / 7 | The build includes SQLite. / It does not need the `sqlite3` command. |
| 11 / 12 / 7 | Exit code `0` means the files look safe to copy. / Exit code `2` means a journal file or active lock was found. / Exit code `1` means the scan failed. |
| 8 / 9 / 8 / 12 / 9 / 4 | This writes `data.backup.sqlite3` and `data.backup.manifest.json`. / The manifest records the backup checksum and byte size. / It records the SQLite version and check result. / It also records journal files and locks found beside the source database. / The manifest records the absolute source path you supplied. / Inspect it before sharing. |
| 8 | Existing files are preserved unless you add `--force`. |
| 10 / 4 / 7 | The command owns one marked block in the ignore file. / It preserves other rules. / A repeated run leaves the file unchanged. |
| 7 | Run `sqlite-sync-guard --help` for every option. |
| 10 / 17 / 10 | Scan does not change the database while checking it. / A WAL, SHM, or journal file makes the set unsafe to copy, even without a visible lock. / Export uses SQLite’s backup function and checks the completed file. |
| 11 / 10 | Run npm run dev to preview the documentation site. / Run cargo package --locked to create the publishable crate. |
| 12 | Claim annotations in the public copy map each tested behavior to `.factory/claims.json`. |
| 10 / 13 | `npm run build` creates the static publish directory at `dist/site`. / Deploy its contents with `staticwebapp.config.json` so routes and the 404 response stay configured. |

Terms remain consistent: **transfer backup**, **manifest**, **journal file**,
and **synced folder**. README headings (“Try the isolated demo,” “Use SQLite
Sync Guard,” “Safety details,” “Develop, test, and package,” and “Deploy”) are
meaningful without their surrounding paragraphs. All behavior copy is annotated
and `assertClaimCoverage()` maps it to a registry entry and exact test.

## Demo, claims, and sandbox

The first-screen `/?demo=1` link replaced itself with `/demo/` in one click.
The first demo screen already displayed an unsafe `active-session.db`, safe
`closed-project.db`, the transfer backup and manifest paths, and a readable
transcript. Its persistent banner was “Demo — sample data, nothing is saved”
with Reset demo and Start for real.

Fresh browser storage sentinels verified that Reset removes only
`demo:sqlite-sync-guard:*`; normal storage survives. Start for real discards
only demo storage and focuses the home h1. With service-worker control, demo
reloaded offline with its banner and recording. Runtime interception saw only
same-origin requests and the context had no cookies.

`cargo run --quiet -- demo --json`, launched from a temporary directory,
created a unique `/tmp/sqlite-sync-guard-demo-*` workspace, reported one unsafe
WAL database and one safe database, and put the backup and manifest only in
that workspace. The current directory was unchanged. The landing recording and
text transcript matched normalized real demo output.

I cloned remote `main` cleanly to
`/tmp/sqlite-sync-guard-review5-2leSpJ/repo`, ran `npm ci`, and ran every exact
claim command individually. All 19 passed: `demo-recording`, `demo-isolation`,
`web-demo-entry`, `unsafe-detection`, `active-lock-detection`,
`exit-codes-json`, `live-consistent-transfer`, `verified-transfer`,
`ignore-rules`, `scan-read-only`, `offline-demo`, `no-telemetry`, `demo-reset`,
`mit-source`, `bundled-sqlite`, `help-output`, `build-output`, `dev-server`,
and `package-output`. The same clone passed `npm test`, `npm run check`, and
`npm run check:site`; release CLI, `dist/site`, and the crate artifact exist.

## Earlier findings confirmed fixed

I read every prior review, polish record, demo record, and handoff, and checked
the following individually on the present live product and code:

| Finding IDs | Current confirmation |
| --- | --- |
| F-1-1 | Direct headline, named audience, first action, outcome, and facts remain above the mobile fold. |
| F-1-2 | Real CLI/web demo, sample, namespace isolation, reset, and start controls work. |
| F-1-3 | Nineteen exact mapped claims and the coverage check pass. |
| F-1-4 | Service-worker-controlled demo reload works offline. |
| F-1-5 | “Warns before unsafe copies” replaces prevention overclaim; detection passes. |
| F-1-6 | MIT and no-telemetry are separately tested; requests/cookies are clean. |
| F-1-7 | Unsupported platform and release-download promises are absent. |
| F-1-8 | Recording/transcript come from the actual CLI demo. |
| F-1-9 | All three scan exits and JSON placement are tested. |
| F-1-10 | Open-WAL committed-only backup claim passes. |
| F-1-11 | Integrity and SHA-256 are independently checked. |
| F-1-12 | Manifest fields, source path, refusal, and force are asserted. |
| F-1-13 | Syncthing and Resilio preserve/repeat; dry run does not write. |
| F-1-14 | Both documented JSON positions parse. |
| F-1-15 | Broad service/network promise is removed. |
| F-1-16 | Static-binary promise is removed; bundled SQLite runs without sqlite3. |
| F-1-17 | Concurrent-writer limitation is a plain safety instruction. |
| F-1-18 | Scan byte-preservation test passes. |
| F-1-19 | Fresh WAL, SHM, and journal fixtures assert exact sidecar/database. |
| F-1-20 | A real externally held SQLite lock is detected. |
| F-1-21 | Atomic-publication assertion remains removed. |
| F-1-22 | Unproved test-suite advertisement remains removed. |
| F-1-23 | Unproved minimum-version claim remains removed. |
| F-1-24 | Help/build/dev/package claims each have tests. |
| F-1-25 | Ownership wording is scoped to Terms. |
| F-1-26 | `/demo/` is real; unknown paths return styled HTTP 404. |
| F-1-27 | Route, hash, and history focus plus restored scroll pass. |
| F-1-28 | Immediate axe has zero violations; required text is not faded. |
| F-1-29 | Route metadata, icons, canonical/noindex policy, and social tags exist. |
| F-1-30 | Live robots and sitemap return 200. |
| F-1-31 | Every route and 404 share header/footer/legal shell. |
| F-1-32 | A fresh context has no update prompt. |
| F-1-33 | Copy consistently uses transfer backup and manifest. |
| F-1-34 | Plain task language precedes technical detail. |
| F-1-35 | README uses journal-file and active-use wording. |
| F-1-36 | Copy controls name their copied result. |
| F-1-37 | Real recording replaces fixture toggles. |
| F-1-38 | Landing and README heading lists are contextual. |
| F-1-39 | README opening sentences are below 22 words. |
| F-1-40 | README exit sentences are below 22 words. |
| F-1-41 | Overlong browser-test copy remains removed. |
| F-1-42 | Home title is plain-language and 50 characters after product name. |
| F-1-43 | Clipboard failure explains reason and recovery keys. |
| F-2-1 | Normalized SVG/text matches fresh CLI demo. |
| F-2-2 | CLI behavior claims begin in fresh `demo()` workspaces. |
| F-2-3 | Normal/hash navigation focuses and announces targets. |
| F-2-4 | Public claims are mechanically mapped to IDs, locations, and tests. |
| F-2-5 | 404 has full shell and metadata/noindex. |
| F-3-1 | Complete terminal result has a readable transcript. |
| F-3-2 | “Use SQLite Sync Guard” is contextual. |
| F-3-3 | README documents deploy output and routing configuration. |
| F-3-4 | Registry completeness check passes. |
| F-4-1 | Query demo entry has an exact browser claim. |
| F-4-2 | Observable write boundary and sentinel CWD assertion replace no-read promise. |
| F-4-3 | Privacy source-path disclosure is registered and asserted. |

## Structure, identity, and missed leverage

`/`, `/demo/`, `/privacy/`, and `/terms/` returned 200; the designed unknown
route returned 404. Each has one h1/main, route title, description, canonical
or noindex policy, OG/Twitter metadata, favicon/apple icon, and the shared
wordmark/nav/footer. Eight crawled links returned success. Skip links,
keyboard route focus, live announcements, back/forward behavior, no console
errors, and zero axe WCAG 2 A/AA/2.1 AA violations passed.

The cream stock, teal/vermilion misregistration, halftone original art,
hard-offset controls, and editorial/monospace typography follow the recorded
risograph thesis and are distinct from a generic SaaS template. AI is not a
missing feature: scan, supported SQLite backup, checksums, and ignore rules are
deterministic local work where a model would weaken the offline/privacy design.

## What would make this perfect

Keep this result true for each release: rerun the clean-clone claim sweep and
live browser audit, regenerate the recording whenever CLI output changes, and
keep public-copy annotations aligned with claims. No in-scope product change is
currently required.

