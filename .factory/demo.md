# Demo sandbox

- Web: `https://sqlite-sync-guard.sociobot.in/demo/` or `/?demo=1`.
- CLI: `sqlite-sync-guard demo`.
- Sample: a closed project database and an active-session database with a WAL journal marker. The CLI creates both in a new operating-system temporary directory, scans them through the production scanner, and exports the closed database through the production backup path.
- Web isolation: only `localStorage` keys beginning `demo:sqlite-sync-guard:` are used. No normal product data is stored. **Reset demo** deletes that namespace and restores the unsafe sample. **Start for real** deletes it before leaving.
- CLI isolation: every run receives a unique `sqlite-sync-guard-demo-*` directory. The command prints its exact location and never reads the current directory or user files.
