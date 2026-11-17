# Conjecture Atlas — GitHub edition

This is the GitHub-native home of **Conjecture Atlas**, an open reference and research site for mathematical foundations, conjectures, proofs, and longer programmes.

Public site (after GitHub Pages is enabled): https://dongkaicheng.github.io/math-research-atlas/

## Where the information lives

- `content/projects/*.json` — current published project outlines and mathematical entries.
- `content/history/` — immutable, previously published version snapshots (add, never overwrite).
- `content/manifesto.html`, `content/about.html`, `content/guide.html` — publication text, carried over from the former site.
- GitHub Issues — public feedback, category labels, comments, LaTeX or Lean ZIP attachments, and moderation.
- Git commits and pull requests — proposed edits, authorship, review, and publication history.
- GitHub Actions and Pages — static build and hosting.

The public website has **no ChatGPT, Cloudflare D1, R2, or proprietary authentication dependency**. It is composed of static files generated from this repository. Readers do not need to sign in; writers and commenters use their GitHub accounts.

## Editing mathematical content

1. Edit the project JSON under `content/projects/`. Keep permanent entry IDs unchanged.
2. For a substantive revision, save the previous published bundle in `content/history/<project-id>/v<revision>.json` before changing it. Increment the `revision` and update `publishedAt` and `changeSummary` on the current bundle.
3. Open a pull request. Link the relevant GitHub Issue, describe the mathematical change, and obtain review where appropriate.
4. The owner or a collaborator with write access merges to `main`. GitHub Actions checks and publishes the generated site to GitHub Pages.

Never accept a proof solely because it was submitted or because automated checks pass. Review the exact statement, its hypotheses, dependencies, and mathematical argument.

## Access control

Only the repository owner, **DongKaicheng**, and GitHub collaborators granted `Write` or above can merge or directly modify repository content. Public readers can open Issues and Pull Requests but cannot publish site changes. `CODEOWNERS` names the owner as the code owner. For stronger approval requirements, enable a GitHub ruleset for `main`: require pull requests, the code owner's review, and passing build checks; restrict bypass actors.

Manage editors under **Settings → Collaborators and teams** (or **Settings → Access → Collaborators**). Never share a common password or a ChatGPT account.

## Initial GitHub Pages setup

1. Create a public repository named `math-research-atlas` under `DongKaicheng` and upload these source files.
2. Go to **Settings → Pages → Build and deployment** and choose **GitHub Actions**.
3. Run the **Publish mathematical atlas** workflow if it has not already run.
4. Verify `/`, `/manifesto/`, `/feedback/`, `/feedback/guide/`, the three project pages, and `/sitemap.xml` anonymously.
5. Add issue category labels if you want them visible in GitHub's issue filters: `question`, `correction`, `reference`, `suggestion`, `proof`, `counterexample`, `formalization`.

## Local build

Node 24+ is recommended:

```bash
npm ci
npm run check
npm run build
```

The result is `dist/`. For a root-domain preview, build with `SITE_BASE_PATH='' SITE_ORIGIN=http://localhost:8000 npm run build`, then serve `dist/` with a static HTTP server.

## Privacy and uploads

GitHub Issues are **public**. Posts, comments, GitHub usernames, and uploaded ZIP archives are immediately visible. Do not submit confidential sources or personal data through Issues. ZIP files are attachments provided and hosted by GitHub; the site does not execute uploaded sources. For sensitive correspondence, use a private channel separately arranged with the owner.

The former Sites D1 database was inspected during migration and contained **no projects, revisions, feedback, comments, editors, or settings rows**. The public programme outlines were stored in the original source and have been exported under `content/projects/`. No private submissions or source archives were migrated.
