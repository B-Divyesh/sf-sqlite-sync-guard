# Copy audit — polish 4

Reviewed 2026-08-28 against the rendered landing page, demo, legal pages,
404, and README. Commands are excluded because they are executable input.
Every prose sentence is 22 words or fewer. No banned marketing word appears.
The first screen can be read in one breath: it says the job, audience, first
action, outcome, and three facts.

## Landing-page copy inventory

| Words | Copy |
| ---: | --- |
| 17 | Warn when SQLite files are unsafe to copy and create a verified transfer backup before folder sync. |
| 4 | Skip to main content |
| 5 | A local SQLite safety check |
| 6 | Check SQLite files before folder sync |
| 16 | For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. |
| 5 | Try it with sample data |
| 8 | See a live database scan and safe export. |
| 1 | Free. |
| 2 | Runs locally. |
| 2 | No telemetry. |
| 15 | Printed collage showing journal pages stopped before sync and a tied transfer backup leaving safely |
| 3 | Live files stopped. |
| 3 | Transfer backup ready. |
| 9 | Warns before unsafe copies; does not sync database changes. |
| 10 | Never open the same writable database from two synced computers. |
| 3 | Check the files |
| 6 | See whether files are safe to copy |
| 14 | The scan warns when a database has journal files or is in active use. |
| 6 | Its exit code works in scripts. |
| 7 | Normalized recording from the bundled CLI demo |
| 7 | Terminal-style image of the bundled CLI demo. |
| 4 | Read the transcript below. |
| 3 | Read demo transcript |
| 3 | Make the transfer |
| 5 | Create a verified transfer backup |
| 7 | SQLite’s backup function captures committed data. |
| 9 | The tool checks the new backup before publishing it. |
| 1 | Back up |
| 6 | Capture one consistent point in time. |
| 1 | Check |
| 8 | Verify the database and calculate its SHA-256 checksum. |
| 1 | Transfer |
| 6 | Copy the transfer backup and its manifest. |
| 3 | Use the tool |
| 6 | Scan, export, or add ignore rules |
| 2 | Read-only check |
| 4 | Scan a synced folder |
| 9 | Reports database journal files and active use without changing the database. |
| 2 | Explicit write |
| 4 | Export a transfer backup |
| 10 | Writes a checked `.backup.sqlite3` and a manifest with its checksum. |
| 2 | Ignore rules |
| 5 | Keep live files out of sync |
| 3 | Preserves other rules. |
| 7 | Running it again leaves the file unchanged. |
| 4 | Use JSON in scripts |
| 7 | Put `--json` before or after a command. |
| 11 | Scan exits 0 when safe, 2 when unsafe, and 1 on error. |
| 4 | Ready for your files |
| 5 | Install from the public source |
| 8 | Rust builds the CLI with SQLite included. |
| 3 | Copy install command |
| 3 | Read the source |
| 5 | A local SQLite safety tool. |

## Demo, legal, and README inventory

| Words | Copy |
| ---: | --- |
| 6 | Demo — sample data, nothing is saved |
| 2 | Reset demo |
| 3 | Start for real |
| 3 | Isolated sample workspace |
| 6 | Find an unsafe database before sync |
| 11 | This normalized recording is generated from the bundled `sqlite-sync-guard demo` command. |
| 5 | Run the same demo locally |
| 7 | The CLI creates a new temporary workspace. |
| 14 | It writes the sample, transfer backup, and manifest only there, then prints the location. |
| 4 | Privacy without data collection |
| 18 | The CLI demo writes its sample database, transfer backup, and manifest only inside the temporary workspace it prints. |
| 5 | The website uses no tracking |
| 12 | This static guide has no analytics, cookies, advertising, accounts, or third-party runtime content. |
| 11 | The host may process basic request details for security and delivery. |
| 6 | You decide where transfer backups go. |
| 14 | A manifest records the absolute source path you supplied, so inspect it before sharing. |
| 4 | Terms and safety limits |
| 11 | The tool does not make writes from two synced computers safe. |
| 8 | It does not merge data or repair existing corruption. |
| 7 | This page slipped out of the folder |
| 10 | The address does not match a page in this guide. |
| 2 | Return home |
| 11 | SQLite Sync Guard checks database files before you copy a synced folder. |
| 8 | It warns about journal files and active use. |
| 8 | It creates verified transfer backups and adds sync-client ignore rules. |
| 11 | Use a transfer backup to move committed data between computers. |
| 9 | The command creates a new temporary workspace from `examples/sample.sql`. |
| 8 | It runs the real scan and export code. |
| 15 | It writes only inside that workspace, so the folder where you run it stays unchanged. |
| 6 | The web demo is at `https://sqlite-sync-guard.sociobot.in/demo/`. |
| 7 | Opening `https://sqlite-sync-guard.sociobot.in/?demo=1` also enters the isolated demo. |
| 4 | Use SQLite Sync Guard |
| 11 | Exit code 0 means the files look safe to copy. |
| 12 | Exit code 2 means a journal file or active lock was found. |
| 7 | Exit code 1 means the scan failed. |
| 7 | The manifest records the backup checksum and byte size. |
| 8 | It records the SQLite version and check result. |
| 12 | It also records journal files and locks found beside the source database. |
| 9 | The manifest records the absolute source path you supplied. |
| 4 | Inspect it before sharing. |
| 8 | Existing files are preserved unless you add --force. |
| 10 | The command owns one marked block in the ignore file. |
| 4 | It preserves other rules. |
| 7 | A repeated run leaves the file unchanged. |
| 7 | Run the help command for every option. |
| 9 | Scan does not change the database while checking it. |
| 17 | A WAL, SHM, or journal file makes the set unsafe to copy, even without a visible lock. |
| 10 | Export uses SQLite’s backup function and checks the completed file. |
| 11 | Run npm run dev to preview the documentation site. |
| 10 | Run cargo package --locked to create the publishable crate. |
| 12 | Claim annotations in the public copy map each tested behavior to `.factory/claims.json`. |
| 10 | `npm run build` creates the static publish directory at `dist/site`. |
| 13 | Deploy its contents with `staticwebapp.config.json` so routes and the 404 response stay configured. |

## Terminology

| Concept | One term |
| --- | --- |
| exported SQLite database | transfer backup |
| JSON metadata beside a backup | manifest |
| WAL, SHM, or rollback journal companion | journal file |
| directory copied by another program | synced folder |
| temporary sample area | demo workspace |

## Conditional and recorded copy

| Words | Copy |
| ---: | --- |
| 2 | You’re offline. |
| 7 | This guide and its sample still work. |
| 5 | A newer guide is ready. |
| 2 | Reload update |
| 9 | Could not copy because this browser denied clipboard access. |
| 8 | The command is selected; press Ctrl+C or Command+C. |
| 11 | DEMO — bundled sample data; output stays in the workspace printed below. |
| 13 | DO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live. |
| 9 | Close writers or run sqlite-sync-guard export with an output directory. |
| 8 | Delete this temporary workspace when you are finished. |

The catalog sentence is 12 words and 76 characters: “Check SQLite files
before folder sync and create a verified transfer backup.” It starts with a
verb. No sentence-length, banned-word, terminology, first-screen, or
unlisted-claim flag remains. Source-level annotations in
`site/test-claims.mjs` map every tested public behavior to its exact registry
entry, including the query demo, CLI workspace, and manifest path boundaries.
