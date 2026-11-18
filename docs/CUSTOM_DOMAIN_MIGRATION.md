# Custom-domain migration: preparation, not activation

Status: **not approved for cutover**. No domain has been purchased or configured
for this repository. This plan does not change the existing GitHub Pages URL,
the personal homepage, the website's public name, or any published edition.

## Decision before implementation

The owner must first choose and register a domain. The working candidate is
`openmath-atlas.org`; it is **not** the active origin. The shorter name
"OpenMath" is already used by the independent OpenMath standard and OpenMath
Society at <https://openmath.org/>. Confirm a sufficiently distinct public
name and domain before changing any branding or website settings.

The four intended public entry points, substituting the registered domain for
`example.org`, are:

| Entry | Intended address |
| --- | --- |
| Atlas | `https://example.org/` |
| Bedford–Taylor | `https://example.org/projects/bedford-taylor/` |
| Foundations | `https://example.org/projects/foundations/` |
| Beilinson–Bloch / Strong Green | `https://example.org/projects/strong-green/` |

This is a domain and routing change, **not** an invitation to rewrite the
historical mathematics, permanent IDs, paper editions, source archives, or
feedback records. Repository and issue links may still identify their GitHub
owner even though the four public website URLs no longer do.

## Current blockers to a root-domain build

1. `scripts/build.mjs` accepts `SITE_BASE_PATH` and `SITE_ORIGIN`, but
   `scripts/build-bedford-taylor.mjs` requires both to equal the values in the
   current edition's immutable manifest. A trial build using `/` and a new
   origin fails with `Bedford–Taylor immutable edition origin/base mismatch`.
   Treat the manifest's values as *historical source identity*, separate from
   the new hosting origin; never edit the existing edition to satisfy a build.
2. Check root-relative and absolute URLs in current Bedford–Taylor projections,
   `lib/bedford-taylor-logic.mjs`, `lib/bedford-taylor-overview.mjs`, the
   `content/bedford-taylor/logic-*.json` and `research-map.json` links, and
   existing diagrams. A public projection may need current-domain navigation
   without changing the bytes or hashes of a frozen edition.
3. Several tests currently assume `/math-research-atlas` and
   `https://dongkaicheng.github.io`. Extend tests to cover the new origin and
   root path while keeping the old edition-integrity checks intact. Audit
   feedback `page=` context, canonical/OG URLs, sitemap, RSS, robots,
   search-index routes, assets, papers, PDFs, and archive download links.
4. `scripts/import-bedford-taylor.mjs` has a fixed old origin/base path. Any
   future audited import for a new edition requires its own reviewed migration
   handling. Do not re-import or regenerate a frozen edition merely to change
   the hosting address.

The workflow now allows the repository variables `SITE_BASE_PATH` and
`SITE_ORIGIN`, with defaults equal to the *existing* deployment. **Do not set
the new values yet.** Changing variables alone will fail the current build.

## Prerequisites and validation before any cutover

1. Register the final domain with the owner's registrar account and preserve
   renewal/payment access. Complete the domain and name decision first.
2. Develop the root-path publication projection on a separate reviewed branch
   without modifying existing frozen release bytes or history. Verify it with:

   ```sh
   npm ci
   SITE_BASE_PATH=/ SITE_ORIGIN=https://example.org npm run build
   SITE_BASE_PATH=/ SITE_ORIGIN=https://example.org npm run check
   npm run check:release
   HISTORY_BASE_SHA=<actual-base-commit> npm run check:history
   ```

   Substitute the *actual registered domain* for `example.org` and extend the
   checks to run against the alternate origin. Inspect all four generated
   entry points, current and historical editions, PDF/archive URLs, navigation,
   narrow/mobile layout, and feedback. The baseline build and release checks
   under the original origin must also continue passing.
3. Review a Pull Request and merge only after the new origin passes those
   checks. If the repository variables are still unset, the live site remains
   at its old origin and no cutover occurs.

## Domain and GitHub Pages cutover (after approval)

1. In the personal GitHub account's Pages domain settings, verify the chosen
   domain with GitHub's provided DNS TXT challenge and retain that TXT record.
2. In the registrar's DNS panel, add these four `A` records for host `@`:

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Optional: configure `www` as a `CNAME` pointing to
   `dongkaicheng.github.io` and configure both apex/`www` in GitHub Pages as
   appropriate; the DNS target is technical and does not appear in the public
   entry URLs. Avoid conflicting DNS records and wildcard records. Do not alter
   DNS for the personal homepage `dongkaicheng.github.io`.
3. In **DongKaicheng/math-research-atlas → Settings → Pages**, set the
   registered apex domain. This repository publishes through GitHub Actions;
   no `CNAME` file is required for that publishing mode.
4. After the root-path build is approved, set GitHub Actions **repository
   variables** for this repository:

   ```text
   SITE_BASE_PATH=/
   SITE_ORIGIN=https://example.org
   ```

   Use the registered domain, then trigger and inspect the Pages deployment.
   Do not set these variables before the root-build blockers are resolved.
5. Wait for DNS/TLS provisioning, confirm the domain in Pages settings, and
   enable **Enforce HTTPS** when offered. Check all four canonical addresses
   and exact edition/version links in a fresh browser session, including
   mobile navigation, issue feedback, archives, and PDF downloads. Check the
   old `dongkaicheng.github.io/math-research-atlas` URLs for correct redirects;
   do not assume that every old deep link redirects correctly.
6. Update off-site links, profile references, and search-console/sitemap
   configuration after the new site is verified. Do not change the separate
   personal GitHub Pages repository.

## Rollback

If cutover fails, keep a record of the deployed commit, DNS settings and test
results. Restore the old repository variable values (or remove the custom
variables to use the workflow defaults), correct the Pages custom-domain and
DNS configuration, and deploy a reviewed corrective commit. Recheck old and new
URLs. Never force-push or overwrite historical editions as a rollback method.

Official guidance: [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages),
and [HTTPS DNS records](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
