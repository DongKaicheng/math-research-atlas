# Public definition indexing — 29 November 2026

Baseline: `5bba8041b870ab967195c5366d292bed8f3bcdb3`.

Three current Strong Green definition records were incorrectly excluded from
indexing by a metadata rule that treated every legacy `draft` status as a draft
proof claim:

- `BB-LOCAL-DATA`: The local actual-form problem.
- `BB-INTEGRAL-IMAGE`: Integral images and bounded-degree Northcott.
- `BB-CENTRAL-DATA`: Pointed products and central residual groups.

These records already have kind `definition`, appear in the public record and
dependency indexes, and display the established `Definition` label. Their
metadata now follows that distinction. The generated current pages no longer
carry `noindex`, and the normal build includes their canonical URLs in the
sitemap. Actual draft proof claims remain excluded.

This is a current website metadata correction. It does not revise mathematical
statements, proofs, record statuses, permanent IDs, publication pointers, visible
page bodies, or frozen editions. Archived files retain their original bytes.
Search eligibility remains distinct from Google's eventual indexing decision.

## Verification

- Both legacy and custom-domain builds completed with 5,905 page routes.
- All 295 repository tests passed on the legacy build. The two new indexing
  regression tests also passed on the custom-domain build, covering the three
  definitions and both actual draft-result controls.
- The custom-domain check passed for 2,017 canonical sitemap pages, 218,942
  internal links and 1,908 byte-identical historical aliases.
- Release integrity passed on both builds: 1,050 frozen Strong Green files and
  853 Bedford–Taylor files, with all 24 registered Bedford–Taylor PDFs inspected.
- Protected history was checked against the exact baseline above; no existing
  snapshot, frozen edition or agent release was modified or removed.
- A complete comparison of all 17,046 output files found exactly four byte
  changes: the three definition page heads and `sitemap.xml`. No file was added
  or removed, and every HTML page body remained byte-identical.
- A separate AI source review found no blocking issue. It reviewed indexing
  behavior and scope preservation, not mathematical proof correctness.
