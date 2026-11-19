## One discussion space for the whole atlas

All projects use the same [GitHub Issues board](https://github.com/DongKaicheng/math-research-atlas/issues). The website displays this board; it does not maintain a second inbox or a separate comment database. Reply to the existing Issue when continuing a discussion.

**General feedback** is welcome: opinions about the website, clarity, organisation, accessibility, missing material, or collaboration. It needs no project, theorem, or version number.

Mathematical feedback can include an optional project, permanent result ID, exact edition, and page or paper section. A link from a project can fill in this context; you can edit or clear it before continuing. If the edition is unknown, leave it blank rather than guessing.

## What can I send?

- **General feedback** — comment on the website or the project as a whole.
- **Question** — ask about a definition, statement, argument, or project.
- **Correction** — explain an error, missing assumption, or unclear proof step.
- **Reference** — suggest a relevant paper, book, note, or existing theorem.
- **Idea** — propose an improvement or new research direction.
- **Proof** — submit a complete or partial mathematical argument.
- **Counterexample** — present an example that challenges a statement.
- **Lean / formalization** — share a Lean proof or a formal statement.

## How to submit feedback

1. Visit the [feedback page](/feedback/). Search existing Issues first to avoid a duplicate discussion.
2. Choose General feedback, or a mathematical contribution category. Context is optional.
3. Continue to GitHub and sign in with your **GitHub account** if prompted.
4. Write a title and message. Check any prefilled project, result, or version.
5. Submit the Issue on GitHub. The website itself has not sent anything until you do this.

The original Issue, comments, attachments, and subsequent resolution remain in one thread. You can subscribe to that Issue on GitHub. A closed Issue records a discussion outcome; it is not by itself a certification of a mathematical claim.

The board loads the most recent Issues first. Use **Load older feedback** for earlier pages, or follow the permanent GitHub link to search the complete record. Older posts without an identifiable project appear under All projects. If the GitHub API is unavailable, the direct links and submission forms remain usable.

## How to upload a LaTeX or Lean ZIP

GitHub supports ZIP attachments in Issues and comments. Drag the ZIP into the message field or use the attachment control, and wait for the upload to finish. See [GitHub's attachment instructions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files) for supported formats and current size limits.

A useful source package contains:

- A main TeX or Lean file with the statement and argument.
- A short README explaining the files and any compilation requirements.
- Bibliography, figures, styles, and other necessary inputs.
- The result ID and edition, if the contribution concerns a published statement.

Use an ordinary, unencrypted ZIP. Uploads can become publicly accessible immediately, before the Issue is submitted. **Neither this website nor its maintainers automatically execute or compile an uploaded archive.** Inspect its contents before sharing it.

## Are comments and attachments public?

**Yes. All GitHub Issues, comments, names, and attachments are public as soon as they are submitted.** Uploaded files can be public even before submission. Your GitHub username appears with your contribution. Do not include confidential notes, passwords, personal documents, or work you wish to keep private.

The project pages and papers can be unsigned, but hosting on a personal GitHub repository does not conceal the repository account or public commit history. For sensitive correspondence, use a private channel separately agreed with a maintainer. Do not post sensitive content merely to request its removal.

## How does feedback change the mathematics?

A maintainer first clarifies the question and checks the cited statement, premises, and argument. A proposed proof is not accepted solely because it is submitted, receives support, or passes automated website checks.

An accepted change is made in a Pull Request. The author links the Issue, describes the correction, checks affected dependent results, and records the publication revision. After review and a successful build, an authorised maintainer merges the change. The published revision is then linked back to the original Issue.

A discussion does not grant editing rights. Public readers may suggest changes; only the repository owner and approved GitHub collaborators can merge or publish them.

## Acknowledgements and credit

Every project has its own [acknowledgements page](/acknowledgements/). General thanks for sharing research or other support are kept separate from specific contributions adopted through feedback.

When a maintainer accepts feedback and incorporates it into a published change, a short contribution record is added to the relevant project page. It links the original Issue, the acceptance record and the implementing Pull Request or commit. Closing an Issue, adding a label, or submitting a candidate proof is not sufficient. The pages are regenerated from the reviewed records with each website release; they do not make automatic acceptance decisions.

The feedback form lets you ask to be contacted before being named, permit credit using your GitHub username, specify a public name, or choose not to be named on acknowledgement pages. If you leave this preference unanswered, we will ask before displaying a name or username. **GitHub Issues remain public:** choosing not to be named on an acknowledgement page does not hide your GitHub account or the original discussion.

Credit describes the contribution actually made. It does not by itself imply co-authorship, endorsement, a mathematical priority claim, or independent verification of the whole project. Human and AI-assisted submissions follow the same review and attribution process. Please describe relevant AI assistance when explaining a contribution; tool use does not automatically change who receives credit.

To correct a credit or change how you are named, reply to the original Issue or use [general feedback](/feedback/). Do not include sensitive personal information. We update the current acknowledgement record through a new reviewed change; ordinary changes do not erase earlier Git history or copies held elsewhere.

## How can I cite an earlier version?

Use the project's version page and the exact paper edition, not only its changing current URL. Current links lead to the latest publication; version links identify a fixed mathematical text. Corrections receive a new revision and a concise change note. A withdrawn statement keeps its identity and an explanation.

Published history is retained unless privacy, security, or legal removal is necessary. Such a removal is recorded without repeating the sensitive content. Old private feedback is never silently copied into this public board.

## How is the website maintained?

Source files, reviews, and revision history live in the repository. Each accepted update is built and checked before GitHub Pages publishes it. See the [maintenance protocol](https://github.com/DongKaicheng/math-research-atlas/blob/main/docs/MAINTENANCE.md) for editing, versioning, release checks, rollback, and backups.

The update mechanism does not imply unattended mathematical review or continuous monitoring. Maintainers decide when to examine feedback and release a revision.
