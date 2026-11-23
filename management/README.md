# OpenMath independent management service

This service supplies a browser workspace for OpenMath projects using GitHub
login, project permissions, private source revisions, exact-version reviews,
and owner-approved public pull requests. It runs on a host you control. No
ChatGPT account, ChatGPT Site, OpenAI SDK, or model API key is required.

The public research website continues to be built from this repository and
served by GitHub Pages. This service has its own database and deployment; a
successful Pages build does not deploy it. The source code and deployment files
in this directory do not establish that a production instance is online.

## What is authoritative

- **Published mathematical content and frozen editions:** this Git repository.
- **Public feedback and proposals:** the existing repository's GitHub Issues.
- **Project roles, invitations, sessions, private revisions, review records,
  API-token hashes, and audit:** the service's private SQLite database.
- **GitHub identity:** verified numeric GitHub account IDs. OAuth access tokens
  are used to obtain identity and then discarded.
- **Public submission:** a separately configured repository credential creates
  an approved candidate's public pull request. It does not merge it or deploy it.

Existing project metadata is seeded from the repository snapshot supplied with
the application. Source files are read from GitHub at an exact commit. Starting
this service does not import the old management Site's private drafts, users,
grants, or audit history. Those require a separate verified migration.

## Local development and review

Use Node.js 24 and the root lockfile. Run these commands at the repository root:

```sh
npm ci
npm run management:build
npm run management:test
npm run management:check
```

The UI build is `management/dist/`. It is separate from the public atlas's
`dist/`; do not put private databases or `.env` files in either directory.

For an explicitly disposable local demonstration:

```sh
npm run management:demo
```

Demo mode is restricted to loopback and uses fixture data. It cannot perform
external publication writes. It is not a production login shortcut. Keep the
production service free of demo configuration.

For a real local OAuth test, register a separate development OAuth App and use
its exact loopback callback. Production requires an HTTPS `APP_ORIGIN`.
Changing only the callback inside the browser cannot override the configured
origin or grant permissions.

## Configure GitHub login

In the owner's GitHub settings, register a GitHub **OAuth App** for this
management service. For the intended production hostname, use:

| Setting | Value |
| --- | --- |
| Application name | OpenMath Management |
| Homepage URL | `https://admin.openmath-atlas.org/` |
| Authorization callback URL | `https://admin.openmath-atlas.org/auth/github/callback` |

If testing under a different hostname, change all three relevant values
together: the OAuth registration, `APP_ORIGIN`, and `MANAGEMENT_DOMAIN`. The
callback path remains `/auth/github/callback`.

Store the resulting client ID and client secret only in the host's protected
configuration. Copy the template and restrict permissions before adding values:

```sh
cp management/.env.example management/.env
chmod 600 management/.env
```

Edit `management/.env` on the host. Do not paste secrets into Issues, public
pull requests, screenshots, browser-side code, or this documentation. For a
service started outside Docker, Node can load the file without shell expansion:

```sh
node --env-file=management/.env management/server/start.mjs
```

### Configuration

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Use `production` for an externally accessible service. |
| `APP_ORIGIN` | Canonical origin, e.g. `https://admin.openmath-atlas.org`; no path, query, or credentials. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Credentials for this service's GitHub OAuth App. |
| `OWNER_GITHUB_ID` | Numeric owner identity, `294881535` for the verified `DongKaicheng` account. |
| `GITHUB_REPOSITORY` | Defaults to `DongKaicheng/math-research-atlas`. |
| `GITHUB_BRANCH` | Published source branch, normally `main`. |
| `GITHUB_PUBLICATION_TOKEN` | Optional separate credential for owner-approved public PR submission. |
| `HOST`, `PORT` | Listening interface and port; direct host deployment defaults to loopback, port `8787`. |
| `OPENMATH_DB` | Private persistent database; default `./management/data/openmath.sqlite`. |
| `MANAGEMENT_DOMAIN` | Hostname used by the optional Caddy TLS service. |

