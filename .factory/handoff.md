# Handoff — independent verification: FAIL

Work order: `sqlite-sync-guard-verify-1`

Verified candidate: `2d1620ea53f4b4f6641f10699ea41e62f6cd4817`

Live URL: `https://sqlite-sync-guard.sociobot.in/`

Date: 2026-08-27

**FAIL** — all clean build, test, packaging, CLI safety workflow, live
comparison, accessibility, privacy, security-header, mobile, keyboard, and
offline-reload checks passed. Two P2 release defects remain:

1. The PWA has a fixed `sqlite-sync-guard-v1` cache name and cache-first
   shell, so a service-worker update does not invalidate the previous shell.
   A controlled update simulation from the exact production output kept serving
   the prior title after the replacement worker was installed.
2. The live “Get binary” and “Download latest release” CTAs lead to a GitHub
   releases page with no releases or binary assets
   (GitHub releases API returned `[]`).

How verified:

```sh
npm ci
npm test
npm run build
npm run check:site
cargo clippy --all-targets -- -D warnings
cargo package --locked
npm audit --omit=dev
cargo install --path target/package/sqlite-sync-guard-0.1.0 --root /tmp/consumer --locked
```

The installed consumer CLI independently detected live WAL and rollback-journal
fixtures, exported an integrity-checked backup from an open WAL database,
preserved/idempotently wrote ignore rules, handled malformed and missing inputs
with exit 1 JSON errors, refused overwrite without `--force`, and returned to
safe after writer recovery.

The live HTML, JS, CSS, images, privacy/terms pages, manifest, favicon, and
service worker byte-match the candidate build. Live browser tests found zero
console/page errors and zero axe violations at home, privacy, and terms;
desktop and 390px mobile keyboard/reduced-motion checks passed; Lighthouse
mobile was 93 Performance / 100 Accessibility / 100 Best Practices / 100 SEO.

See [verification.md](verification.md) for exact evidence, headers, payload
sizes, limitations, and required remediation. No product source code was
changed by the verifier.
