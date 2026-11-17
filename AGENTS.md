# Maintaining the mathematical atlas

Work within the user's requested project and publication authority. Preserve
unrelated changes and fetch the current branch before proposing a publication.
Never force-push or change collaborator permissions as part of an ordinary edit.

## Mathematical and editorial work

- Use the installed `math-project-maintainer` for statements, dependencies and
  evidence; `math-writing-editor` for exposition; and `math-research-publisher`
  for public presentation and release checks. Read the applicable skill first.
- Lead a result summary with its precise conclusion and hypotheses. Use standard
  mathematical terminology and titles. Define project-specific concepts and link
  them to their formal definitions.
- Keep permanent result IDs, theorem anchors and mathematical status stable
  unless a reviewed change explicitly justifies a revision. An internal proof,
  a conditional theorem and an open problem are different statuses.
- A research route states its target, the successive implications, the hypotheses
  needed by each implication, and its unresolved mathematical steps. Distinguish
  a proposed implication from an established reduction. Keep route pages and
  their standalone papers consistent.
- Preserve the full intended corpus. Do not replace source proofs with summaries
  during migration or styling. Build success is not mathematical certification.

## Shared feedback

Use only this repository's GitHub Issues for public feedback. General comments
must require no theorem ID, project or edition. Mathematical comments may carry
exact optional context. Do not create a competing inbox, write endpoint, or
automatic proof-acceptance path. Existing discussion stays in its original Issue.
Link an accepted correction's Issue, Pull Request and published edition.

Reader attachments are public and untrusted. Inspect them without execution;
compile only reviewed source in an appropriate isolated environment. Never copy
private correspondence into the public board without authority.

## Sources and editions

- The authoritative current-edition pointer is
  `content/strong-green/current.json`; the atlas card's edition must agree.
- Current mathematical records and full article HTML live under
  `content/strong-green/releases/<edition>/`. Public papers and frozen pages live
  under `public/projects/strong-green/editions/<edition>/`.
- Add a new edition for published content changes. Do not modify a frozen input,
  page, PDF, source or manifest. New drafts must not inherit freeze markers.
- Use `docs/PAPERS.md` to rebuild a paper's matching HTML, TeX and PDF. Reconcile
  the new hashes into its draft bundle; do not reuse hashes of different bytes.
- Keep the public project and papers unsigned. Check bylines, running heads,
  self-attributions, metadata and downloadable sources. Preserve other authors'
  bibliographic credit. Necessary hosting URLs and Git history are not anonymous.

## Publication and verification

1. Read `docs/MAINTENANCE.md`, inspect the diff, and reconcile concurrent edits.
2. Run `npm ci`, `npm run build` and `npm run check`.
3. Inspect the changed pages and PDFs, including a narrow layout, links, feedback
   context and downloads. Review public files for unintended private material.
4. For a new formal edition, run `npm run freeze:release`, rebuild, then run
   `npm run check` and `npm run check:release`. Include the exact frozen output.
5. Publish only when authorised. Preserve the actual pre-change commit for the
   append-only history check and use a non-force, current-head-checked update.
6. Verify GitHub Actions and the live Pages result. Report only observed checks;
   do not claim a scheduled review or backup exists unless it was configured.

Correct a broken deployment in a new commit. Git backs up source versions, not
Issue threads or attachment bytes; maintain those separately when arranging a
backup. Privacy removals require a separately authorised procedure.