The Docker configuration sets `HOST=0.0.0.0` inside its private container,
`PORT=8787`, and `OPENMATH_DB=/var/lib/openmath/openmath.sqlite`. The host port is
published only on `127.0.0.1`. These container settings override the corresponding
values in `.env`.

The first person to sign in does not become owner. A GitHub login name or email
does not establish ownership. If ownership must change, verify the intended
numeric GitHub account ID and perform a reviewed ownership migration of both
the deployment configuration and the database's pinned owner identity. Changing
only the environment variable makes the existing database refuse startup.

## Configure publication independently of login

Login does not need repository write permissions. Publication uses
`GITHUB_PUBLICATION_TOKEN`, which must be separate from the short-lived OAuth
identity token. A fine-grained personal access token should be restricted to
the intended repository with only the permissions needed for this adapter:

- **Contents:** read and write, for its candidate branch and commit.
- **Pull requests:** read and write, for the public submission and retry lookup.
- **Metadata:** the read permission GitHub supplies with repository access.

Do not grant Actions, administration, workflows, or organization-wide access
for this workflow. Configure expiration and rotate the token when needed. An
organization may require approval before a token works; an unapproved or expired
token is not a successful deployment. Protect `main` with the repository's
intended review and check rules independently of the application's roles.

Leaving this token unset keeps publication unavailable while login, private
editing, and review can be configured. The UI reports actual configuration.

The publication sequence is:

1. A permitted editor saves a private source-bound revision.
2. The candidate is submitted for review; findings bind to its version and hash.
3. The owner approves that exact candidate for public disclosure.
4. The owner requests publication, creating a public GitHub pull request.
5. The normal repository review, checks, merge, Pages deployment, and live
   verification complete the publication.

An approved revision and a created PR are distinct from a live website update.
Changing a draft requires a new applicable approval. A timeout may leave a job
in an uncertain state; reuse its operation identity and reconcile the existing
branch/PR instead of creating another submission with a different ID.

## Source editing supported by this release

The writing view edits a project overview's title, summary, motivation and
Markdown programme while preserving its project ID, category and mathematical
entry records. The source view supports multiple staged UTF-8 text files,
including Markdown, LaTeX, BibTeX and supported JSON sources. Files are bounded
to one MiB each; a normalized revision is limited to 50 files and four MiB,
including generated history snapshots.

| Source | Behavior |
| --- | --- |
| New project | Private project-card and empty acknowledgement templates, with no invented results. First publication creates its ordinary public project page. |
| Editable current project card | Preserve the prior exact bundle as history, then increment the atlas revision. |
| Current project text files | Read at an exact commit; edit only within the stored project scope. New source attachments do not automatically create a typeset paper. |
| Frozen editions, release records and source receipts | Read-only. Prepare a new edition using the existing project-specific release/import workflow. |
| Foundations baseline card and permanent manuscript-tag registry | Read-only because the existing public builder and permanent-reference contract require special handling. |
| Reviewed mathematical entry corpus | Prose-only project changes are allowed; entry-record changes require the dependency-aware mathematical release workflow, so a prerequisite change cannot retain stale dependent reviews. |
| Shared templates, executable code, workflows and credentials | Not editable through the project source API. |

LaTeX preview displays supported mathematical notation with KaTeX. The server
does not execute contributed TeX, compile full manuscripts to PDF, regenerate
formal proof maps or provide simultaneous multi-user document editing. These
publication tasks retain the repository's established source and review tools.
The current optional integration is a scoped REST API, not a newly deployed MCP
server. Public proposals and discussion still use the existing GitHub Issues.

## Deploy on an independent host

Required resources are a Linux host with Docker Engine and Docker Compose,
persistent disk, a hostname you control, and the OAuth configuration above.
The supplied files do not buy a server, change DNS, register an OAuth App, or
create a repository token.

