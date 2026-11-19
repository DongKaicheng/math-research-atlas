import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAcknowledgements} from '../lib/acknowledgements.mjs';

const repository = 'Example/math-atlas';
const gh = 'https://github.com/' + repository;
const projects = [{project: {id: 'bedford-taylor'}}, {id: 'foundations'}, {project: {id: 'strong-green'}}];
const documents = () => projects.map(project => ({
  schemaVersion: 1, projectId: project.project?.id ?? project.id,
  updatedAt: '2026-11-19', acknowledgements: [],
}));
const contribution = (changes = {}) => ({
  id: 'bt-reference-12', projectId: 'bedford-taylor', status: 'incorporated',
  category: 'reference', summary: 'Corrected the reference attached to a reading note.',
  acceptedAt: '2026-11-17', incorporatedAt: '2026-11-18',
  feedbackUrl: gh + '/issues/12', acceptanceUrl: gh + '/issues/12#issuecomment-150',
  changeUrl: gh + '/pull/14', credit: {mode: 'unattributed'}, ...changes,
});
const ledger = (contributions = []) => ({schemaVersion: 1, updatedAt: '2026-11-19', contributions});
const validate = (items = [], docs = documents()) => validateAcknowledgements(docs, ledger(items), projects, repository);

test('Every existing project gets its own empty acknowledgement record', () => {
  const result = validate();
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.updatedAt, '2026-11-19');
  assert.deepEqual(Object.keys(result.byProject), ['bedford-taylor', 'foundations', 'strong-green']);
  for (const [id, record] of Object.entries(result.byProject)) {
    assert.equal(record.projectId, id);
    assert.deepEqual(record.acknowledgements, []);
    assert.deepEqual(record.contributions, []);
  }
});

test('Research sharing is separate from adopted feedback and remains project-scoped', () => {
  const docs = documents();
  docs[0].acknowledgements.push({id: 'mingchen-xia-research-sharing', displayName: 'Mingchen Xia (夏铭辰)', text: 'We thank Mingchen Xia (夏铭辰) for sharing his research.'});
  const result = validate([], docs);
  assert.equal(result.byProject['bedford-taylor'].acknowledgements[0].displayName, 'Mingchen Xia (夏铭辰)');
  assert.deepEqual(result.byProject['bedford-taylor'].contributions, []);
  assert.deepEqual(result.byProject.foundations.acknowledgements, []);
  assert.deepEqual(result.byProject['strong-green'].acknowledgements, []);
});

test('Incorporated feedback retains its exact evidence, dates and credit mode', () => {
  const input = contribution();
  assert.deepEqual(validate([input]).byProject['bedford-taylor'].contributions, [input]);
  const commit = contribution({changeUrl: gh + '/commit/' + 'a'.repeat(40)});
  assert.equal(validate([commit]).byProject['bedford-taylor'].contributions[0].changeUrl, commit.changeUrl);
});

test('Named and username credit require explicit consent in that feedback thread', () => {
  for (const credit of [
    {mode: 'named', displayName: 'A Researcher', consentUrl: gh + '/issues/12#issuecomment-151'},
    {mode: 'username', displayName: '@researcher', consentUrl: gh + '/issues/12'},
  ]) assert.deepEqual(validate([contribution({credit})]).byProject['bedford-taylor'].contributions[0].credit, credit);
  for (const credit of [
    {mode: 'named', displayName: 'A Researcher'},
    {mode: 'username', displayName: 'researcher'},
    {mode: 'named', displayName: 'A Researcher', consentUrl: gh + '/issues/13#issuecomment-151'},
    {mode: 'named', displayName: 'A Researcher', consentUrl: gh + '/pull/12'},
    {mode: 'username', displayName: 'a researcher', consentUrl: gh + '/issues/12'},
    {mode: 'anonymous'},
  ]) assert.throws(() => validate([contribution({credit})]), /credit/);
});

