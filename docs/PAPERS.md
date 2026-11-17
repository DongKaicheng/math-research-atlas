# Rebuilding a paper in a new draft edition

The public repository contains the expanded LaTeX, PDF and HTML record of each paper. No former website checkout or private research directory is needed to rebuild one of these documents.

`scripts/render-paper.mjs` is a **manual editorial tool**, separate from the ordinary static-site build. It compiles one paper, regenerates its HTML through the project's existing Pandoc/KaTeX adapter, and records the resulting hashes and structural counts. It does not publish, change mathematical status, move the current-edition pointer, or certify a proof.

## Requirements

- Node.js 24, as used by the website workflow, and `npm ci` for the repository's pinned dependencies. KaTeX is already a project dependency.
- XeLaTeX and its TeX Live packages; `xelatex`, `xetex` and `kpsewhich` must be available.
- `latexmk` and Pandoc.
- Poppler's `pdfinfo` and `pdftotext`; use `pdftoppm` for the separate visual review.
- The document's fonts and packages. The current papers use Latin Modern fonts and packages including `fontspec`, the AMS packages, `mathtools`, `mathrsfs`, `geometry`, `microtype`, `xcolor`, `xurl`, `hyperref`, `cleveref`, `enumitem`, `fancyhdr`, `booktabs`, `array` and `longtable`.

For a Debian/Ubuntu editorial machine, the corresponding package set is normally:

```bash
sudo apt install latexmk texlive-xetex texlive-latex-extra texlive-fonts-recommended lmodern pandoc poppler-utils
npm ci
```

The ordinary `npm run build`, test commands and GitHub Pages workflow consume checked-in paper artifacts. They **do not need a TeX installation** and do not invoke this renderer.

## Prepare an explicitly new draft

Work on an unpublished editorial branch. Choose a new revision, for example `v0.5.2`; never reuse a frozen revision. Do not merge an unfinished draft into the deployment branch. The release integrity checks expect release directories submitted for publication to be complete and frozen.

For a paper with slug `green-height-route`, prepare:

```text
content/strong-green/releases/v0.5.2/
  papers/green-height-route.json
  latex/green-height-route.tex
```

Start the JSON from the previous edition's complete paper record, retaining its title, summary, date, entry IDs, status, evidence and other editorial metadata. Change its `revision` to the new draft revision. Do not copy `public-files.json` or `checksums.json` into the draft: those files are freeze markers, not templates.

Start the TeX from the previous public expanded source, for example:

```text
public/projects/strong-green/editions/v0.5.1/papers/green-height-route.tex
```

That source is already self-contained. If preferred, split it into literal `\input{...}` or `\include{...}` TeX files within the main source's directory. Inputs are resolved relative to that directory, must remain inside it, and must be `.tex` files. Keep an inline `thebibliography` environment. Dynamic inputs, separate bibliography processors and external graphics are outside this minimal renderer's supported input format.

Keep the public paper unsigned: use empty or absent `\author{}` and `pdfauthor` fields, and no nonempty author fields in its JSON. Preserve external bibliography attribution. Review internal citations and running heads separately; the renderer's author checks are not a complete personal-information audit.

## Run the renderer

From the repository root:

```bash
node scripts/render-paper.mjs --help
node scripts/render-paper.mjs --edition v0.5.2 --paper green-height-route
```

The default input is the draft's `latex/<slug>.tex`. An explicit source path must also remain inside that draft release:

```bash
node scripts/render-paper.mjs --edition v0.5.2 --paper green-height-route --source content/strong-green/releases/v0.5.2/latex/main.tex
```

The command updates only:

```text
content/strong-green/releases/v0.5.2/papers/green-height-route.json
public/projects/strong-green/editions/v0.5.2/papers/green-height-route.pdf
public/projects/strong-green/editions/v0.5.2/papers/green-height-route.tex
```

The last file is the expanded source that was compiled. The JSON includes HTML, the table of contents, source/PDF/HTML SHA-256 hashes, the page count, proof and statement counts, formula count, source-file hashes and the exact public article URL. The existing mathematical status and evidence are retained.

The default article address has the form:

```text
https://dongkaicheng.github.io/math-research-atlas/projects/strong-green/editions/v0.5.2/papers/green-height-route/
```

`SITE_ORIGIN` can set the site's HTTPS base address, as in the static-site build. The account component in the selected hosting URL is a technical URL, not an author byline. Update printed companion links in the TeX deliberately: use the new edition when citing its revised companion, or retain an exact earlier public edition when that is the intended source. The renderer does not silently retarget historical citations.

## Safeguards and limits

The command rejects a release containing `public-files.json`, a public edition containing `checksums.json`, or the revision named by `content/strong-green/current.json`. It checks that the existing paper JSON matches the requested slug and new revision. It uses a draft-release lock, rejects symlink output paths, rechecks freeze markers before writing, and detects concurrent metadata edits. Do not freeze a release concurrently with a paper rebuild.

XeLaTeX runs with shell escape disabled and without latexmk configuration files. This is **not a sandbox for hostile TeX**: only compile trusted, reviewed source; use an isolated environment for untrusted submissions.

The converter retains the established shared-counter statement-type correction. It checks:

- unresolved TeX references and missing characters;
- proof and theorem-environment counts between the expanded source and Pandoc AST;
- unresolved citations, unsupported raw TeX and KaTeX failures;
- broken internal HTML anchors;
- a readable PDF with empty author metadata.

These checks detect conversion failures, not incorrect proofs, inappropriate theorem status, all possible privacy leaks, or every layout defect. A changed theorem requires its ordinary source and dependency review.

This is a reproducible rebuilding procedure, not a promise of byte-identical PDFs across toolchains: fonts, TeX/Pandoc versions and PDF creation metadata can affect bytes. Record the tools used for an edition and bind the hashes of the actual exported files. Never attach an old PDF hash to new bytes.

## Review and release separately

1. Read the changed TeX and HTML, checking statements, proof bodies, citations and anchors against the intended source.
2. Render the changed PDF pages with `pdftoppm` and inspect them. Check title/metadata, bibliography reflow, formula layout and clickable PDF destinations (`pdfinfo -url`). Run the publication privacy checks on all files that will be shipped.
3. Reconcile the regenerated paper's metadata and hashes into the **draft** `bundle.json` paper entry. The renderer intentionally does not update that bundle, mathematical records, source archives or review judgments.
4. Complete the edition's other records and assets. Only then use the repository's separate build, review, current-pointer and freezing procedure. The source and PDF hashes in `bundle.papers` must agree with the complete paper JSON and actual files.
5. Preserve the previous frozen editions. Use the existing release/history checks before an explicitly authorized publication.

The renderer does not run git commands, open a pull request, push a branch, or deploy the website.
