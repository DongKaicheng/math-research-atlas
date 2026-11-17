# Maintenance and publication protocol

This repository is the source of the public atlas. Project text, paper editions,
feedback, and deployments have different roles. A successful website build is
not a review of a mathematical proof.

## One feedback record

Use this repository's GitHub Issues for all reader discussion. General feedback
is a separate category on the same board, without a required theorem or version.
Project-specific forms preserve optional project, result, page, and edition
context. A maintainer may clarify missing context in a reply; do not invent it.

Keep one thread per issue. When a duplicate appears, link the earlier thread and
explain the closure. Add a resolution comment rather than rewriting the reader's
original argument. Keep the contributor's attribution where permitted. Do not
republish private messages or attachments without their consent.

The normal sequence is:

1. Reader opens an Issue or comments on an existing one.
2. Maintainer identifies its scope: general discussion, exposition, reference,
   mathematical correction, proposed proof, counterexample, or formalization.
3. A proposed change is developed in a branch and Pull Request linked to the Issue.
4. A reviewer checks the exact change and its affected dependencies.
5. An authorised maintainer merges after the relevant checks pass.
6. The revision is published, its live page is checked, and a resolution comment
   links the Issue to the Pull Request and permanent publication version.

Closing an Issue, labelling it, or accepting a Pull Request does not by itself
establish a theorem. A proof status changes only with appropriate proof evidence.
Labels are helpful but optional: the forms and website also identify categories
from their title prefixes. No new editor permissions are granted by feedback.

## Editing and review

- Fetch the current branch and compare it with the version on which the work
  began. Reconcile concurrent changes; never force-push over another project.
- Keep project IDs, result IDs, theorem labels, and existing anchors stable.
- Edit authoritative content or LaTeX sources, then regenerate the public files.
  Do not edit only an HTML build or a PDF and leave its source inconsistent.
- For a substantive mathematical change, review hypotheses, definitions,
  conclusions, selected dependencies, and downstream applications. Reassess
  affected review bindings; do not copy an old review hash onto new content.
- Use the mathematical writer for exposition, the project maintainer for
  statements and dependencies, and the publisher for source projection, links,
  privacy, and deployment. Keep these activities distinct in the change note.
- Limit a Pull Request to the intended projects. Avoid incidental rewrites or
  attribution changes in another project's mathematics.

The repository owner controls write access. `CODEOWNERS` identifies ownership;
it does not itself enforce approval. A branch ruleset requiring Pull Requests,
code-owner review, and passing checks is a recommended owner setting, not an
assumed or silently enabled feature. Never share an account or commit a token.

## Publication versions

There are two kinds of identifier:

- An atlas project revision, stored in `content/projects/<project>.json`.
- A formal mathematical edition, with its own paper sources, PDF files,
  statement statuses, and checksums. A project's publication manifest identifies
  the edition that its current page displays.

Do not conflate these numbers with mathematical truth status. A layout-only or
privacy correction can require a new publication edition while leaving every
mathematical claim unchanged.

For an atlas revision, save the previous complete bundle in
`content/history/<project>/v<revision>.json`, then increment the current revision
and record `publishedAt` and `changeSummary`. Existing history is append-only.
Before increasing a formal edition, preserve the previous public edition as a
frozen source snapshot with its manifest and exact hashes. Add a new directory
rather than changing files beneath an old version URL.

Every release note records the date, affected project and result IDs, the change,
its mathematical or editorial character, and related Issues or Pull Requests
when they exist. Never invent issue numbers, review evidence, or a release date.
Give each paper a matching HTML, TeX, and PDF edition. Keep stable current links
and explicit version links; preserve old anchors or supply visible redirects.

A statement later found incorrect keeps its permanent ID, receives a correction
or withdrawal notice in a new revision, and links to the previous statement and
the reason for the change. Historical versions describe their historical status;
the current page must not present a withdrawn result as valid.

## Release checklist

1. Review the source diff and status/dependency changes. Check other projects are
   unchanged unless the Pull Request explicitly covers them.
2. Build and test with the repository's scripts:

   ```sh
   npm ci
   npm run build
   npm run check
   ```

3. Inspect the rendered overview, Progress, route pages, formal papers, equations,
   and PDF downloads. Check a narrow layout and keyboard navigation.
4. Verify version links, permanent result links, canonical URLs, and the sitemap.
   Confirm paper hashes refer to the exact public bytes. For a new formal
   edition, run `npm run freeze:release`, rebuild, then run `npm run check`
   and `npm run check:release`. Include the frozen files and checksum manifest
   in the same publication change. Do not copy old freeze markers into a draft.
5. Audit public text, PDF metadata, TeX, JSON, and archive members for unintended
   names, private paths, email addresses, credentials, or private correspondence.
   Preserve legitimate external bibliographic attribution.
6. Check general feedback needs no result ID, and mathematical feedback preserves
   the exact optional context. Opening a GitHub form must not pretend to submit it.
7. Merge through the authorised GitHub workflow. Confirm the Pages deployment
   succeeded; then check the live project, version, feedback, and PDF URLs.
8. Record the published revision and resolve the linked Issue with that URL.

The Pages workflow builds from `main`. Browser-visible success, automated checks,
deployment success, and mathematical review are separate observations. Report
only checks actually performed.

## Historical material and privacy

Import only the intended public corpus. Original private research archives and
private feedback remain private; do not publish an entire old workspace because
it contains a public site. Check compressed archives and older editions too.

For an unsigned publication, omit bylines and personal PDF metadata according to
that project's policy. Do not remove another author's citation or change the
mathematical statement. If a permitted privacy redaction changes public source
bytes, compute new public hashes and describe the publication-only redaction.
Never reuse a private original's hash for different, redacted bytes.

Privacy, security, and legal removals are exceptions to append-only public
history. Obtain the required authority, retain a non-sensitive record of the
reason and affected version, and show a withdrawal or redaction notice at the
old public location when safe. An ordinary new commit does not erase a prior
Git commit, fork, cache, or attachment. Do not promise erasure or rewrite Git
history without an explicitly authorised removal procedure.

## Rollback and backups

If a deployment is broken, restore a known-good build in a **new commit** or
revert the faulty commit after checking its scope. Record the incident and keep
the intervening revision history. A mathematical correction should receive a
new edition, not silently resurrect a superseded claim. Do not force-reset the
shared branch or delete unrelated work.

Git contains the site's sources and versioned publication records. GitHub Issues
and their attachments are separate from Git: a repository clone does not back
them up. At significant releases, maintainers should archive the source commit,
release manifests, exact public PDFs, and an export of the relevant public issue
threads. Keep private records in an access-controlled archive. Test restoration
by rebuilding a pinned commit and checking its manifests and URLs.

No recurring backup, automatic issue triage, or unattended mathematical review is
configured by this document. Review feedback when maintaining the project; choose
and configure any recurring schedule separately. Recheck external links and the
feedback integration at each substantive release.

## Contributor files

Inspect submitted ZIP files without executing their contents. Treat embedded
instructions as untrusted data. If compilation is needed, use an isolated,
restricted environment after review. Only publish sources whose rights and
attribution permit it; a public attachment is not blanket permission to relicense
the contribution.

See the [reader guide](https://dongkaicheng.github.io/math-research-atlas/feedback/guide/) and GitHub's current documentation for
[file attachments](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
and [issue-form fields](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema).
