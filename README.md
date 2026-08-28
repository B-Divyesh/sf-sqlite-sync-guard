# SQLite Sync Guard

SQLite Sync Guard checks database files before you copy a synced folder. It warns about journal files and active use. It creates verified transfer backups and adds sync-client ignore rules.
<!-- claims: unsafe-detection active-lock-detection verified-transfer ignore-rules -->

The tool does not make writes from two synced computers safe. Use a transfer backup to move committed data between computers.

## Try the isolated demo

```sh
cargo run -- demo
```

The command creates a new temporary workspace from `examples/sample.sql`. It runs the real scan and export code. It writes only inside that workspace, so the folder where you run it stays unchanged.
<!-- claim: demo-isolation -->

The web demo is at <https://sqlite-sync-guard.sociobot.in/demo/>. Opening <https://sqlite-sync-guard.sociobot.in/?demo=1> also enters the isolated demo.
<!-- claim: web-demo-entry -->

See [`.factory/demo.md`](.factory/demo.md) for reset and isolation details.

## Install

Install from the public source:

```sh
cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard
```

The build includes SQLite. It does not need the `sqlite3` command.
<!-- claim: bundled-sqlite -->

## Use SQLite Sync Guard

Check a synced folder:

```sh
sqlite-sync-guard scan ~/Sync
```

Exit code `0` means the files look safe to copy. Exit code `2` means a journal file or active lock was found. Exit code `1` means the scan failed.
<!-- claims: exit-codes-json active-lock-detection -->

Use JSON in a script:

```sh
sqlite-sync-guard --json scan ~/Sync
sqlite-sync-guard scan ~/Sync --json
```
<!-- claim: exit-codes-json -->

Create a verified transfer backup:

```sh
sqlite-sync-guard export ~/Sync/app/data.db --output ~/Transfers
```

This writes `data.backup.sqlite3` and `data.backup.manifest.json`. The manifest records the backup checksum and byte size. It records the SQLite version and check result. It also records journal files and locks found beside the source database. The manifest records the absolute source path you supplied. Inspect it before sharing. Existing files are preserved unless you add `--force`.
<!-- claim: verified-transfer -->

Keep live database files out of sync:

```sh
sqlite-sync-guard ignore ~/Sync --client syncthing
sqlite-sync-guard ignore ~/Sync --client resilio --dry-run
```

The command owns one marked block in the ignore file. It preserves other rules. A repeated run leaves the file unchanged. Run `sqlite-sync-guard --help` for every option.
<!-- claims: ignore-rules help-output -->

## Safety details

- `scan` reads file headers, names, and documented lock regions. It does not change the database while checking it. <!-- claims: scan-read-only active-lock-detection -->
- A `-wal`, `-shm`, or `-journal` file makes the set unsafe to copy, even without a visible lock. <!-- claim: unsafe-detection -->
- `export` uses SQLite’s backup function and checks the completed file. <!-- claims: live-consistent-transfer verified-transfer -->
- Never open the same writable database from two computers through a synced folder.

## Develop, test, and package

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
npm run test:claims
```

Run `npm run dev` to preview the documentation site. Run `cargo package --locked` to create the publishable crate.
<!-- claims: dev-server package-output -->

Claim annotations in the public copy map each tested behavior to [`.factory/claims.json`](.factory/claims.json).

## Deploy

`npm run build` creates the static publish directory at `dist/site`. Deploy its contents with `staticwebapp.config.json` so its routes and 404 response stay configured. Factory infrastructure owns the actual deployment.
<!-- claim: build-output -->

## Privacy and license

See the [privacy page](https://sqlite-sync-guard.sociobot.in/privacy/) and [terms](https://sqlite-sync-guard.sociobot.in/terms/).

MIT © 2026 Sociobot (Param Factory)
<!-- claim: mit-source -->
