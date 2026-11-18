# OpenMath custom-domain migration

The owner confirmed the display name **OpenMath** and registered
**openmath-atlas.org** at Dynadot. The registration-completion notice was
provided, and the owner authorised the migration. The
domain/name decision is complete; this document does **not** certify that DNS,
GitHub Pages, or HTTPS cutover has occurred. Record those live observations in
the deployment change note after verification.

The independent atlas is not affiliated with the OpenMath standard or OpenMath
Society at <https://openmath.org/>. Its four intended public entry points are:

| Entry | Intended address |
| --- | --- |
| OpenMath | `https://openmath-atlas.org/` |
| Bedford–Taylor | `https://openmath-atlas.org/projects/bedford-taylor/` |
| Foundations | `https://openmath-atlas.org/projects/foundations/` |
| Beilinson–Bloch / Strong Green | `https://openmath-atlas.org/projects/strong-green/` |

This is a domain and routing change, **not** an invitation to rewrite the
historical mathematics, permanent IDs, paper editions, source archives, or
feedback records. Repository and issue links may still identify their GitHub
owner even though the four public website URLs no longer do.

## Publication routing and immutable history

The manifest of a frozen mathematical edition describes its *historical source
publication*, not the hosting origin of a later current-page projection.
Existing release manifests, PDFs, source packages, source receipts and fixed
reading editions remain byte-for-byte unchanged. Current pages can project
their navigation, feedback context, assets and canonical URLs to the new host.

The custom-domain build supplies the old `/math-research-atlas/` path where
needed by immutable Bedford–Taylor and Strong Green editions, together with
their shared assets. Frozen aliases retain exact bytes; other legacy HTML entry
points redirect to the current canonical address.
Do not rewrite a frozen edition or copy its review/hash markers to new bytes
merely to satisfy a URL or branding check.

Check current root-relative and absolute URLs, research maps and downloadable
SVGs, JS-generated links, feedback `page=` context, canonical/OG URLs, sitemap,
RSS, robots, search indexes, CSS/fonts, papers, PDFs, and archives. Source-bound
map records and their historical evidence URLs retain their mathematical
edition identity even when current reading links are projected to a new host.

`scripts/import-bedford-taylor.mjs` still has the old source-publication origin
and base path. A future audited import for a **new** edition needs its own
reviewed hosting treatment. Do not re-import or regenerate an existing frozen
edition just to change the delivery address.

## Dual validation and guarded artifact selection

The Pages workflow always checks both publication modes, on Pull Requests as
well as production builds:

1. Build the old publication with explicit legacy settings; run the complete
   existing test suite and `check:release`.
2. Move that already-checked, generated `dist` directory to `dist-legacy`.
3. Build OpenMath at the custom-domain root; run `check:domain` and the same
   `check:release` integrity check.
4. Compare protected history with the real PR or push base using
   `HISTORY_BASE_SHA` and `check:history`. A manual run requires the full
   40-character reviewed baseline in its `history_base_sha` input.
5. Upload exactly one of those checked artifacts. Pull Requests never upload
   or deploy either artifact.

The tests that explicitly exercise the old path are not silently weakened to
make the root build pass. The additional root-domain checks validate its own
navigation and artifacts; neither test group is an independent mathematical
proof review. A local reproduction is:

```sh
npm ci
SITE_BASE_PATH=/math-research-atlas SITE_ORIGIN=https://dongkaicheng.github.io/math-research-atlas SITE_BRAND='Conjecture Atlas' npm run build
npm run check
npm run check:release
SITE_BASE_PATH=/ SITE_ORIGIN=https://openmath-atlas.org SITE_BRAND=OpenMath npm run build
SITE_BASE_PATH=/ SITE_ORIGIN=https://openmath-atlas.org SITE_BRAND=OpenMath npm run check:domain
npm run check:release
HISTORY_BASE_SHA=REPLACE_WITH_ACTUAL_BASE_COMMIT_SHA npm run check:history
```

Only these exact GitHub Actions **repository-variable** combinations are
accepted by the workflow:

| Mode | `SITE_BASE_PATH` | `SITE_ORIGIN` | `SITE_BRAND` | Checked artifact |
| --- | --- | --- | --- | --- |
| Legacy/default | `/math-research-atlas` | `https://dongkaicheng.github.io/math-research-atlas` | `Conjecture Atlas` | `dist-legacy` |
| OpenMath cutover | `/` | `https://openmath-atlas.org` | `OpenMath` | `dist` |

Unset variables use the legacy defaults. A mixed or unknown combination fails
before building or uploading; it must not silently publish a mismatched site.
Set all three custom-domain values together **only at the coordinated cutover**.
Changing repository variables alone does not start a build: use the workflow's
**Run workflow** action (`workflow_dispatch`) or an authorised subsequent
commit. A manual run must supply the actual reviewed pre-change baseline SHA;
do not select `HEAD` merely to make the history comparison empty. Review the
PR, rendered desktop/narrow layouts, feedback, current and
historical editions, and exact downloads before switching the live origin.

## Domain and GitHub Pages cutover

1. Keep registration, billing and recovery access in the owner's Dynadot
   account. In the personal GitHub account's Pages domain settings, verify
   `openmath-atlas.org` with GitHub's **actual** generated DNS TXT challenge.
   Never invent that challenge value, and retain the TXT record after approval.
2. Before directing DNS to GitHub, reserve the domain in
   **DongKaicheng/math-research-atlas → Settings → Pages** by setting its one
   **Custom domain** field to `openmath-atlas.org`. Do not change the personal
   homepage repository's Pages settings. This repository publishes through
   GitHub Actions; no `CNAME` file is required for that publishing mode.
3. Use the domain's DNS service (Dynadot DNS is suitable); a change to another
   nameserver provider is not required. In Dynadot DNS, add these four `A`
   records in the root **Domain Record** section. That section represents the
   root domain directly; do **not** enter a literal `@` as a subdomain:

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Optional: in Dynadot's **Subdomain Records**, add subdomain `www` with record
   type `CNAME` and target `dongkaicheng.github.io`. Keep only
   `openmath-atlas.org` in the GitHub Pages **Custom domain** field; with the
   corresponding DNS configured, GitHub handles the `www`/apex redirect.
   The DNS target is technical and does not appear in the public entry URLs.
   Avoid conflicting DNS records and wildcard records. Do not alter DNS for
   the personal homepage `dongkaicheng.github.io`.
4. After both build modes and the reviewed migration pass, set all three
   GitHub Actions **repository variables** for this repository:

   ```text
   SITE_BASE_PATH=/
   SITE_ORIGIN=https://openmath-atlas.org
   SITE_BRAND=OpenMath
   ```

   Trigger **Publish mathematical atlas → Run workflow** on `main` and inspect
   the resulting deployment. Supply the reviewed comparison commit's full SHA
   in `history_base_sha`. The workflow checks both modes, then uploads only
   the selected OpenMath artifact. DNS, Pages settings, and deployment are not
   an atomic change; do not promise zero downtime. Observe the actual old and
   new URLs throughout the cutover and use rollback if they do not recover.
5. Wait for DNS/TLS provisioning, confirm the domain in Pages settings, and
   enable **Enforce HTTPS** when offered. Check all four canonical addresses
   and exact edition/version links in a fresh browser session, including
   mobile navigation, issue feedback, archives, and PDF downloads. Check the
   old `dongkaicheng.github.io/math-research-atlas` URLs for correct redirects;
   do not assume that every old deep link redirects correctly.
6. Update off-site links, profile references, and search-console/sitemap
   configuration after the new site is verified. The personal homepage remains
   `https://dongkaicheng.github.io/`; do not change its Pages host or content as
   part of this atlas-only migration.

## Rollback

If cutover fails, keep a record of the deployed commit, DNS settings and test
results. Restore all three old repository-variable values (or remove all three
custom variables to use the workflow defaults), restore the appropriate Pages
custom-domain and DNS configuration, and rerun the workflow on the reviewed
rollback commit. The workflow must select the checked `dist-legacy` artifact.
If source changes are needed, use a new corrective commit. Recheck old and new
URLs. Never force-push or overwrite historical editions as a rollback method.

Official guidance: [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages),
[HTTPS DNS records](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https),
and [Dynadot DNS setup](https://www.dynadot.com/help/question/set-up-DNS).
