if (matchMedia('(min-width: 62rem)').matches) {
  for (const disclosure of document.querySelectorAll('details[data-desktop-open]')) disclosure.open = true;
}

function revealBookmark() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  let expanded = false;
  for (let details = target?.closest('details'); details; details = details.parentElement?.closest('details')) {
    if (details.open) continue;
    details.open = true;
    expanded = true;
  }
  if (expanded) target.scrollIntoView();
}

revealBookmark();
addEventListener('hashchange', revealBookmark);
