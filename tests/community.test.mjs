import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applicationIssueUrl, issueCategory, issueProject, matchesFeedback} from '../lib/feedback.mjs';
import {validateAdministrationConfig} from '../scripts/build-community.mjs';

const repository = 'Example/math-atlas';
const read = file => readFile(new URL('../dist/' + file, import.meta.url), 'utf8');

test('Project and manager application links prepare only the intended public Issue form', () => {
  for (const kind of ['project-proposal', 'maintainer-application']) {
    const draft = new URL(applicationIssueUrl(repository, kind));
    assert.equal(draft.origin, 'https://github.com');
    assert.equal(draft.pathname, '/Example/math-atlas/issues/new');
    assert.equal(draft.searchParams.get('template'), kind + '.yml');
    assert.equal(draft.searchParams.get('title'), '[' + kind[0].toUpperCase() + kind.slice(1) + '] ');
    for (const key of ['project', 'target', 'version', 'role', 'approved']) assert.equal(draft.searchParams.has(key), false);
  }
  assert.throws(() => applicationIssueUrl('https://other.example/a', 'project-proposal'), /repository/);
  assert.throws(() => applicationIssueUrl(repository, '../grant-owner'), /category/);
});

test('Applications remain site-wide even when a submitter supplies a project label or text', () => {
  for (const [kind, prefix] of [['project-proposal', 'Project-proposal'], ['maintainer-application', 'Maintainer-application']]) {
    const issue = {title: '[' + prefix + '] [strong-green]', labels: ['project:strong-green'], body: '### Project (optional)\n\nstrong-green\n\n### Related project or result\n\nstrong-green'};
    assert.equal(issueCategory(issue), kind);
    assert.equal(issueProject(issue), '');
    assert.equal(matchesFeedback(issue, {category: kind}), true);
    assert.equal(matchesFeedback(issue, {project: 'strong-green'}), false);
  }
});

test('Public administration links require complete HTTPS configuration and cannot carry credentials', () => {
  assert.deepEqual(validateAdministrationConfig({schemaVersion: 1, state: 'preparing', managementUrl: null, aiManagementUrl: null}), {state: 'preparing', managementUrl: null, aiManagementUrl: null});
  const ready = {schemaVersion: 1, state: 'ready', managementUrl: 'https://admin.example.org/', aiManagementUrl: 'https://admin.example.org/ai'};
  assert.equal(validateAdministrationConfig(ready).state, 'ready');
  for (const managementUrl of ['http://admin.example.org/', 'https://user:pass@admin.example.org/', 'https://admin.example.org/?token=secret', 'https://admin.example.org/#secret']) {
    assert.throws(() => validateAdministrationConfig({...ready, managementUrl}), /administration URL/);
  }
  assert.throws(() => validateAdministrationConfig({...ready, aiManagementUrl: null}), /verified/);
  assert.throws(() => validateAdministrationConfig({...ready, aiManagementUrl: 'https://other.example.org/ai'}), /origin/);
});

test('Participation is discoverable while the management entry stays outside search indexes', async () => {
  const home = await read('index.html');
  assert.match(home, /New projects and project managers are welcome/);
  assert.match(home, /contribute\/projects\//);
  assert.match(home, /contribute\/maintainers\//);
  const project = await read('contribute/projects/index.html');
  const manager = await read('contribute/maintainers/index.html');
  assert.match(project, /template=project-proposal\.yml/);
  assert.match(manager, /template=maintainer-application\.yml/);
  for (const page of [project, manager]) {
    assert.match(page, /opens a draft on GitHub/);
    assert.doesNotMatch(page, /application has been submitted|access has been granted|\/api\/submit/);
  }
  const admin = await read('admin/index.html');
  assert.match(admin, /name="robots" content="noindex,follow"/);
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /contribute\/projects\//);
  assert.match(sitemap, /contribute\/maintainers\//);
  assert.match(sitemap, /ai-management\//);
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/admin\//);
  const search = JSON.parse(await read('search-index.json'));
  assert.ok(search.some(item => item.link.endsWith('/contribute/projects/')));
  assert.equal(search.some(item => item.link.endsWith('/admin/')), false);
});
