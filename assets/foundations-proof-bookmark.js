const bookmark = document.querySelector('main a');
const target = new URL(bookmark.href);
let fragment = '';
try { fragment = decodeURIComponent(location.hash); } catch { /* Use the static bookmark. */ }
const oldChapter = target.pathname.endsWith('/contents/') && fragment.match(/^#dependency-(\d{1,2}|appendix-[a-i])$/);
const permitted = bookmark.getAttribute('data-proof-bookmark');
const retainedProof = permitted === 'true' || permitted?.split(' ').includes(fragment.slice(1));
if (oldChapter) {
  target.pathname = target.pathname.replace(/contents\/$/, `chapters/${oldChapter[1]}/`);
  target.hash = 'chapter-proofs';
} else if (retainedProof && /^#(?:foundations-exact-proof|proof-(?:item|paragraph)-\d+)$/.test(fragment)) {
  target.hash = fragment;
} else if (/^#open-NAG-\d{6}$/.test(fragment)) {
  target.pathname = target.pathname.replace(/(?:contents|chapters\/[^/]+)\/$/, 'coverage/');
  target.hash = fragment;
}
location.replace(target);
