# Mathematical agents: logical-diagram public release

Date: 19 November 2026

## Scope

This is a tooling and site-navigation release, not a mathematical research
edition. No statements, review statuses, papers, frozen research directories,
project pointers, or mathematical source receipts were changed.

- Added a visible homepage bridge and `AI & Math` navigation and page.
- Published fixed downloadable skill snapshots for `math-project-maintainer`,
  `math-research-publisher`, and `math-writing-editor`.
- Included the new source-bound interactive logical-map validator and SVG/HTML
  renderer in the maintainer archive, with publisher/writer integration guides.
- Linked the existing Bedford–Taylor overall graph and Strong Green proof maps;
  kept the one existing GitHub Issues feedback board.
- Added a checksum manifest, explicit version pointer and a packaging command
  that screens owner-specific Site bindings and refuses overwrite of old ZIPs.

## Reproducible snapshot

- Release: `2026-11-19-logic-diagrams`
- Archive root: `public/agents/releases/2026-11-19-logic-diagrams/`
- Current pointer: `public/agents/current.json`
- SHA-256 values: see that release's `manifest.json`.
- Public archives exclude generated Python caches and replace a private
  publisher Site binding with an account-neutral guide. They are curated
  distributable snapshots, not byte-identical copies of every owner-local file.

## Verification before publication

- `python3 scripts/package-agents.py --verify`: all three ZIPs passed archive,
  member, privacy-screen and hash checks.
- `npm ci`, `npm run build`: passed; 770 routes built.
- `npm run check`: 141/141 tests passed, including fixed agent archive integrity,
  links, and existing mathematical corpus checks.
- `npm run check:release`: all existing Strong Green and Bedford–Taylor frozen
  files and source bindings checked successfully.
- Managed preview: homepage navigation and standalone agent page inspected at
  desktop width. At 390 px, the page body and document widths were both 375 px,
  the three cards were 333 px, and no horizontal overflow occurred. A browser
  click produced an actual ZIP download.

These are publication and artifact checks. They do not make any mathematical
claim newly proved, reviewed, or certified. A Site update requires a normal
Git commit and GitHub Pages deployment; a personal skill change alone is not
an unattended sync.
