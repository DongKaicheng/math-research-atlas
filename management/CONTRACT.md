# Standalone management service contract

All URLs are same-origin. JSON requests use `Content-Type: application/json` and
the `X-CSRF-Token` returned by `/api/context`. Responses use `{error, code}` on
failure. OAuth starts at `/auth/github`; logout is POST `/api/logout`.
No ChatGPT account, SDK, key, or runtime is used. Production requires HTTPS.

## Browser API

- `GET /api/context`: `{user: {id, login, name}|null, isOwner, csrfToken,
  loginConfigured, publicationConfigured, publicOrigin, repository, demo}`.
- `GET /api/docs`: authenticated route and scoped-token reference.
- `GET /api/projects`: `{projects:[{id,title,category,summary,sourceKind,role,
  publicationPolicy,createdAt}]}`. Roles: owner, manager, editor, reviewer.
- `POST /api/projects` (owner): `{slug,title,category,summary,proposalIssue?}`.
- `GET /api/accounts` (owner): `{accounts:[{id,login,name}]}`.
- `GET /api/projects/:id/members`: `{members:[{userId,login,role}],
  invitations:[{id,userId,login,role,status,expiresAt}]}`.
- `POST /api/projects/:id/invitations` (owner): `{userId,role}`. The registered
  recipient must accept; creating this record does not send email.
- `DELETE /api/projects/:id/members/:userId` (owner): immediate revocation.
- `DELETE /api/invitations/:id` (owner): revoke an invitation.
- `GET /api/invitations`: current user's pending invitations.
- `POST /api/invitations/:id/accept`: accept as the named recipient.
- `GET /api/projects/:id/sources`: `{ref,files:[{path,sha,size,editable}]}`.
- `GET /api/projects/:id/source?path=...&ref=...`: `{path,content,sha,ref,editable}`.
- `GET /api/projects/:id/revisions`: `{revisions:[{id,title,version,hash,status,
  authorId,createdAt,updatedAt}]}`.
- `POST /api/projects/:id/revisions`: `{title,baseRef,changes:[{path,content,
  baseSha:string|null}]}`. Paths must be server-authorized project text sources.
- `GET /api/revisions/:id`: full revision with changes, versions, reviews and job.
- `PUT /api/revisions/:id`: `{expectedVersion,title,changes}`. Increments version;
  invalidates approval. No changes to submitted public candidates.
- `POST /api/revisions/:id/submit`: `{expectedVersion}`.
- `POST /api/revisions/:id/review`: `{expectedVersion,expectedHash,
  verdict:note|changes_requested|ready,notes}`. Reviews bind to the exact hash.
- `POST /api/revisions/:id/approve` (owner): `{expectedVersion,expectedHash}`.
- `POST /api/revisions/:id/publish` (owner): `{expectedVersion,expectedHash,
  operationId}`. Discloses only approved changes in a public GitHub PR. Returns
  `{job:{id,state,prUrl?,branch?,error?}}`. It never auto-merges or claims deploy.
- `GET /api/projects/:id/audit`: `{events:[{id,action,actorId,createdAt,detail}]}`.
- `GET /api/tokens`: current user's metadata, never token secrets.
- `POST /api/tokens`: `{name,projectIds,write,days}` returns one-time `{token,...}`.
- `DELETE /api/tokens/:id`: revoke own token. Bearer tokens use the same object
  checks and current grants; they cannot administer accounts or publish.
- `GET /healthz`: public liveness only; no private data.

The unaffiliated reader follows existing public GitHub proposal links. An empty
workspace shows these links, not fabricated projects. Optional demo mode is
loopback-only, uses an explicitly disposable database and fixture repository,
and disables all external write operations.

## Source adapter interface (server/github.mjs)

Export `GitHubRepository` initialized with `{repository,branch,token,fetchImpl}`.
Methods: `head() -> sha`, `listSources(project, ref?) -> {ref,files}`,
`readSource(project,path,ref) -> {path,content,sha,ref,editable}`,
`validateChanges(project,baseRef,changes) -> normalizedChanges`,
`publish(project,revision,operationId,beforeSubmit) -> {prUrl,branch,headSha}`.
`beforeSubmit()` is awaited immediately before the first public write. The
service serializes revision publication with grant changes. Retries reconcile
an operation-bound deterministic branch and existing PR. Revision includes
`id,title,hash,baseRef,changes`; changes include exact `baseSha` or null.
Export `initialProjectFiles(project) -> changes` for a new unpublished project,
`isReadablePath(projectId,path)` and `isEditablePath(projectId,path)`.
Initial project files contain no invented mathematical results and include its
empty acknowledgement source. Preserve source/frozen edition boundaries.

Runtime is Node 24 (native HTTP, SQLite), with React built by existing esbuild.
Private DB is outside all public build paths. GitHub OAuth access tokens are
used only to fetch identity, then discarded. Publication uses a separately
configured repository credential. No credentials in git or in client bundles.
