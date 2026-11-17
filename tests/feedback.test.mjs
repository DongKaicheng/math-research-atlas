import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  FEEDBACK_CATEGORIES, feedbackContext, feedbackIssueUrl, feedbackIssueDraft, MAX_ISSUE_URL_LENGTH,
  issueCategory, issueProject, matchesFeedback, isRepositoryIssueUrl,
} from '../lib/feedback.mjs';

const repository = 'Example/math-atlas';
const context = {
  project: 'strong-green', entry: 'SG-001', version: 'v0.5.1',
  page: 'https://example.github.io/math-atlas/projects/strong-green/r/SG-001/',
};

test('General feedback has no invented project, theorem, or edition', () => {
  const url = new URL(feedbackIssueUrl(repository, 'general', context));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/Example/math-atlas/issues/new');
  assert.equal(url.searchParams.get('template'), 'general.yml');
  assert.equal(url.searchParams.get('title'), '[General] ');
  for (const key of ['project', 'entry', 'target', 'version']) assert.equal(url.searchParams.has(key), false);
});

test('Every mathematical category preserves exact optional context', () => {
  for (const [kind] of FEEDBACK_CATEGORIES.filter(([kind]) => kind !== 'general')) {
    const url = new URL(feedbackIssueUrl(repository, kind, context));
    assert.equal(url.searchParams.get('project'), context.project);
    assert.equal(url.searchParams.get('version'), context.version);
    assert.equal(url.searchParams.get('target'), context.entry + ' — ' + context.page);
    assert.equal(url.searchParams.get('template'), kind + '.yml');
  }
});

test('Mathematical feedback may omit all context without guessing a revision', () => {
  const url = new URL(feedbackIssueUrl(repository, 'question'));
  assert.equal(url.searchParams.get('title'), '[Question] ');
  assert.equal(url.searchParams.has('project'), false);
  assert.equal(url.searchParams.has('version'), false);
  assert.equal(url.searchParams.has('target'), false);
});

test('Context can be round-tripped through encoded query parameters', () => {
  assert.deepEqual(feedbackContext(new URLSearchParams(context)), context);
  assert.deepEqual(feedbackContext('?' + new URLSearchParams(context)), context);
  assert.deepEqual(feedbackContext({}), {project: '', entry: '', version: '', page: ''});
});

test('Overlong exact references are omitted, never truncated into a different citation', () => {
  const page = 'https://example.org/' + 'a'.repeat(1100) + '#proof';
  const result = feedbackIssueDraft(repository, 'correction', {...context, page});
  assert.equal(feedbackContext({page}).page, '');
  assert.deepEqual(result.omitted, ['page']);
  assert.equal(new URL(result.url).searchParams.get('target'), context.entry);
  assert.equal(new URL(result.url).searchParams.get('version'), context.version);
  assert.equal(feedbackContext({entry: 'X'.repeat(129)}).entry, '');
  assert.equal(feedbackContext({version: 'v'.repeat(121)}).version, '');
});

test('Encoded Unicode context stays within the Issue draft URL budget and reports omissions', () => {
  const page = 'https://example.org/?q=' + 'é'.repeat(140) + '#proof';
  const c = {...context, page, version: '版'.repeat(120)};
  assert.ok(feedbackContext(c).page.endsWith('#proof'), 'The source reference itself remains exact');
  const result = feedbackIssueDraft(repository, 'correction', c);
  assert.ok(result.url.length <= MAX_ISSUE_URL_LENGTH);
  assert.ok(result.omitted.includes('page'));
  assert.equal(new URL(result.url).searchParams.get('target'), context.entry);
  assert.equal(new URL(result.url).searchParams.get('project'), context.project);
});

test('Bedford–Taylor feedback retains a fixed edition, source anchor, and permanent ID', () => {
  const bt = {
    project: 'bedford-taylor', entry: 'R01', version: 'v0.18.0',
    page: 'https://example.github.io/math-atlas/projects/bedford-taylor/editions/v0.18.0/results/r01/#proof',
  };
  const incoming = feedbackContext(new URLSearchParams(bt));
  assert.deepEqual(incoming, bt);
  const url = new URL(feedbackIssueUrl(repository, 'correction', incoming));
  assert.equal(url.searchParams.get('project'), 'bedford-taylor');
  assert.equal(url.searchParams.get('version'), 'v0.18.0');
  assert.equal(url.searchParams.get('target'), bt.entry + ' — ' + bt.page);
  assert.equal(url.searchParams.get('title'), '[Correction] [bedford-taylor] ');
  const general = new URL(feedbackIssueUrl(repository, 'general', incoming));
  for (const field of ['project', 'target', 'version']) assert.equal(general.searchParams.has(field), false);
});