test('Unattributed means no additional public name, not an anonymity guarantee', () => {
  assert.deepEqual(validate([contribution()]).byProject['bedford-taylor'].contributions[0].credit, {mode: 'unattributed'});
  for (const credit of [
    {mode: 'unattributed', displayName: 'A Reader'},
    {mode: 'unattributed', consentUrl: gh + '/issues/12'},
    {mode: 'unattributed', displayName: undefined},
  ]) assert.throws(() => validate([contribution({credit})]), /unattributed credit must omit/);
});

test('Closed, accepted, draft and alleged verified statuses never count as incorporation', () => {
  for (const status of ['closed', 'accepted', 'draft', 'reviewed', 'proved', '', undefined]) {
    assert.throws(() => validate([contribution({status})]), /must be incorporated/);
  }
  assert.throws(() => validate([contribution({category: 'verified-proof'})]), /feedback category/);
});

test('Dates are exact real calendar days and ordered through incorporation', () => {
  for (const acceptedAt of ['2026-02-29', '2026-11-31', '2026-13-01', '2026-1-01', '2026-11-17T00:00:00Z', '', 20261117]) {
    assert.throws(() => validate([contribution({acceptedAt})]), /date/);
  }
  assert.throws(() => validate([contribution({acceptedAt: '2026-11-19'})]), /acceptedAt <= incorporatedAt/);
  assert.throws(() => validate([contribution({incorporatedAt: '2026-11-20'})]), /acceptedAt <= incorporatedAt/);
  assert.doesNotThrow(() => validate([contribution({acceptedAt: '2024-02-29'})]));
  const docs = documents();
  docs[0].updatedAt = '2026-02-30';
  assert.throws(() => validate([], docs), /calendar date/);
});

test('Feedback URLs are exact configured repository Issues, not arbitrary navigation', () => {
  const invalid = [
    'javascript:alert(1)', 'http://github.com/Example/math-atlas/issues/12',
    'https://github.com.evil.example/Example/math-atlas/issues/12',
    'https://github.com@evil.example/Example/math-atlas/issues/12',
    'https://u:p@github.com/Example/math-atlas/issues/12',
    'https://github.com:443/Example/math-atlas/issues/12',
    'https://github.com:444/Example/math-atlas/issues/12',
    gh + '/issues/12?next=other', gh + '/issues/12#issuecomment-150', gh + '/issues/12#',
    gh + '/issues/012', gh + '/issues/0', gh + '/issues/new', gh + '/pull/12',
    gh + '/issues/12/', gh + '/issues/../issues/12', gh + '/issues/%31%32',
    gh + '/issues/12\n', ' ' + gh + '/issues/12', gh + '/issues/12?',
    'https://github.com/Other/math-atlas/issues/12',
    'https://github.com/Example/math-atlas-extra/issues/12',
  ];
  for (const feedbackUrl of invalid) {
    assert.throws(() => validate([contribution({feedbackUrl})]), /feedbackUrl/, feedbackUrl);
  }
});

test('Acceptance and consent links stay on the exact source Issue', () => {
  for (const acceptanceUrl of [
    gh + '/issues/13', gh + '/issues/12#other', gh + '/issues/12#issuecomment-0',
    gh + '/issues/12#issuecomment-150?query', gh + '/issues/12?x=1#issuecomment-150',
    gh + '/pull/12#issuecomment-150',
  ]) assert.throws(() => validate([contribution({acceptanceUrl})]), /acceptanceUrl/);
  assert.doesNotThrow(() => validate([contribution({acceptanceUrl: gh + '/issues/12'})]));
});

test('Changes require an exact repository PR or a full lowercase commit SHA', () => {
  for (const changeUrl of [
    gh + '/issues/14', gh + '/pull/new', gh + '/pull/0', gh + '/pull/14/files',
    gh + '/pull/14#discussion', gh + '/pull/14?x=1',
    gh + '/commit/abcdef12', gh + '/commit/' + 'A'.repeat(40),
    gh + '/commit/' + 'a'.repeat(41), 'https://github.com/Other/math-atlas/pull/14',
  ]) assert.throws(() => validate([contribution({changeUrl})]), /changeUrl/);
});

