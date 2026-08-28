# SQLite Sync Guard

SQLite Sync Guard is a small, cross-platform preflight for developers who sync
folders between computers. It finds SQLite databases and their WAL, SHM, and
rollback-journal companions, reports active SQLite locks, makes a consistent
backup with a transfer manifest, and can write ignore rules for Syncthing or
Resilio Sync.

It prevents unsafe file copying. It does **not** make concurrent SQLite writes
across devices safe, merge profiles, or replace a replication system.

## Install

Prebuilt binaries are not published yet. Install the current source from the
public repository instead:

```sh
cargo install --git https://github.com/B-Divyesh/sf-sqlite-sync-guard
```

SQLite is bundled into the binary; a system SQLite installation is not needed.

## Usage

Check a sync root before copying it:

```sh
sqlite-sync-guard scan ~/Sync
```

Exit code `0` means no unsafe live sets were found, `2` means at least one
database has a sidecar or active lock, and `1` means the scan could not be
completed. Use JSON for scripts:

```sh
sqlite-sync-guard --json scan ~/Sync
```

Create a consistent, integrity-checked handoff artifact:

```sh
sqlite-sync-guard export ~/Sync/app/data.db --output ~/Transfers
```

This writes `data.backup.sqlite3` and `data.backup.manifest.json`. The manifest
contains the SHA-256 digest, byte length, source observations, SQLite version,
and integrity result. Existing exports are never overwritten unless `--force`
is supplied.

Keep live database files out of a sync client:

```sh
sqlite-sync-guard ignore ~/Sync --client syncthing
sqlite-sync-guard ignore ~/Sync --client resilio --dry-run
```

The command manages one clearly marked block in `.stignore` or
`.sync/IgnoreList`; unrelated rules are preserved and repeat runs are
idempotent. Run `sqlite-sync-guard --help` or a command’s `--help` for all
options.

## Safety model

- `scan` reads headers and metadata only. It does not connect to a database or
  trigger journal recovery.
- A matching `-wal`, `-shm`, or `-journal` file is treated as unsafe to copy,
  even if no process lock is visible.
- Lock probes use SQLite’s documented lock-byte regions on the database and
  WAL shared-memory files.
- `export` is the only command that opens a database. It uses SQLite’s online
  backup API, then runs `PRAGMA integrity_check` on the staged copy before an
  atomic rename.
- The backup is a handoff snapshot. Never open the same writable database from
  two machines through a file-sync folder.

## Develop and verify

Requirements: Rust 1.85+, Node.js 20+, and npm 10+.

```sh
npm install
npm test
npm run check
npm run build
```

`npm test` runs the Rust unit/integration suite and deterministic site/PWA
checks. `npm run test:browser` runs the pinned Chromium regression for the
desktop and 390px mobile shells, keyboard flow, axe accessibility, no-outbound
requests, and an online service-worker update followed by an offline reload.
`npm run build` produces the release binary and the static site at
`dist/site/index.html`. To work on the docs site, run `npm run dev`.

Useful release checks:

```sh
cargo package --allow-dirty
npm run check:site
```

The project performs no telemetry and the docs site loads no third-party
scripts, fonts, or analytics. See [CHANGELOG.md](CHANGELOG.md) for release
history.

## License

MIT © 2026 Sociobot (Param Factory)
