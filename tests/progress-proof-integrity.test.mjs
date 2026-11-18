import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { progressProofs, validateProgressProofs } from '../strong-green/views/content/progress-proofs.mjs';
import { progressProofRequirements } from '../strong-green/views/content/progress-proof-required.mjs';

const { revision } = JSON.parse(await readFile(new URL('../content/strong-green/current.json', import.meta.url), 'utf8'));
const { entries } = JSON.parse(await readFile(new URL(`../content/strong-green/releases/${revision}/bundle.json`, import.meta.url), 'utf8'));
const validate = candidates => validateProgressProofs(entries, revision, candidates);
const candidateCase = (candidates, caseId) => candidates.find(item => item.caseId === caseId);

test('The retained proof inventory is independent of candidates and contains the published minimum', () => {
  assert.deepEqual(Object.keys(progressProofRequirements).sort(), progressProofs.map(item => item.caseId).sort());
  const requiredTrees = Object.values(progressProofRequirements).flatMap(item => item.treeIds);
  assert.ok(requiredTrees.length >= 117, 'Retain the initial inventory and the reviewed 18 November expansion; later additions may extend it');
  assert.equal(new Set(requiredTrees).size, requiredTrees.length);
  assert.ok(Object.isFrozen(progressProofRequirements));
  for (const [caseId, item] of Object.entries(progressProofRequirements)) {
    assert.ok(item.treeIds.length && item.sourceFiles.length, caseId);
    assert.ok(item.treeIds.every(id => id.startsWith('proof-' + caseId + '-')), caseId);
    assert.equal(new Set(item.sourceFiles).size, item.sourceFiles.length, caseId);
    assert.ok(Object.isFrozen(item.treeIds) && Object.isFrozen(item.sourceFiles), caseId);
  }
  assert.ok(validate(progressProofs).trees >= requiredTrees.length);
});

test('Removing any retained tree fails even when its application entry point still exists', () => {
  for (const [caseId, requirement] of Object.entries(progressProofRequirements)) {
    for (const treeId of requirement.treeIds) {
      const candidates = structuredClone(progressProofs);
      const item = candidateCase(candidates, caseId);
      item.trees = item.trees.filter(tree => tree.id !== treeId);
      assert.throws(() => validate(candidates), /Required Progress proof trees missing|Missing Progress proof tree/, caseId + ': ' + treeId);
    }
  }
});

test('Previously unprotected proof units are explicit members of the retained inventory', () => {
  const required = new Set(Object.values(progressProofRequirements).flatMap(item => item.treeIds));
  for (const id of [
    'proof-numerical-models-two-factor-tree',
    'proof-arithmetic-families-hypersurface-profile-tree',
    'proof-arithmetic-properties-all-prime-tree',
    'proof-arithmetic-properties-weak-mordell-weil-tree',
    'proof-arithmetic-properties-fields-tree',
    'proof-arithmetic-properties-arithmetic-barriers-tree',
  ]) assert.ok(required.has(id), id);
});

test('Every case retains each of its own required source receipts, even if another case cites that file', () => {
  for (const [caseId, requirement] of Object.entries(progressProofRequirements)) {
    for (const file of requirement.sourceFiles) {
      const candidates = structuredClone(progressProofs);
      const item = candidateCase(candidates, caseId);
      item.sourceBindings = item.sourceBindings.filter(source => source.file !== file);
      assert.throws(() => validate(candidates), /Required Progress proof source bindings missing|Missing Progress proof source binding/, caseId + ': ' + file);
    }
  }
});

test('Source locators must be a nonempty array containing only nonblank strings', () => {
  for (const locators of [undefined, null, '', 'a locator', [], [''], [' \n\t'], [null], [undefined], [7], [{}], ['valid', ' '], Array(1)]) {
    const candidates = structuredClone(progressProofs);
    candidates[0].sourceBindings[0].locators = locators;
    assert.throws(() => validate(candidates), /Invalid Progress proof source binding/, String(locators));
  }
  // Existing descriptive locators remain legitimate audit notes. This schema
  // check does not pretend they have all been converted into parsed TeX labels.
  assert.doesNotThrow(() => validate(progressProofs));
});

test('A context cannot hide an inference whose children the SVG renderer would omit', () => {
  const candidates = structuredClone(progressProofs);
  const tree = candidates[0].trees[0];
  tree.contexts = [...(tree.contexts || []), {
    id: 'proof-kernel-domain-integrity-hidden-context', title: 'Scope fixture',
    href: '/papers/global-height-pairing', status: 'hypothesis', note: 'An in-memory test context.',
    gate: {
      kind: 'all', label: 'Test inference', explanation: 'This derivation must not disappear inside a scope box.',
      sources: [{ href: '/papers/global-height-pairing', label: 'Fixture source' }],
      children: [{ id: 'proof-kernel-domain-integrity-hidden-child', title: 'Test child',
        href: '/papers/global-height-pairing', status: 'hypothesis', note: 'Must not be silently omitted.' }],
    },
  }];
  assert.throws(() => validate(candidates), /Progress context must not contain a logical relation/);
});

test('The retained minimum permits additional valid proof trees and source receipts', () => {
  const candidates = structuredClone(progressProofs);
  const item = candidates[0];
  const source = item.trees[0].root.gate.sources[0];
  item.trees.push({
    id: 'proof-kernel-domain-integrity-extension-tree', title: 'Schema extension fixture',
    summary: 'An additional tree does not replace the retained proof units.', scope: 'In-memory validation only.',
    root: {
      id: 'proof-kernel-domain-integrity-extension-result', title: 'Test conclusion',
      href: source.href, status: 'conditional', note: 'Fixture conclusion with its complete input.',
      gate: {
        kind: 'all', label: 'Fixture inference', explanation: 'Additional complete branches are allowed.', sources: [source],
        children: [{ id: 'proof-kernel-domain-integrity-extension-input', title: 'Test prerequisite',
          href: source.href, status: 'hypothesis', note: 'An explicit fixture prerequisite.' }],
      },
    },
  });
  const files = new Set(item.sourceBindings.map(binding => binding.file));
  const extra = progressProofs.flatMap(entry => entry.sourceBindings).find(binding => !files.has(binding.file));
  assert.ok(extra, 'Use a real additional public receipt in the extension fixture');
  item.sourceBindings.push(structuredClone(extra));
  assert.equal(validate(candidates).trees, validate(progressProofs).trees + 1);
});
