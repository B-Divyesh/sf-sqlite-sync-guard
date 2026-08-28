# Perfection loop polish 1

Candidate repaired: `1845efbf64cc34127ab99a5cb133791cc38b1b18`  
Review: `fc20e126462722d240961f7951733ee77e3203be`  
Live target: <https://sqlite-sync-guard.sociobot.in>

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced metaphor with the requested job, audience, sample action, outcome, and three facts. | `site/test-browser.mjs`; `.factory/evidence/home-mobile-390.png`; live `/` |
| F-1-2 | Added real `demo` CLI subcommand, temporary fixtures, `/demo/`, `?demo=1`, isolated namespace, banner, reset, and start-real exit. | `claim_demo_isolated_and_real`; `demo-desktop.png`; live `/demo/` and `/?demo=1` |
| F-1-3 | Added the claims registry and executable claim runner. | `.factory/claims.json`; `npm run test:claims` |
| F-1-4 | Removed the release-download sentence and tested offline demo operation. | `@claim:offline-demo`; browser offline reload |
| F-1-5 | Rewrote the promise as a warning and tested every journal form. | `@claim:unsafe-detection` |
| F-1-6 | Split free/source/privacy facts and intercepted the full browser flow. | `@claim:mit-source`; `@claim:no-telemetry` |
| F-1-7 | Removed unproved operating-system and release statements. | copy audit; `rg 'cross-platform|prebuilt binaries'` |
| F-1-8 | Terminal copy now records bundled demo names and outcomes; samples use the real scanner. | `claim_demo_isolated_and_real`; live `/demo/` |
| F-1-9 | Kept precise exit behavior and tested safe/unsafe JSON positions. | `@claim:exit-codes-json` |
| F-1-10 | Standardized on “transfer backup” and tested the production backup path. | export unit live-WAL test; `@claim:verified-transfer` |
| F-1-11 | Independently checks integrity and recomputes SHA-256. | `claim_verified_transfer_and_overwrite` |
| F-1-12 | Tests names, manifest fields, overwrite refusal, and force. | `claim_verified_transfer_and_overwrite` |
| F-1-13 | Tests both clients, preservation, repeat bytes, and dry run. | `claim_ignore_rules_preserve_content_and_repeat_cleanly` |
| F-1-14 | Narrowed placement copy to before/after and tests both. | `documented_scan_json_contract_and_exit_codes` |
| F-1-15 | Removed the broad network/service claim; demo itself uses no network API. | `@claim:demo-isolation`; source audit |
| F-1-16 | Removed “static binary”; retained and tested bundled SQLite. | `@claim:bundled-sqlite` |
| F-1-17 | Rephrased as an explicit safety warning and terms limitation. | README safety details; live `/terms/` |
| F-1-18 | Rewrote in plain words and compares database bytes around scans. | `@claim:scan-read-only` |
| F-1-19 | Defines journal files in plain words and covers WAL/SHM/journal. | `claim_scan_is_read_only_and_all_sidecars_are_unsafe` |
| F-1-20 | Removed the cross-platform lock-region assertion from marketing copy. | copy audit |
| F-1-21 | Explains publication plainly; production atomic staging tests remain. | export unit suite; README safety details |
| F-1-22 | Replaced the detailed test advertisement with a factual suite summary. | README; `npm test` and `npm run test:browser` |
| F-1-23 | Changed exact minimum matrix claim to setup guidance. | README copy audit |
| F-1-24 | Registered help and build outputs; documented dev as a command. | `@claim:help-output`; `@claim:build-output` |
| F-1-25 | Moved ownership wording to Terms as a legal statement. | live `/terms/` |
| F-1-26 | Added a self-hosted risograph 404 and host 404 response override. | axe route `/missing-page`; live unknown URL |
| F-1-27 | Every main is focusable; skip activation focuses it; back/forward focuses and announces the h1. | browser keyboard test; live legal routes |
| F-1-28 | Removed opacity from the reveal; only the decorative art transforms. | immediate axe route sweep; CSS inspection |
| F-1-29 | Added canonicals, route metadata, social card, Twitter tags, and apple icon. | site source checks; live head inspection |
| F-1-30 | Added robots and sitemap with all four public routes. | live `/robots.txt`; live `/sitemap.xml` |
| F-1-31 | Unified header/footer navigation, one-liner, factory credit, version, and build id. | browser route crawl; screenshots |
| F-1-32 | Captures initial controller state; a first visit never shows the update prompt. | browser assertion and PWA A→B test |
| F-1-33 | Uses only “transfer backup” and “manifest” for outputs. | `.factory/copy-audit.md` |
| F-1-34 | Replaced unexplained landing jargon with task language. | `.factory/copy-audit.md`; live `/` |
| F-1-35 | Rewrote the README introduction and workflow in plain words. | `.factory/copy-audit.md`; README |
| F-1-36 | All copy controls visibly name their command. | browser accessible-name crawl; live routes |
| F-1-37 | Renamed fixture buttons to “Show unsafe sample” and “Show safe sample.” | keyboard browser test |
| F-1-38 | Replaced every vague heading with a task-specific heading. | heading crawl; live screenshots |
| F-1-39 | Split the README opening into short sentences. | copy audit, zero sentences over 22 words |
| F-1-40 | Split all three exit outcomes into separate short sentences. | copy audit |
| F-1-41 | Replaced the long browser-test sentence with a short suite summary. | copy audit |
| F-1-42 | Changed the home title to “SQLite Sync Guard — check SQLite files before sync.” | browser title assertion; live `/` |
| F-1-43 | Clipboard denial now selects and focuses code, states the cause, and gives exact keys. | `site/src/main.ts`; browser copy-path source check |

## Evidence files

- `.factory/evidence/home-mobile-390.png`
- `.factory/evidence/demo-desktop.png`
- `.factory/evidence/live/screenshot-desktop.png`
- `.factory/evidence/live/screenshot-mobile.png`
- `.factory/evidence/live/verify.json`

The final handoff records clean-clone commands, deployed status, and live cold checks.
