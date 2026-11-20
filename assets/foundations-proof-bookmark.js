const oldChapter = location.hash.match(/^#dependency-(\d{1,2}|appendix-[a-i])$/);
const target = oldChapter ? '../../chapters/' + oldChapter[1] + '/#chapter-proofs' : '../../contents/';
location.replace(new URL(target, location.href));
