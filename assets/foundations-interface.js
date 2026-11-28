if (matchMedia('(min-width: 62rem)').matches) {
  for (const disclosure of document.querySelectorAll('details[data-desktop-open]')) disclosure.open = true;
}

const keyboardCitationReturns = new Map();
const citationHistoryKey = (from, to) => from + '\n' + to;

function statementBookmark(hash) {
  try { return decodeURIComponent(hash.slice(1)); } catch { return ''; }
}

const statusRow = id => document.querySelector('[data-statement-bookmark="'+CSS.escape(id)+'"]');

function handleChapterCitation(event) {
  if (event.defaultPrevented || event.button!==0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const link = event.target.closest?.('a[href]');
  if (!link?.hash || link.origin!==location.origin || link.pathname!==location.pathname ||
      link.search!==location.search || (link.target && link.target!=='_self') ||
      !statusRow(statementBookmark(link.hash))) return;
  if (link.hash===location.hash) {
    // Reactivating the current fragment does not dispatch hashchange.
    requestAnimationFrame(() => { if (location.href===link.href) revealBookmark(); });
  } else if (event.detail===0) {
    keyboardCitationReturns.set(citationHistoryKey(link.href,location.href),link);
  }
}

function revealBookmark(event) {
  const citation = event?.oldURL && keyboardCitationReturns.get(citationHistoryKey(event.oldURL,event.newURL));
  if (citation) {
    // Let native history restore its scroll position before restoring focus.
    requestAnimationFrame(() => {
      if (location.href!==event.newURL) return;
      citation.focus({preventScroll:true});
      const bounds = citation.getBoundingClientRect();
      if (bounds.top<0 || bounds.bottom>innerHeight) citation.scrollIntoView({block:'center'});
    });
    return;
  }
  const focused = document.activeElement;
  if (focused?.hasAttribute('data-statement-bookmark')) focused.blur();
  if (!location.hash) return;
  const id = statementBookmark(location.hash);
  const target = document.getElementById(id);
  if (!target) return;
  let expanded = false;
  for (let details = target.closest('details'); details; details = details.parentElement?.closest('details')) {
    if (details.open) continue;
    details.open = true;
    expanded = true;
  }
  const marker = statusRow(id);
  if (marker && document.readyState !== 'complete') {
    // The browser can finish following the initial fragment after deferred scripts.
    addEventListener('pageshow', revealBookmark, {once:true});
  } else if (marker) {
    marker.focus({preventScroll:true});
    marker.scrollIntoView({block:'start'});
  } else if (expanded || target.hasAttribute('data-reveal-proof-bookmark')) {
    target.scrollIntoView();
  }
}

revealBookmark();
addEventListener('hashchange', revealBookmark);
if (document.querySelector('[data-statement-bookmark]')) addEventListener('click', handleChapterCitation);
