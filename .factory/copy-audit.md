# Copy audit — polish 1

Audited 2026-08-28 against the rendered home, demo, privacy, terms, 404, and README copy.

## First screen

| Copy | Words | Result |
| --- | ---: | --- |
| Check SQLite files before folder sync | 6 | pass |
| For developers syncing folders between computers, it finds unsafe files and creates a verified transfer backup. | 15 | pass |
| Try it with sample data | 5 | pass |
| See a live database scan and safe export. | 9 | pass |
| Free. | 1 | pass; claim `mit-source` |
| Runs locally. | 2 | pass; claim `demo-isolation` |
| No telemetry. | 2 | pass; claim `no-telemetry` |

## Full-copy result

Every prose sentence in the five rendered routes and README was checked. No sentence exceeds 22 words. No banned marketing word appears. Technical terms are introduced only in command or safety detail. All behavior statements map to `.factory/claims.json`; legal warnings are phrased as limits, not capabilities.

## Terminology

| Concept | Required term |
| --- | --- |
| exported SQLite file | transfer backup |
| JSON metadata beside it | manifest |
| folder managed by a file-sync client | synced folder |
| WAL, SHM, rollback journal as a group | journal files |
| demonstration workspace | demo |
| exclusion configuration | ignore rules |

Removed inconsistent terms: handoff artifact, handoff snapshot, verified snapshot, safe copy, transfer pair, parcel, preflight, and live set.
