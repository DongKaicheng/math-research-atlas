const query = new URLSearchParams(location.search);
const requested = query.get('tag') ?? query.get('dest') ?? query.get('page');
if (requested) {
  try {
    const response = await fetch(new URL('tags.json', location.href));
    if (!response.ok) throw Error('Reading locations are unavailable');
    const {tags, destinations, pages} = await response.json();
    const route = query.has('tag') ? tags[requested] : query.has('dest') ? destinations[requested] : pages[requested];
    if (typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')) location.replace(route);
    else throw Error('There is no HTML location for this bookmark');
  } catch {
    const note = document.querySelector('#reader-location');
    note.textContent = 'This bookmark does not have an exact web location. Browse the table of contents or search by Tag.';
    note.hidden = false;
  }
}
