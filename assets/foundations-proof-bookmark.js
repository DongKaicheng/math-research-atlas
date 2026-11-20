const bookmark = document.querySelector('main a');
const target = new URL(bookmark.href);
const oldChapter = target.pathname.endsWith('/contents/') && location.hash.match(/^#dependency-(\d{1,2}|appendix-[a-i])$/);
if (oldChapter) {
  target.pathname = target.pathname.replace(/contents\/$/, `chapters/${oldChapter[1]}/`);
  target.hash = 'chapter-proofs';
} else if (bookmark.hasAttribute('data-proof-bookmark') && /^#(?:foundations-exact-proof|proof-(?:item|paragraph)-\d+)$/.test(location.hash)) {
  target.hash = location.hash;
} else if (/^#open-NAG-\d{6}$/.test(location.hash)) {
  target.pathname = target.pathname.replace(/(?:contents|chapters\/[^/]+)\/$/, 'coverage/');
  target.hash = location.hash;
}
location.replace(target);
