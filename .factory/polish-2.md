# Perfection loop polish 2

Candidate: `3dd4c7ab2762dcbe177940482d4573a3a3febe83`. Review: `3d12f36aae31777f0190bdc227cf6eddf639d2d1`.

## Finding map

- F-1-1: plain first screen retained — browser mobile capture.
- F-1-2: isolated web/CLI demo retained — `@claim:demo-isolation`.
- F-1-3: claims registry retained — `npm run test:claims`.
- F-1-4: offline demo retained — `@claim:offline-demo`.
- F-1-5: warning and sidecar detection retained — `@claim:unsafe-detection`.
- F-1-6: MIT and same-origin privacy retained — `@claim:mit-source`, `@claim:no-telemetry`.
- F-1-7: unproved platform/release language remains removed — copy audit.
- F-1-8: literal fixture replaced by a generated CLI SVG — `@claim:demo-recording`.
- F-1-9: exit-code JSON behavior retained — `@claim:exit-codes-json`.
- F-1-10, F-1-11, F-1-12: transfer backup, integrity, manifest, overwrite behavior retained — `@claim:verified-transfer`.
- F-1-13: ignore preservation/repeat/dry run retained — `@claim:ignore-rules`.
- F-1-14: both JSON positions retained — `@claim:exit-codes-json`.
- F-1-15, F-1-16: broad static/network claims removed; bundled SQLite is tested — `@claim:bundled-sqlite`.
- F-1-17 through F-1-21: safety limits, read-only behavior, sidecars, and publication wording remain fixed — `npm test`, `@claim:scan-read-only`, `@claim:unsafe-detection`.
- F-1-22, F-1-23, F-1-41: untestable suite/version assertions removed — README audit.
- F-1-24: help/build remain claimed and tested — `@claim:help-output`, `@claim:build-output`.
- F-1-25: ownership wording remains in Terms — route crawl.
- F-1-26, F-1-29, F-1-30, F-1-31: branded 404, metadata, robots/sitemap, and shared shell fixed — browser metadata/shell crawl.
- F-1-27: skip/back repair retained; normal forward links now focus and announce the h1 — browser navigation regression.
- F-1-28: content opacity reveal remains removed — immediate axe sweep.
- F-1-32: first-visit update guard remains — PWA A→B test.
- F-1-33 through F-1-40, F-1-42, F-1-43: terminology, copy, titles, controls, headings, and clipboard fallback remain fixed — copy audit and browser regression.
- F-2-1: generated `demo-recording.svg` and companion text from the actual command, normalizing only the random temporary workspace path — `@claim:demo-recording`.
- F-2-2: every CLI claim begins with fresh `demo --json` and operates only its reported workspace — `site/test-claims.mjs`.
- F-2-3: every normal full-page route load focuses and politely announces the h1; hash-target navigation is preserved — browser header-link regression.
- F-2-4: unsupported version, suite, CLI-network, and privacy-sale assertions removed; retained assertions have registry entries — copy audit and claims sweep.
- F-2-5: 404 has noindex, theme, icon, Apple icon, Open Graph/Twitter metadata, full wordmark, and Commands link — browser 404 crawl.

## Evidence

`npm run check`, `npm test`, `npm run build`, `npm run check:site`, `npm run test:browser`, `npm run test:claims`, and `cargo package --locked --allow-dirty` pass. Browser evidence: `.factory/evidence/home-mobile-390.png` and `.factory/evidence/demo-desktop.png`.
