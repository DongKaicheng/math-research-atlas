# Foundations search discovery

Date: 2026-11-21 (Asia/Shanghai).
Source baseline: 81d559bc86bdfafba58f28ca50bdf7936387ff2a.

## Purpose and scope

Readers searching by mathematical subject need a direct route into the
Foundations. The current chapter and NAG pages already contain static HTML,
but most lacked individual search descriptions and some document titles
contained only a result number.

This publication adds 16 substantive topic guides and a topic directory at
/projects/foundations/topics/. The guides cover the subjects actually present
in the current English chapter catalogue. Their 62 chapter links, exact titles,
related-topic links and source date are checked during the ordinary build.
The site homepage and Foundations navigation link to the directory.

All 1,712 current NAG pages retain their permanent identity, visible statement,
argument and proof status. Search descriptions include the existing status.
Generic document titles gain context from the actual source section or named
statement. Chapter descriptions use their own titles and section subjects.
This is a presentation update, not a new mathematical edition or proof review.

The topic guides provide ordinary static links, individual descriptions,
self-canonical URLs, social metadata and CollectionPage, ItemList and
BreadcrumbList structured data. They are also included in the existing
site search. Structured data describes visible reading content; it does not
assert a mathematical certification or a special Google theorem feature.

## Discovery files

- The existing sitemap.xml contains 2,019 current indexable URLs.
- sitemap-foundations.xml contains 1,827 Foundations URLs.
- sitemap-topics.xml contains the topic directory and its 16 guides.
- The existing four-entry sitemap-core.xml retains its address and scope.
- robots.txt declares all four files.

Topic modification dates come from the checked-in topic source. The build
does not reset every page's date. The project search interface remains usable
but has noindex,follow and is excluded from the sitemaps. Fixed editions
and former-address aliases retain their established publication behavior.
The owner's existing Google verification marker is preserved. The visible
homepage identifies the site as OpenMath Atlas as well as OpenMath, and the
WebSite record includes the alternate name.

## Checks before publication

- Dependency installation and the ordinary legacy build.
- All 193 repository tests, including the complete NAG metadata inventory.
- Frozen release checks: 340 Beilinson–Bloch files, both Bedford–Taylor
  editions, 24 PDFs and their bound source/download inventories.
- Custom-domain build and all five focused discovery tests.
- Custom-domain checks of 192,597 internal links, search links, feedback
  context, canonical entry points and byte-identical historical aliases.
- Append-only history check against the source baseline.
- Independent review of topic scope, current proof-status descriptions,
  canonical URLs, sitemap membership and the unchanged mathematical sources.

The existing GitHub Pages workflow repeats the publication gates. Live pages
are checked after deployment. Search eligibility and publication do not by
themselves establish Google indexing. Search Console submission and indexing
status require observations from the owner's authenticated Google property.

## Maintenance

Edit content/foundations/topics.json to improve a reading guide or add a
substantive subject. Use existing chapter routes and exact catalogue titles.
Update its date only when the content or its reading links change. The normal
build regenerates the topic pages, search entries and sitemaps. Preserve
permanent mathematical IDs and frozen editions when updating discovery text.

Google guidance consulted:

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
