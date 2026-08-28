# Handoff — adversarial review 2

Work order: `sqlite-sync-guard-review-2`
Reviewed commit: `3dd4c7ab2762dcbe177940482d4573a3a3febe83`
Live URL: <https://sqlite-sync-guard.sociobot.in>

## Outcome

No product code was changed. The review report is in `.factory/review-2.md`.
Verdict: **FAIL**.

## Verified

- Fresh desktop and 390 px contexts answered what the tool does, who it is for,
  and what to click first without scrolling.
- `/demo/` is one click away, begins with realistic sample output, uses only
  `demo:sqlite-sync-guard:fixture`, resets correctly, and leaves no normal
  local-storage key.
- Live `/demo/` reloaded and operated offline after service-worker control;
  captured traffic was same-origin only.
- A clean clone at `/tmp/sqlite-sync-guard-review-2-6bR84N` ran every one of
  the 14 commands in `.factory/claims.json`; all passed.
- Public routes, sitemap/robots, links, responsive layout, and the designed
  404 were independently checked. The main four routes have the expected
  metadata and landmarks.

## Remaining gaps

1. The page calls a hand-coded TypeScript fixture a recording of the real CLI;
   the real `demo` output differs.
2. Most registered CLI claim tests do not use the required demo entry point
   and bundled sample.
3. Normal navigation leaves focus on `body` and does not announce the new h1.
4. Several README, demo, and privacy assertions are absent from claims.json.
5. The 404 route lacks the normal metadata and full header shell.

## How to reproduce

```sh
git clone https://github.com/B-Divyesh/sf-sqlite-sync-guard.git /tmp/review
cd /tmp/review
npm ci
npm run test:claims -- --grep @claim:demo-isolation
cargo run --quiet -- demo
```

Compare the command output with the transcript on `/demo/`, then follow the
header Privacy link and inspect `document.activeElement` after load.