Use one application replica with its persistent SQLite volume. Do not mount
the database on an untested network filesystem or run multiple independent
writers over copies of it. A future multi-host deployment needs a deliberate
database and locking migration.

### With an existing HTTPS proxy

From the repository root:

```sh
docker compose --env-file management/.env -f management/compose.yaml build
docker compose --env-file management/.env -f management/compose.yaml up -d management
docker compose --env-file management/.env -f management/compose.yaml ps
```

Configure the existing proxy to serve `APP_ORIGIN` and route requests to
`127.0.0.1:8787`, preserving the browser's Host/Origin. The application enforces
its canonical origin, session, CSRF, and project checks. Keep the application
port closed to the public network. `/healthz` is a liveness check and exposes
no project data; it does not verify OAuth, GitHub publication, or a Pages release.

### With the optional Caddy HTTPS proxy

Ensure the configured management hostname resolves to this host, ports 80/443
are available, and `APP_ORIGIN` and `MANAGEMENT_DOMAIN` agree. Then run:

```sh
docker compose --env-file management/.env -f management/compose.yaml --profile tls up -d --build
docker compose --env-file management/.env -f management/compose.yaml --profile tls ps
```

Caddy terminates HTTPS and maintains certificate state in separate volumes.
The management process runs as non-root UID/GID 1000, with a read-only image
filesystem and a writable private database volume. The optional Caddy service
uses the upstream image with only its port-binding capability retained.
Application secrets are not passed to Caddy.

For host-installed Caddy, use `deploy/Caddyfile` with its hostname configured
and replace the upstream `management:8787` with `127.0.0.1:8787`.

## Replace the old management hostname safely

The public apex `openmath-atlas.org` currently serves the independent GitHub
Pages site. Only the management subdomain needs this application's host. Keep
the public site's DNS and immutable mathematical URLs in place.

1. Deploy and test the new service under a separately configured staging
   hostname if one is available. Use that hostname's OAuth callback and origin.
2. Sign in as the verified owner. Register a second test account, invite it to
   one project, accept as that account, and verify that another project's private
   revisions remain inaccessible. Revoke the grant and recheck access.
3. Finish and verify any migration of private management records. Pause editing
   in the old service during the final export/cutover window.
4. Replace the old management subdomain's hosting record with the new host's
   correct A/AAAA record or the new host's documented CNAME. Confirm ownership
   of the DNS zone first. Remove stale competing records for that hostname.
5. Change the OAuth callback and `APP_ORIGIN` to the final hostname, set Caddy's
   `MANAGEMENT_DOMAIN` to the same host, and restart the service/proxy.
6. Test the final HTTPS URL, GitHub login/logout, owner identity, second-account
   authorization, a private revision, and the existing public research links.
7. Update the public administration links and capability description through a
   reviewed repository change only after the replacement has been verified.

If the existing Cloudflare proxy still blocks this hostname, changing the
application alone will not remove that rule. The domain administrator can
review the matching security event or choose a DNS-only record to route
directly to the new HTTPS host. Do not disable the application's authentication
or expose the database to compensate for a proxy problem.

The old public entry configuration is in `content/administration.json`; its
current schema links both management and an AI entry. Describe only endpoints
actually implemented and verified on the new host. API access is optional and
uses the same project permissions; a browser migration does not establish an
MCP endpoint or make the old ChatGPT connector point to the new service.

### Migrating identities and private data

ChatGPT/Sites account IDs and GitHub account IDs are different identities.
Never translate an old role by display name, email, or first registration.
Use a reviewed mapping to the verified GitHub numeric ID, and have the intended
recipient accept a new scoped invitation. Keep the original decision and
migration evidence in private records.

Private drafts and review history need a versioned export/import that preserves
content hashes, author provenance, exact baselines, obsolete review records,
and audit chronology. The current seed data is not that migration. Do not upload
private exports to this public repository or use a public PR as temporary storage.

## Backups and recovery

