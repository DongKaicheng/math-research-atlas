# Search indexing metadata — 28 November 2026

Baseline: `393aa4039ab957d8758acac05beb7e17910b3e8f`, including the Foundations
reader audit published through PR #18. This change concerns current website
metadata and publication checks. It does not revise a mathematical edition.

## Findings and changes

The initial sitemap contained 2,016 distinct URLs. Every submitted HTML page
had a matching canonical and none had a `noindex` or refresh directive.
Live samples of the homepage, three project roots, Foundations chapters,
permanent Tags and reading pages likewise showed no blanket indexing block.

Two Foundations routes exposed the same table of contents. The saved-reader
entry `/projects/foundations/reader/` now selects
`/projects/foundations/contents/` as its canonical and is omitted from the
sitemap. Its query handling, fragment navigation, body and bookmark script
remain intact.

The global and Foundations search pages now use `noindex,follow`, consistent
with the existing Bedford–Taylor search policy. The Foundations search shell
is omitted from the sitemap; mathematical result URLs remain discoverable.
The directly accessible `/404.html` also uses `noindex,follow`.

The main sitemap now contains 2,014 distinct canonical content URLs. The
four-entry core sitemap and `robots.txt` discovery remain unchanged.

`check:domain` now inspects every sitemap URL for a generated page, one matching
absolute canonical, and absence of indexing-blocking meta directives or a
meta refresh. It also checks the utility-page exclusions and saved-reader
canonical explicitly. Existing URL, feedback and frozen-file checks remain.

## Verification before publication

- Both the legacy and custom-domain builds completed: 5,905 routes and
  1,841 permanent entries.
- All 293 repository tests passed with one test process at a time. Two workers
  in the initial concurrent run exited before finishing; the complete serial
  rerun passed. No test or assertion was removed or weakened.
- The custom-domain check passed for 2,014 sitemap pages, 218,942 internal
  links, 1,908 byte-identical historical aliases and 2,877 search links.
- Release integrity passed on both builds, including 1,050 Strong Green
  frozen files and the Bedford–Taylor inventory of 853 files, 24 PDFs and
  four ZIP files.
- Protected history was checked against the exact baseline above.
- SHA-256 comparisons of the five relevant page bodies before and after the
  custom-domain build were identical. Changes are confined to document heads
  and sitemap membership; no visible content, styles or mathematical sources
  changed.
- A separate AI source review found no blocking issue in the metadata diff.
  This is a website review, not mathematical proof certification.

## Search Console interpretation

Intentional archived editions, management pages and legacy bookmarks remain
excluded. HTTP-to-HTTPS redirects and `index.html` canonical aliases remain
valid. The old atlas landing page retains its deliberate retirement notice.
Frozen edition bytes are unchanged.

These checks establish the current publication's indexing eligibility. They
do not establish Google's selected canonical or actual index inclusion.
The account's example URLs and last-crawl dates must be inspected before
attributing any specific Search Console exclusion to this change. Normal
exclusion categories need not disappear after publication.

References:

- [Google: Page indexing report](https://support.google.com/webmasters/answer/7440203)
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: Request recrawling](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
