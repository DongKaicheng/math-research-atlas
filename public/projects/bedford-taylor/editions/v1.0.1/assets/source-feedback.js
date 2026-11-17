// Both reading sites use the atlas's shared GitHub Issues board.
// A fragment is attached to the exact page; only registered result IDs are used.
(() => {
  const link = document.querySelector('[data-source-feedback]');
  if (!link) return;
  const initial = new URL(link.href);
  const page = initial.searchParams.get('page');
  const entry = initial.searchParams.get('entry') || '';
  const anchors = new Map();
  function update() {
    const url = new URL(initial.href);
    let fragment = '';
    try { fragment = decodeURIComponent(location.hash.slice(1)); } catch {}
    const id = anchors.get(fragment) || entry;
    if (id) url.searchParams.set('entry', id);
    else url.searchParams.delete('entry');
    url.searchParams.set('page', page + location.hash);
    link.href = url.href;
  }
  window.addEventListener('hashchange', update);
  update();
  const source = location.pathname.includes('/papers/bedford-taylor-products/')
    ? '/data/statements.json' : location.pathname.includes('/papers/research-program/')
      ? '/data/programme.json' : '';
  if (source) fetch(source).then(response => {
    if (!response.ok) throw new Error('Unavailable result index');
    return response.json();
  }).then(data => {
    const items = Array.isArray(data) ? data : data.items || [];
    for (const item of items) {
      const label = item.legacyLabel || item.latex_label || item.label;
      const id = item.mpmId || item.id;
      if (label && id) anchors.set(label, id);
    }
    update();
  }).catch(() => {});
})();