The database contains unpublished mathematics and authorization records. Keep
backups private, restrict host access, and encrypt off-host copies. Git history
and the public Pages artifact do not back up this database. A snapshot on the
same disk protects against accidental edits but not loss of the host or volume.

Use Node's SQLite online backup API rather than copying a running database file:

```sh
node management/scripts/backup.mjs \
  --source /private/openmath/openmath.sqlite \
  --destination /private/backups/openmath-2026-11-23.sqlite
```

The command opens the source read-only, captures committed WAL state, performs
`PRAGMA quick_check`, writes a private `0600` file, and prints its path, size, and
SHA-256. It refuses to overwrite an existing backup and does not print records
or secrets. Choose a fresh destination for every snapshot.

For a running Compose service, create the consistent snapshot inside its private
volume and copy the resulting file to protected host storage:

```sh
docker compose --env-file management/.env -f management/compose.yaml exec -T management \
  node management/scripts/backup.mjs \
  --destination /var/lib/openmath/backups/openmath-2026-11-23.sqlite

umask 077
mkdir -p /srv/openmath-backups
docker compose --env-file management/.env -f management/compose.yaml cp \
  management:/var/lib/openmath/backups/openmath-2026-11-23.sqlite \
  /srv/openmath-backups/openmath-2026-11-23.sqlite
chmod 600 /srv/openmath-backups/openmath-2026-11-23.sqlite
```

These are manual commands. No backup schedule or off-host copy is installed by
this repository. Configure a scheduler and retention only after choosing and
testing the storage destination. Monitor actual backup success separately from
application liveness.

### Restore drill before relying on a backup

Verify its recorded SHA-256, then inspect a copy with Node 24:

```sh
node --input-type=module -e '
  import {DatabaseSync} from "node:sqlite";
  const db = new DatabaseSync(process.argv[1], {readOnly: true});
  console.log(db.prepare("PRAGMA quick_check").all());
  db.close();
' /private/backups/openmath-2026-11-23.sqlite
```

An integrity check is only part of a restore drill. On an isolated test host,
restore a copy into a new private volume, configure a distinct test origin and
OAuth App, leave `GITHUB_PUBLICATION_TOKEN` unset, and start the matching
application version. Verify the expected projects, version history, invitation
state, and access decisions with actual test accounts. Record the backup hash,
application commit, and observed results. Destroy the temporary private copy
after the drill.

### Restore production

1. Stop the management service and verify no application process is using the
   volume. Take a fresh recovery copy first if the old database is readable.
2. Preserve the stopped database and its `-wal`/`-shm` companions together for
   investigation. Never mix an older backup database with stale WAL files.
3. Put the verified snapshot at the configured `OPENMATH_DB` path in the private
   volume. It must be owned by the application UID/GID 1000 with mode `0600`;
   its directory must permit the application to create SQLite sidecar files.
4. Start the matching service version with the same canonical origin and verified
   owner configuration. Check liveness, login, scoped access, and revision reads.
5. Review changes made after the snapshot, especially revoked grants, revoked
   API tokens, sessions, and submitted publication jobs. Restore those decisions
   before reopening normal access. An old backup may contain authority that was
   subsequently revoked; reconcile public GitHub submissions before any retry.

Do not use `docker compose down -v` as an upgrade or restart: it deletes the
database and certificate volumes. A code rollback does not automatically undo a
database migration; retain the previous image, snapshot, and configuration and
check compatibility before switching versions.

## Release evidence to retain

Keep the application commit, build/test results, effective deployment version,
backup hash, observed OAuth account ID, scoped-access checks, and any actual
GitHub PR/deployment receipts. Never substitute an HTTP liveness response for a
verified login or a created PR for a published mathematical edition.

For public-repository changes, follow `AGENTS.md` and `docs/MAINTENANCE.md`,
including the existing build, content, frozen-release, and append-only-history
checks. This service does not alter mathematical proof status on its own.
