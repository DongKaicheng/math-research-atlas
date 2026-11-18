# Beilinson–Bloch research map — 18 November 2026

Adds `/projects/strong-green/research-map/` to the project's primary navigation
and homepage. The primary view is a logical map, not a topic classification.
Six connected proof trees display the full global target, exact-support Green
construction, arithmetic equivalences, fixed-field Northcott, bounded-degree
field control, and metric/family comparison.

Conclusions are above their connected premises. Every junction distinguishes
joint requirements, alternative sufficient routes, equivalence, an open bridge,
or a known failure of implication. Each relation links to the exact supporting
paper or record. The full-domain pairing is separated from the additional
functoriality, normalization and classical-comparison requirements. Quantifiers,
geometric domains and height hypotheses remain explicit.

The collapsible supplementary index preserves all 54 permanent records, the
three existing construction routes, 13 pairing cases with their 32 geometric
applications, and the six existing programme steps. Registered titles and
statuses are read from the authoritative current records. Intermediate
properties in the proof trees are reading nodes, not new theorem records.

Readers can jump to a conclusion, expand its detailed premises, expand all
arguments, or return to the first-level view. The supplementary index also
supports searches by title, topic and permanent ID. Native HTML disclosures
and links work without JavaScript.

This is a current navigation view based on mathematical edition v0.5.1. It does
not change any statement, proof, mathematical status, PDF, or frozen file. The
map and its presentation assets are not inserted into the old edition. The
shared Atlas feedback link carries the project, mathematical edition and map
page; there is no new feedback store. Other projects are outside this change.

## Maintaining the map

`strong-green/views/content/logical-map.mjs` holds explicit logical relations
and their evidence. Do not derive implications mechanically from the generic
dependency arrays: those arrays include context and proof ingredients. Every
gate needs a precise scope, its full premise bundle, and a source for the
claimed relation. Record nodes cannot override their publication status.
Future changes to a source theorem require rechecking its displayed gates.

`strong-green/views/content/research-map.mjs` holds supplementary topic
membership by permanent ID. Build-time checks reject missing, duplicate or
unknown records. New records therefore require deliberate placement.

Current-only assets and the current-only page flag in
`scripts/build-strong-green.mjs` preserve all existing frozen URLs. Keep these
boundaries when changing the interface. A future formal edition can separately
include a frozen reading map if that is explicitly desired.

Validate the build, generated links, statuses, navigation, search, sitemap,
shared feedback context and release integrity. Inspect desktop and narrow
layouts and exercise the native disclosures, search, overview and record links
before publication. Compare append-only history against the actual pre-change
remote head.
