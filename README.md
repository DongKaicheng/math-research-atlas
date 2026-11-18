# OpenMath — independent mathematical research atlas

**The former public website at `https://dongkaicheng.github.io/math-research-atlas/` is retired and no longer maintained as a separate site.** GitHub Pages automatically redirects that address to the new, active [OpenMath website](https://openmath-atlas.org/). Please update bookmarks and citations to the new URLs.

**Current website:** https://openmath-atlas.org/

This GitHub repository remains the maintained source, feedback, and revision history for OpenMath. The migration changes hosting addresses; archived mathematical editions and their original source records remain immutable.

The [Non-Archimedean Bedford–Taylor project](https://openmath-atlas.org/projects/bedford-taylor/) includes the complete unsigned reading edition, six main sections, 74 permanent result records, explicit definition links, and matching mathematical papers and downloads. Publication preserves the recorded mathematical statuses; it is not a new certification of the proofs.

The [Beilinson–Bloch project](https://openmath-atlas.org/projects/strong-green/) includes its research programme, three separate routes, permanent mathematical records, and ten articles in HTML, PDF and LaTeX. The Foundations project retains its existing outline.

## Where the information lives

- `content/projects/*.json` — current published project outlines and mathematical entries.
- `content/history/` — immutable, previously published version snapshots (add, never overwrite).
- `content/<project>/current.json` — each project’s explicit current-edition pointer; adding a draft directory does not select it.
- `content/<project>/releases/<edition>/` — versioned mathematical records or import provenance, file hashes, and publication metadata.
- `public/projects/<project>/editions/<edition>/` — frozen unsigned pages, PDFs, TeX, selected downloads, styles, and fonts.
- `strong-green/views/` — maintained Beilinson–Bloch page presentation; existing frozen pages are copied, not regenerated from later views.
- `docs/PAPERS.md` — the Beilinson–Bloch paper rebuilding workflow; Bedford–Taylor uses its separate audited import procedure.
- `content/manifesto.html`, `content/guide.md`, `docs/MAINTENANCE.md` — public background, contribution policy, and maintenance protocol.
- GitHub Issues — public feedback, category labels, comments, LaTeX or Lean ZIP attachments, and moderation.
- Git commits and pull requests — proposed edits, authorship, review, and publication history.
- GitHub Actions and Pages — static build and hosting.

The public website has **no ChatGPT, Cloudflare D1, R2, or proprietary authentication dependency**. It is composed of static files generated from this repository. Readers do not need to sign in; writers and commenters use their GitHub accounts.

## One feedback system

All projects use [one feedback board](https://openmath-atlas.org/feedback/) backed by this repository's GitHub Issues. General feedback accepts comments about exposition, organisation, accessibility, missing topics, and collaboration without requiring a theorem, proof, or version. Mathematical feedback optionally carries the project, permanent result ID, precise edition, and fixed page URL.

Opening a form only prepares a draft on GitHub. Readers review and submit it themselves. Comments and attachments are public. There is no second inbox, public content-write API, or automatic acceptance of proofs. Accepted changes link the original Issue to the correction and new publication version.

## Editing mathematical content

1. Edit the project’s authoritative mathematical sources and version records. Keep permanent entry IDs unchanged; update the project card under `content/projects/` to identify the selected edition.
2. For a substantive revision, save the previous published bundle in `content/history/<project-id>/v<revision>.json` before changing it. Increment the `revision` and update `publishedAt` and `changeSummary` on the current bundle.
3. Open a pull request. Link the relevant GitHub Issue, describe the mathematical change, and obtain review where appropriate.
4. The owner or a collaborator with write access merges to `main`. GitHub Actions checks and publishes the generated site to GitHub Pages.

Never accept a proof solely because it was submitted or because automated checks pass. Review the exact statement, its hypotheses, dependencies, and mathematical argument.

## Access control

Only the repository owner and GitHub collaborators granted appropriate write access can merge or directly modify repository content. Public readers can open Issues and Pull Requests but cannot publish site changes. `CODEOWNERS` identifies the owner; it does not enforce review by itself. A branch ruleset requiring Pull Requests, code-owner review, and passing checks is recommended, but is not silently enabled by this publication.

Manage editors under **Settings → Collaborators and teams** (or **Settings → Access → Collaborators**). Never share a common password or a ChatGPT account.

## Publication and history

Pull Requests run the build, content tests, exact-release checks and append-only history comparison. A successful push to `main` additionally deploys the checked artifact through GitHub Actions to Pages. Release checks reject changes or deletions to existing edition files; create a new edition and then change the current pointer. Current links follow that pointer, while exact-edition links retain their original mathematical text.

Prepare Bedford–Taylor updates through the import adapter described in [the maintenance protocol](docs/MAINTENANCE.md). Import only an explicitly audited unsigned reading edition, never the complete private research workspace. The importer refuses to overwrite an existing frozen edition. It records both original reading-file identity and the bytes actually published after URL adaptation. PDFs remain byte-identical to the audited reading copies.

For Beilinson–Bloch, rebuild changed papers in a new draft using [the paper workflow](docs/PAPERS.md), review the matching HTML, TeX and PDF, then freeze the new edition with `npm run freeze:release`. That freezing command is specific to Beilinson–Bloch; Bedford–Taylor freezes through its import adapter. `npm run check:release` verifies both projects.

Before publishing, check the latest remote branch and reconcile other projects' changes. Do not force-push. After deployment, verify the live pages, shared feedback, a fixed edition, search and actual PDF downloads. Rollback uses a new corrective commit; old editions and the discussion trail remain available.

If configuring another repository, select **Settings → Pages → Build and deployment → GitHub Actions**. Match the canonical origin and base path to that repository. Feedback categories work from the form title prefixes even when category labels have not been installed.

## Local build

Node 24+ is recommended:

```bash
npm ci
npm run build
npm run check
npm run check:release
```

The result is `dist/`; do not edit it as a source. Preview under `/math-research-atlas/` so that links and immutable assets are tested under the production base path.

## Privacy and uploads

GitHub Issues are **public**. Posts, comments, GitHub usernames, and uploaded ZIP archives are immediately visible. Do not submit confidential sources or personal data through Issues. ZIP files are attachments provided and hosted by GitHub; the site does not execute uploaded sources. For sensitive correspondence, use a private channel separately arranged with the owner.

The public import is explicitly limited to the approved unsigned reading outputs. Original private archives and private feedback are not imported. The historical Bedford–Taylor outline is an unsigned reading projection with its original file hash recorded; the mathematical text and historical status are retained. Necessary GitHub hosting and repository URLs remain technical links. An unsigned website does not conceal the repository account or erase old Git commits, public comments, forks, or caches.

## Long-term maintenance

See [the maintenance protocol](docs/MAINTENANCE.md) for triage, dependency review, concurrent edits, versioning, corrections, rollback, and backups. Git preserves the source and publication files, but does not back up Issues and attachments. No recurring triage, unattended mathematical review, or scheduled backup is implied or enabled by these documents.
