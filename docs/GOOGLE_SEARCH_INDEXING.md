# Google Search indexing for OpenMath

This document concerns **one** HTTPS domain, `openmath-atlas.org`, with four important entry URLs:

| Page | Canonical URL | Search themes based on its public content |
| --- | --- | --- |
| OpenMath | https://openmath-atlas.org/ | OpenMath research atlas; AI for mathematics; arithmetic geometry; Berkovich geometry |
| Bedford–Taylor | https://openmath-atlas.org/projects/bedford-taylor/ | non-Archimedean Bedford–Taylor theory; positive currents; psh potentials; pluripotential theory |
| Foundations | https://openmath-atlas.org/projects/foundations/ | Berkovich analytic geometry; non-Archimedean geometry; formal models; tropical geometry; skeleta |
| Beilinson–Bloch / Strong Green | https://openmath-atlas.org/projects/strong-green/ | Beilinson–Bloch heights; strong zero-curvature Green conjecture; Arakelov geometry |

These are independently addressable pages within **one** Google Search Console Domain property. They are not four independent registered websites.

## Published discovery infrastructure

- `https://openmath-atlas.org/robots.txt` permits crawling and advertises both sitemaps.
- `https://openmath-atlas.org/sitemap-core.xml` lists exactly the four canonical entry points.
- `https://openmath-atlas.org/sitemap.xml` retains the complete eligible public page inventory, with core entries first. Deliberately non-indexable search/source-view routes and legacy aliases must not be added.
- Every core URL serves an HTTPS page with a self-referencing canonical, descriptive title and meta description. Structured WebSite/CollectionPage data describes the website or collection but does not certify mathematical claims.
- Homepage and navigational links connect to the three projects. Immutable reading editions and their historical URLs remain unchanged.

## One-time Google Search Console action (owner account)

Site deployment and GitHub Pages domain verification **do not** verify ownership at Google. Use the Google Search Console property selector to **Add property → Domain → `openmath-atlas.org`**. Copy the **actual Google-generated** DNS TXT name and value into the domain's authoritative DNS configuration (Dynadot), save, and click Verify in Search Console. Do not use the earlier `_github-pages-challenge-DongKaicheng` TXT as a substitute: that record proves control to GitHub, not Google. Keep the GitHub challenge and other working records intact.

After Google property verification, use **Indexing → Sitemaps** and submit:
1. `sitemap.xml` — full site.
2. `sitemap-core.xml` — four principal entry points.

Then use **URL Inspection** for each exact URL in the table above. Check the live test, self-canonical, no blocking `noindex`, fetch success, and indexed canonical; if Google reports the page is not indexed, use **Request indexing** for the four main URLs. Confirm the request in Search Console rather than inferring submission from the public sitemap. Google may crawl individual pages automatically from the sitemap/robots signals.

Record the property verification date, sitemap submission status, live test results, and first indexed date separately for each URL; follow **Pages**, **Sitemaps**, and **Performance → Search results**, filtering by page and query. Test sensible phrases from the table, but do not claim ranking or promise that every keyword will yield a search result. Avoid repeated resubmission.

## Migration and policy

The former `dongkaicheng.github.io/math-research-atlas/` is retired and GitHub Pages redirects to the new host. The separate `https://dongkaicheng.github.io/` personal homepage must remain unchanged. Do not invoke Search Console's whole-site Change of Address on the personal homepage: it is not moving as part of this project. Do not submit historic URLs as new canonical entries or replace frozen mathematical editions.

Google's URL Inspection indexing requests are separate from the **Google Indexing API**, which is not a general-purpose API for these mathematical pages. The discontinued sitemap ping endpoint is not a reliable substitute for Search Console submission. A sitemap is a discovery hint; inclusion and ranking remain Google decisions and often take days or weeks.

Official references:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://support.google.com/webmasters/answer/9012289