test('Every required field is enforced and unknown fields cannot expose private metadata', () => {
  for (const key of Object.keys(contribution())) {
    const entry = contribution(); delete entry[key];
    assert.throws(() => validate([entry]), /is missing/);
  }
  for (const key of ['email', 'contact', 'privateNote', 'originalBody', 'review', 'approvedBy']) {
    assert.throws(() => validate([{...contribution(), [key]: 'private'}]), /unknown field/);
  }
  const docs = documents();
  docs[0].acknowledgements = [{id: 'reader', displayName: 'A Reader', text: 'Thank you.', email: 'private@example.org'}];
  assert.throws(() => validate([], docs), /unknown field/);
  assert.throws(() => validateAcknowledgements(documents(), {...ledger(), privateNotes: []}, projects, repository), /unknown field/);
  assert.throws(() => validate([contribution({credit: {mode: 'unattributed', email: 'private@example.org'}})]), /unknown field/);
});

test('Project coverage, schema versions and identifier uniqueness are checked', () => {
  assert.throws(() => validate([], documents().slice(1)), /missing project/);
  assert.throws(() => validate([], [...documents(), documents()[0]]), /more than one document/);
  const docs = documents(); docs[0].projectId = 'unpublished-project';
  assert.throws(() => validate([], docs), /not a known project/);
  assert.throws(() => validate([contribution({projectId: 'unpublished-project'})]), /not a known project/);
  assert.throws(() => validate([contribution(), contribution({feedbackUrl: gh + '/issues/13'})]), /duplicated in the ledger/);
  for (const id of ['', '../../x', 'Bad-ID', 'x_1', 'x'.repeat(101)]) {
    assert.throws(() => validate([contribution({id})]), /identifier/);
  }
  const duplicate = documents();
  duplicate[0].acknowledgements = [{id: 'bt-reference-12', displayName: 'A Reader', text: 'Thank you.'}];
  assert.throws(() => validate([contribution()], duplicate), /duplicated within this project/);
  assert.throws(() => validateAcknowledgements(documents(), {...ledger(), schemaVersion: 2}, projects, repository), /must be 1/);
  const badSchema = documents(); badSchema[0].schemaVersion = '1';
  assert.throws(() => validate([], badSchema), /must be 1/);
});

test('One public Issue may have distinct incorporated changes in different projects', () => {
  const records = [contribution(), contribution({id: 'foundations-reference-12', projectId: 'foundations'})];
  const result = validate(records);
  assert.equal(result.byProject['bedford-taylor'].contributions.length, 1);
  assert.equal(result.byProject.foundations.contributions.length, 1);
});

test('A collaborative Issue may credit separate contributors for independently recorded changes', () => {
  const first = contribution({
    id: 'bt-reference-reader-one',
    summary: 'Corrected the reference attached to a reading note.',
    acceptanceUrl: gh + '/issues/12#issuecomment-160',
    changeUrl: gh + '/pull/14',
    credit: {mode: 'named', displayName: 'Reader One', consentUrl: gh + '/issues/12#issuecomment-151'},
  });
  const second = contribution({
    id: 'bt-correction-reader-two', category: 'correction',
    summary: 'Corrected a separate transcription error discussed in the same thread.',
    acceptanceUrl: gh + '/issues/12#issuecomment-170',
    changeUrl: gh + '/commit/' + 'b'.repeat(40),
    credit: {mode: 'named', displayName: 'Reader Two', consentUrl: gh + '/issues/12#issuecomment-152'},
  });
  const result = validate([first, second]).byProject['bedford-taylor'].contributions;
  assert.equal(result.length, 2);
  assert.deepEqual(result.find(entry => entry.id === first.id), first);
  assert.deepEqual(result.find(entry => entry.id === second.id), second);
  assert.throws(() => validate([first, {...second, id: first.id}]), /duplicated in the ledger/);
  assert.throws(() => validate([first, {...second, credit: {mode: 'named', displayName: 'Reader Two'}}]), /credit/);
  assert.throws(() => validate([first, {...second, acceptanceUrl: gh + '/issues/13#issuecomment-170'}]), /acceptanceUrl/);
});

