# SQLite Sync Guard

SQLite Sync Guard checks database files before you copy a synced folder. It warns about active use and SQLite journal files. It can create a verified transfer backup and add rules for Syncthing or Resilio Sync.

The tool does not make writes from two synced computers safe. Use a transfer backup to move committed data between computers.

## Try the isolated demo

```sh
cargo run -- demo
```

The command creates a new temporary workspace from the bundled sample. It runs the real scan and export code, then prints the workspace path. Your files are never read. The web demo is at <https://sqlite-sync-guard.sociobot.in/demo/>.

See [`.factory/demo.md`](.factory/demo.md) for reset and isolation details.

## Install

Install from the public source:

```sh
cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard
```

The build includes SQLite. It does not need the `sqlite3` command.

## Use it

Check a synced folder:

```sh
sqlite-sync-guard scan ~/Sync
```

Exit code `0` means the files look safe to copy. Exit code `2` means a journal file or active lock was found. Exit code `1` means the scan failed.

Use JSON in a script:

```sh
sqlite-sync-guard --json scan ~/Sync
sqlite-sync-guard scan ~/Sync --json
```

Create a verified transfer backup:

```sh
sqlite-sync-guard export ~/Sync/app/data.db --output ~/Transfers
```

This writes `data.backup.sqlite3` and `data.backup.manifest.json`. The manifest records the checksum, size, source observations, SQLite version, and check result. Existing files are preserved unless you add `--force`.

Keep live database files out of sync:

```sh
sqlite-sync-guard ignore ~/Sync --client syncthing
sqlite-sync-guard ignore ~/Sync --client resilio --dry-run
```

The command owns one marked block in the ignore file. It preserves other rules. A repeated run leaves the file unchanged. Run `sqlite-sync-guard --help` for every option.

## Safety details

- `scan` reads file headers, names, and documented lock regions. It does not change the database while checking it.
- A `-wal`, `-shm`, or `-journal` file makes the set unsafe to copy, even without a visible lock.
- `export` uses SQLite’s backup function and checks the completed file. It publishes the completed file in one filesystem operation.
- Never open the same writable database from two computers through a synced folder.

## Develop and verify

Use Rust 1.85 or newer, Node.js 20 or newer, and npm 10 or newer.

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
npm run test:claims
```

`npm run build` creates the release CLI and `dist/site`. `npm run dev` starts the local documentation site. `cargo package --locked` creates the publishable crate; the factory owns publishing.

The test suite checks the CLI, demo, site, accessibility, privacy, offline reload, and update path. See [`.factory/claims.json`](.factory/claims.json) for each public claim and its test.

## Privacy and license

The CLI has no telemetry or network client. The documentation site loads no analytics, third-party scripts, or third-party fonts. See the [privacy page](https://sqlite-sync-guard.sociobot.in/privacy/) and [terms](https://sqlite-sync-guard.sociobot.in/terms/).

MIT © 2026 Sociobot (Param Factory)
