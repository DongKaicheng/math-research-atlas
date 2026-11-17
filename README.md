# Conjecture Atlas — GitHub edition

This is the GitHub-native home of **Conjecture Atlas**, an open reference and research site for mathematical foundations, conjectures, proofs, and longer programmes.

Public site: https://dongkaicheng.github.io/math-research-atlas/

The full Beilinson–Bloch project is at [Strong Green forms and arithmetic heights](https://dongkaicheng.github.io/math-research-atlas/projects/strong-green/). It includes the research programme, three separate routes, permanent mathematical records, and ten articles in HTML, PDF and LaTeX. The other two projects retain their existing outlines.

## Where the information lives

- `content/projects/*.json` — current published project outlines and mathematical entries.
- `content/history/` — immutable, previously published version snapshots (add, never overwrite).
- `content/strong-green/current.json` — explicit pointer to the currently published mathematical edition; a draft directory alone does not publish anything.
- `content/strong-green/releases/<edition>/` — versioned research records, full article HTML, and public-file checksums.
- `public/projects/strong-green/editions/<edition>/` — frozen pages, PDFs, self-contained TeX, public source projections, styles, fonts and machine-readable records.
- `strong-green/views/` — the maintained page presentation; frozen pages are copied rather than regenerated from later views.
- `content/manifesto.html`, `content/guide.md`, `docs/MAINTENANCE.md` — public background and contribution/maintenance policies.
- GitHub Issues — public feedback, category labels, comments, LaTeX or Lean ZIP attachments, and moderation.
- Git commits and pull requests — proposed edits, authorship, review, and publication history.
- GitHub Actions and Pages — static build and hosting.

The public website has **no ChatGPT, Cloudflare D1, R2, or proprietary authentication dependency**. It is composed of static files generated from this repository. Readers do not need to sign in; writers and commenters use their GitHub accounts.

## One feedback system

Every project uses [the same feedback board](https://dongkaicheng.github.io/math-research-atlas/feedback/) and this repository's GitHub Issues. **General feedback** accepts site-wide opinions without a project, theorem ID, proof, or version. Mathematical categories optionally carry the project, permanent result ID, page and edition from the referring page. Comments remain in their original Issue; accepted changes link that Issue to the Pull Request and published edition.

There is no second project inbox, website write API, or automatic acceptance of a submitted proof. Opening a form only prepares a draft on GitHub. ZIP attachments and comments are public; read the [contribution guide](https://dongkaicheng.github.io/math-research-atlas/feedback/guide/) before uploading.

## Editing mathematical content

1. Edit the project JSON under `content/projects/`. Keep permanent entry IDs unchanged.
2. For a substantive revision, save the previous published bundle in `content/history/<project-id>/v<revision>.json` before changing it. Increment the `revision` and update `publishedAt` and `changeSummary` on the current bundle.
3. Open a pull request. Link the relevant GitHub Issue, describe the mathematical change, and obtain review where appropriate.
4. The owner or a collaborator with write access merges to `main`. GitHub Actions checks and publishes the generated site to GitHub Pages.

For the Beilinson–Bloch project, create a **new** formal edition as well. Copy the current release inputs into a new `content/strong-green/releases/vX.Y.Z/` directory, excluding freeze markers such as `public-files.json` and `checksums.json`. Prepare matching public papers and source files under the corresponding `public/` edition directory, and update the explicit current pointer only as part of the reviewed publication. Existing edition directories are append-only and checksum-checked. Do not overwrite an old PDF or correct a theorem only in rendered HTML.

Use the [paper rebuilding guide](docs/PAPERS.md) and `node scripts/render-paper.mjs --help` to regenerate a revised paper's matching HTML, self-contained TeX and PDF in a new draft edition. This manual editorial tool is separate from the Pages build.

After preparing a new edition, build and inspect it, then freeze its full public output:

```sh
npm ci
npm run build
npm run check
npm run freeze:release
npm run build
npm run check
npm run check:release
```

The freeze command refuses to replace an existing frozen file with different bytes. Include the new release inputs, frozen public output, and checksum manifest in the same reviewed change. The Pages build uses no LaTeX toolchain: it publishes already prepared, matching paper artifacts.

Never accept a proof solely because it was submitted or because automated checks pass. Review the exact statement, its hypotheses, dependencies, and mathematical argument.

## Access control

Only the repository owner and GitHub collaborators granted appropriate write access can merge or directly modify repository content. Public readers can open Issues and Pull Requests but cannot publish site changes. `CODEOWNERS` identifies the owner; it does not by itself require review. A branch ruleset requiring Pull Requests, code-owner review, and passing checks is recommended but is not silently configured by this publication.

Manage editors under **Settings → Collaborators and teams** (or **Settings → Access → Collaborators**). Never share a common password or a ChatGPT account.

## Publication checks and deployment

Pull Requests run the static build, site tests, release-integrity checks, and an append-only history comparison. A successful push to `main` additionally deploys the checked artifact through GitHub Actions to Pages. No reader contribution can write through the public website.

If configuring another repository, choose **Settings → Pages → Build and deployment → GitHub Actions**. The build's base path and canonical origin must match that repository. Category labels are optional: feedback also recognizes the existing form title prefixes, including `[General]`.

After deployment, check the home page, shared feedback and guide, project Progress and Routes pages, a fixed edition, and the actual PDF downloads. Automated compilation or a successful deployment is not mathematical certification.

## Local build

Node 24+ is recommended:

```bash
npm ci
npm run build
npm run check
npm run check:release
```

The result is `dist/`. Serve it under `/math-research-atlas/` for preview so that frozen canonical URLs and links are exercised as published. Do not edit `dist/` as a source file.

## Privacy and uploads

GitHub Issues are **public**. Posts, comments, GitHub usernames, and uploaded ZIP archives are immediately visible. Do not submit confidential sources or personal data through Issues. ZIP files are attachments provided and hosted by GitHub; the site does not execute uploaded sources. For sensitive correspondence, use a private channel separately arranged with the owner.

The GitHub publication uses an explicit allowlist of public mathematical content. Original private archives, historical signed downloads, and private feedback have not been imported. The unsigned source projections have their own hashes; a redacted copy is never presented as byte-identical to its original.

Git history preserves prior commits. New unsigned publication does not anonymize the repository owner, remove old commits or external caches, or erase public GitHub comments. Necessary repository and hosting addresses remain technical links.

## Long-term maintenance

See [the maintenance protocol](docs/MAINTENANCE.md) for triage, dependency review, concurrent edits, correction notices, rollback and backups. Git tracks source and publication versions; Issues and attachments require a separate backup. No recurring issue triage, unattended mathematical review, or scheduled backup has been enabled by these files. A failed deployment should be corrected or reverted in a new commit, without resetting another project's work.
