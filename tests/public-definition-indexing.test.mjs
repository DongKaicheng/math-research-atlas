import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const publication = JSON.parse(await read('content/strong-green/current.json'));
const bundle = JSON.parse(await read(`content/strong-green/releases/${publication.revision}/bundle.json`));
const sitemap = await read('dist/sitemap.xml');
const submitted = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]));

async function currentPage(id) {
  const html = await read(`dist/projects/strong-green/entries/${id}/index.html`);
  const head = html.split('</head>')[0];
  const canonical = head.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical?.endsWith(`/projects/strong-green/entries/${id}/`), id);
  return {html, head, canonical};
}

test('Published definition pages are discoverable without changing their source statuses', async () => {
  for (const id of ['BB-LOCAL-DATA', 'BB-INTEGRAL-IMAGE', 'BB-CENTRAL-DATA']) {
    const entry = bundle.entries.find(entry => entry.id === id);
    assert.equal(entry?.kind, 'definition', id);
    assert.equal(entry.status, 'draft', id + ': mathematical source status is preserved');
    const {html, head, canonical} = await currentPage(id);
    assert.match(html, /class="status status-draft">Definition<\/span>/, id);
    assert.doesNotMatch(head, /<meta\b[^>]*name="(?:robots|googlebot)"[^>]*content="[^"]*\b(?:noindex|none)\b/, id);
    assert.ok(submitted.has(canonical), id + ': current public definition is in the sitemap');
  }
});

test('Actual draft claims remain excluded from indexing and the sitemap', async () => {
  for (const id of ['BB-CURVE-PRODUCT-DRAFT', 'BB-REGULAR-PRODUCT-MODELS']) {
    const entry = bundle.entries.find(entry => entry.id === id);
    assert.equal(entry?.kind, 'result', id);
    assert.equal(entry.status, 'draft', id);
    const {head, canonical} = await currentPage(id);
    assert.match(head, /<meta name="robots" content="noindex,follow">/, id);
    assert.ok(!submitted.has(canonical), id + ': draft proof claim stays out of the sitemap');
  }
});
