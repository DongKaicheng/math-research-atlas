# Beilinson–Bloch research map — 18 November 2026

Adds `/projects/strong-green/research-map/` to the project's primary navigation
and homepage. The page presents the current research as a linked, expandable
tree with five branches: local Green forms, global height pairings, Chow groups
and positivity, integral Northcott, and metrics and families.

The map includes all 54 permanent records, the three existing construction
routes, 13 pairing cases with their 32 geometric applications, and the six
existing programme steps. Titles, summaries and mathematical statuses are read
from the authoritative current records. Pairing cases, route descriptions and
programme goals reuse their existing reading metadata. Branch membership is
topic organization; exact mathematical support remains on the record and
dependency pages.

Readers can open branches and subgroups, expand the entire tree, return to the
overview, or search titles, topics and permanent IDs. Every result links to its
full record; route, proof, case and programme links retain their existing
destinations. Native HTML disclosures and links work without JavaScript.
Search additionally opens the relevant branches and matches ancestor headings.

This is a current navigation view based on mathematical edition v0.5.1. It does
not change any statement, proof, mathematical status, PDF, or frozen file. The
map and its presentation assets are not inserted into the old edition. The
shared Atlas feedback link carries the project, mathematical edition and map
page; there is no new feedback store. Other projects are outside this change.

## Maintaining the map

`strong-green/views/content/research-map.mjs` holds topic membership by permanent
ID. The page reads actual titles, summaries and statuses from the current
bundle. A build-time coverage check rejects missing, duplicate or unknown
records, so a future edition with new records must update their placements.
Keep mathematical relationships in the original records and papers rather
than interpreting the reading tree as a proof graph.

Current-only assets and the current-only page flag in
`scripts/build-strong-green.mjs` preserve all existing frozen URLs. Keep these
boundaries when changing the interface. A future formal edition can separately
include a frozen reading map if that is explicitly desired.

Validate the build, generated links, statuses, navigation, search, sitemap,
shared feedback context and release integrity. Inspect desktop and narrow
layouts and exercise the native disclosures, search, overview and record links
before publication. Compare append-only history against the actual pre-change
remote head.