test('Plain-text values remain literal, bounded and never interpreted as markup', () => {
  const literal = '<img src=x onerror="alert(1)"> & an inequality a < b';
  const result = validate([contribution({summary: '  ' + literal + '  '})]);
  assert.equal(result.byProject['bedford-taylor'].contributions[0].summary, literal);
  // The page renderer must escape these values; this library does not emit HTML.
  for (const summary of ['', '  ', '\u200b', 'x'.repeat(1001), 'x\ny', 'x\u0000y', 'x\u202ey', 'x\u2066y', 5, {}]) {
    assert.throws(() => validate([contribution({summary})]), /summary/);
  }
  const docs = documents();
  docs[0].acknowledgements = [{id: 'long', displayName: 'x'.repeat(161), text: 'Thanks.'}];
  assert.throws(() => validate([], docs), /exceeds/);
});

test('Grouping is deterministic, reentrant and independent of input order without mutation', () => {
  const docs = documents();
  docs[0].acknowledgements = [
    {id: 'z-reader', displayName: 'Z', text: 'Thank you.'},
    {id: 'a-reader', displayName: 'A', text: 'Thank you.'},
  ];
  const entries = [contribution(), contribution({id: 'bt-correction-9', feedbackUrl: gh + '/issues/9', acceptanceUrl: gh + '/issues/9', incorporatedAt: '2026-11-19'})];
  const original = JSON.stringify({docs, entries});
  const first = validate(entries, docs);
  assert.equal(JSON.stringify({docs, entries}), original);
  assert.deepEqual(validate(entries, docs), first);
  assert.deepEqual(validateAcknowledgements([...docs].reverse(), ledger([...entries].reverse()), [...projects].reverse(), repository), first);
  assert.deepEqual(first.byProject['bedford-taylor'].acknowledgements.map(item => item.id), ['a-reader', 'z-reader']);
  assert.deepEqual(first.byProject['bedford-taylor'].contributions.map(item => item.id), ['bt-correction-9', 'bt-reference-12']);
  first.byProject['bedford-taylor'].contributions[0].credit.mode = 'mutated';
  assert.equal(entries[1].credit.mode, 'unattributed');
});

test('Invalid containers and repository names fail rather than widening the scope', () => {
  assert.throws(() => validateAcknowledgements(null, ledger(), projects, repository), /must be an array/);
  assert.throws(() => validateAcknowledgements(documents(), [], projects, repository), /plain object/);
  assert.throws(() => validateAcknowledgements(documents(), ledger(), [], repository), /nonempty array/);
  assert.throws(() => validateAcknowledgements(documents(), ledger(), [...projects, projects[0]], repository), /duplicate project/);
  for (const name of ['https://github.com/Example/math-atlas', 'Example/../math-atlas', 'Example/..', 'Example/.', 'Example/math-atlas?x=1', undefined]) {
    assert.throws(() => validateAcknowledgements(documents(), ledger(), projects, name), /repository/);
  }
});

test('Page update dates include ledger revisions and preserve newer general thanks', () => {
  const docs = documents(); docs[1].updatedAt = '2026-11-20';
  const result = validate([], docs);
  assert.equal(result.updatedAt, '2026-11-20');
  assert.equal(result.byProject.foundations.updatedAt, '2026-11-20');
  assert.equal(result.byProject['bedford-taylor'].updatedAt, '2026-11-19');
});
