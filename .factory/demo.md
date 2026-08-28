# Demo sandbox

- Web: `https://sqlite-sync-guard.sociobot.in/demo/` or `/?demo=1`. The query path immediately opens the same demo route and banner.
- CLI: `sqlite-sync-guard demo`.
- Sample: `examples/sample.sql` creates a closed project database and an active-session database with a WAL journal marker. The CLI creates both in a new operating-system temporary directory, scans them through the production scanner, and exports the closed database through the production backup path. `demo --json` reports the workspace and sample identifiers.
- Recording: `site/public/demo-recording.svg` and the visible “Read demo transcript” disclosure are generated from `sqlite-sync-guard demo`. Their companion text file replaces only the random temporary workspace path with `<demo-workspace>`.
- Web isolation: only `localStorage` keys beginning `demo:sqlite-sync-guard:` are used. No normal product data is stored. **Reset demo** deletes that namespace and restores the unsafe sample. **Start for real** deletes it before leaving.
- CLI isolation: every run receives a unique `sqlite-sync-guard-demo-*` directory. The command prints its exact location and never reads the current directory or user files.