test('Untrusted context cannot select an external endpoint or unsafe URL scheme', () => {
  assert.equal(feedbackContext({project: '../../other'}).project, '');
  assert.equal(feedbackContext({project: 'a'.repeat(81)}).project, '');
  assert.equal(feedbackContext({entry: '<script>alert(1)</script>'}).entry, '');
  assert.equal(feedbackContext({page: 'javascript:alert(1)'}).page, '');
  assert.equal(feedbackContext({page: '//other.example/'}).page, '');
  assert.equal(feedbackContext({page: 'https://user:secret@example.org/'}).page, '');
  assert.equal(feedbackContext({page: '/projects/strong-green/'}).page, '/projects/strong-green/');
  assert.equal(feedbackContext({version: 'v1\ntext'}).version, 'v1 text');
  assert.throws(() => feedbackIssueUrl('https://evil.example/a', 'general'), /Invalid feedback repository/);
  assert.throws(() => feedbackIssueUrl(repository, '../../api/write'), /Unknown feedback category/);
});

test('Category labels and title prefixes are recognised without assigning unknowns a proof status', () => {
  assert.equal(issueCategory({labels: [{name: 'correction'}]}), 'correction');
  assert.equal(issueCategory({title: '[General] Navigation feedback'}), 'general');
  assert.equal(issueCategory({title: '[Proof] [strong-green] An argument'}), 'proof');
  assert.equal(issueCategory({title: 'Something uncategorised'}), 'other');
});

test('Project filtering reads the exact issue-form project field', () => {
  const issue = {title: '[Correction] A detail', body: '### Project (optional)\n\nstrong-green\n\n### Related project or result\n\nSG-001\n\n### Version (if relevant)\n\nv0.5.1'};
  assert.equal(issueProject(issue), 'strong-green');
  assert.equal(matchesFeedback(issue, {project: 'strong-green'}), true);
  assert.equal(matchesFeedback(issue, {project: 'bedford-taylor'}), false);
  assert.equal(matchesFeedback(issue, {category: 'correction', project: 'strong-green'}), true);
  assert.equal(matchesFeedback(issue, {category: 'proof', project: 'strong-green'}), false);
});

test('Legacy target fields and category/project prefixes continue to work', () => {
  assert.equal(issueProject({title: '[strong-green] Question'}), 'strong-green');
  assert.equal(issueProject({title: '[Question] [bedford-taylor] Question'}), 'bedford-taylor');
  assert.equal(issueProject({body: '### Related project or result\n\nhttps://example.org/projects/foundations/\n\n### Version (if relevant)\n\n0'}), 'foundations');
  assert.equal(issueProject({body: '### Related project or result\n\nstrong-green'}), 'strong-green');
  assert.equal(issueProject({body: 'The project strong-green was mentioned incidentally.'}), '');
});

test('General feedback remains site-wide; Pull Requests are not duplicate discussion threads', () => {
  assert.equal(issueProject({title: '[General] [strong-green]', labels: ['project:strong-green']}), '');
  assert.equal(matchesFeedback({title: '[General] A suggestion'}, {}), true);
  assert.equal(matchesFeedback({title: '[General] A suggestion'}, {project: 'strong-green'}), false);
  assert.equal(matchesFeedback({pull_request: {}, title: '[Proof] Proposed change'}, {}), false);
});

test('Discussion links accept only the configured repository and actual numeric issue paths', () => {
  assert.equal(isRepositoryIssueUrl('https://github.com/Example/math-atlas/issues/12', repository), true);
  for (const value of [
    'javascript:alert(1)', 'https://github.com.evil.example/Example/math-atlas/issues/1',
    'https://github.com/Other/math-atlas/issues/1', 'https://github.com/Example/math-atlas/issues/new',
    'https://github.com/Example/math-atlas/issues/1?next=other',
    'https://u:p@github.com/Example/math-atlas/issues/1',
  ]) assert.equal(isRepositoryIssueUrl(value, repository), false, value);
});

test('All eight Issue forms exist; general has no project/result/version field', async () => {
  for (const [kind] of FEEDBACK_CATEGORIES) {
    const yaml = await readFile(new URL('../.github/ISSUE_TEMPLATE/' + kind + '.yml', import.meta.url), 'utf8');
    assert.match(yaml, /body:/);
    assert.match(yaml, /\.zip/);
    assert.match(yaml, /public/i);
    assert.match(yaml, /id: details/);
    assert.match(yaml, /required: true/);
    if (kind === 'general') assert.doesNotMatch(yaml, /id: (?:project|target|version)\b/);
    else {
      assert.match(yaml, /id: project/);
      assert.match(yaml, /label: Project \(optional\)/);
      assert.match(yaml, /label: Related project or result/);
      assert.match(yaml, /label: Version \(if relevant\)/);
    }
  }
});

test('Board uses read-only text rendering, pagination, and a safe GitHub fallback', async () => {
  const source = await readFile(new URL('../assets/feedback.js', import.meta.url), 'utf8');
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|localStorage|Authorization|method:\s*['"]POST/);
  assert.match(source, /Load older feedback/);
  assert.match(source, /page=' \+ nextPage/);
  assert.match(source, /Browse and search all GitHub Issues/);
  assert.match(source, /credentials: 'omit'/);
});
