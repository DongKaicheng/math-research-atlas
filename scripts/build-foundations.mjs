import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {augmentFoundationsLogic} from './build-foundations-logic.mjs';

const edition = 'sealed-1097';
const editionManifest = 'ca3238c1f7a5f15f97bc2d976133e07796c0a0839796731772af0f86109a0b2d';
const baseCommit = '84e46f292e4148410c802fdd89ec46bf7120943c';
const sourceManifest = '536c23ab4231ffb68955e69b905aeda8ab9abeda3a213e38efe688fbe6619b7e';
const pdfDigest = '5b22c1fddd04e3196989eeb7ce72f06caaa587bbdcb41600f62297c8a218b333';
const prefix = 'projects/foundations/editions/'+edition+'/';
const editionPage = prefix+'edition.json';
const publicHome = '/projects/foundations/';
const reader = prefix+'reader-en.pdf';
const heldIds = ['NAG-001586','NAG-001587','NAG-001831','NAG-001832','NAG-001990','NAG-002360','NAG-002484'];
const idPattern = /^NAG-[0-9]{6}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const privacy = /\/workspace\/|\/home\/agent\/|libfile_|private_library_readback|review_en\.md|recovery_private_en|preview_check_input_en|BEGIN [A-Z ]*PRIVATE KEY/i;
const sha = b=>createHash('sha256').update(b).digest('hex');

function requireFact(condition, message) {
  if (!condition) throw Error('Foundations release: '+message);
}

function allowed(name) {
  return name===prefix+'reader.css' ||
    /^r\/NAG-[0-9]{6}\/index\.html$/.test(name) ||
    /^projects\/foundations\/(?:index\.html|coverage\/index\.html|chapters\/[a-z0-9-]+\/index\.html)$/.test(name) ||
    name===reader || name===editionPage ||
    (name.startsWith(prefix+'proofs/') && /^NAG-[0-9]{6}-(?:reader\.jpg|[1-9][0-9]*\.png)$/.test(path.posix.basename(name)) &&
     path.posix.dirname(name)===prefix+'proofs');
}

async function regular(file) {
  requireFact((await lstat(file)).isFile(),'expected a regular file');
  return readFile(file);
}

async function inventory(dir, rel='') {
  requireFact((await lstat(dir)).isDirectory(),'payload directory or symlink');
  const files=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    requireFact(!entry.isSymbolicLink(),'symlink in edition payload');
    const name=rel+entry.name;
    if (entry.isDirectory()) files.push(...await inventory(path.join(dir,entry.name),name+'/'));
    else {
      requireFact(entry.isFile(),'nonregular edition payload member');
      files.push(name);
    }
  }
  return files;
}

async function verifiedFile(file,row) {
  const bytes=await regular(file);
  requireFact(bytes.length===row.bytes && sha(bytes)===row.sha256,'file hash mismatch for '+(row.path??'search index'));
  return bytes;
}

async function optionalRegular(file) {
  try { return await regular(file); }
  catch (error) { if (error.code==='ENOENT') return null; throw error; }
}

export async function loadFoundationsRelease(root) {
  const dir=path.join(root,'content','foundations');
  const selection=await optionalRegular(path.join(dir,'current.json'));
  const current=selection ? JSON.parse(selection) : null;
  if (current) {
    requireFact(current.schemaVersion===1 && current.project==='foundations' && current.edition===edition &&
      current.revision===1 && current.editionManifestSha256===editionManifest &&
      /^\d{4}-\d{2}-\d{2}$/.test(current.releaseDate) &&
      new Date(current.releaseDate+'T00:00:00Z').toISOString().startsWith(current.releaseDate) &&
      typeof current.changeSummary==='string' && current.changeSummary.length>0 && !privacy.test(current.changeSummary),
      'invalid current edition pointer');
  }
  const release=path.join(dir,'releases',edition);
  const manifestBytes=await optionalRegular(path.join(release,'manifest.json'));
  if (!manifestBytes) {
    requireFact(!current,'current edition has no manifest');
    return null;
  }
  requireFact(sha(manifestBytes)===editionManifest,'frozen manifest hash mismatch');
  const manifest=JSON.parse(manifestBytes);
  requireFact(manifest.schemaVersion===1 && manifest.project==='foundations' && manifest.edition===edition &&
    manifest.revision===1 && manifest.baseCommit===baseCommit &&
    manifest.sourceManifestSha256===sourceManifest && manifest.pdfSha256===pdfDigest,'invalid manifest identity');
  const names=new Set();
  for (const f of manifest.files) {
    requireFact(allowed(f.path) && !names.has(f.path) && Number.isSafeInteger(f.bytes) && f.bytes>0 &&
      digestPattern.test(f.sha256),'invalid payload manifest row');
    names.add(f.path);
  }
  const payload=path.join(release,'payload');
  const actual=await inventory(payload);
  requireFact(actual.length===names.size && actual.every(n=>names.has(n)),'unlisted or missing payload members');
  const pdf=manifest.files.find(f=>f.path===reader);
  requireFact(pdf?.sha256===pdfDigest,'wrong reader PDF');
  const contents=new Map();
  for (const file of manifest.files) {
    const bytes=await verifiedFile(path.join(payload,file.path),file);
    if (file.path.endsWith('.html') || file.path.endsWith('.json') || file.path.endsWith('.css')) {
      const text=bytes.toString('utf8');
      requireFact(!privacy.test(text),'private control content in '+file.path);
      if (file.path.endsWith('.html'))
        requireFact(!/<meta name="robots"|private (?:local )?preview|awaiting.owner.approval/i.test(text),
          'private page markup in frozen edition');
    }
    contents.set(file.path,bytes);
  }
  const meta=JSON.parse(contents.get(editionPage));
  requireFact(meta.publicationRevision===1 && !Object.hasOwn(meta,"previewOnly") && meta.edition===edition && meta.sourceManifestSha256===sourceManifest &&
    meta.reader.sha256===pdfDigest && meta.reader.path==='/'+reader && meta.reader.pages===2147,'wrong edition ties');
  const counts=meta.counts;
  requireFact(counts.accepted===1097 && counts.wholeHtml===1090 && counts.held===7 &&
    counts.historicalLedgerGaps===82,'unexpected sealed accounting');
  const followup=meta.reader33.followup;
  const expected={exact_present_mechanically_unmatched:617,duplicate_continuation_or_non_result:118,
    confirmed_omission:5,narrower_present:4,unknown:590};
  requireFact(followup.windows===1334 && followup.unresolved_windows_are_theorem_count===false &&
    followup.categories.length===5 && new Set(followup.categories.map(r=>r.key)).size===5 &&
    followup.categories.every(r=>expected[r.key]===r.count),'Reader 33 partition drift');
  const chapter8=meta.reader33.chapter8_recovery;
  const omissions=['8.5.4L','8.Q5.1','8.Q5.RA.2','8.Q5.RB.2','8.Q5.RC.2'];
  requireFact(chapter8.whole_placement_ready===0 && chapter8.rows.length===omissions.length &&
    new Set(chapter8.rows.map(r=>r.reader_id)).size===omissions.length &&
    chapter8.rows.every(r=>omissions.includes(r.reader_id) && !r.whole_placement_ready),
    'historical item incorrectly promoted');
  requireFact(Object.keys(meta.acceptedExportHolds).sort().join()===heldIds.join(),'unexpected export holds');
  for (const [id,hold] of Object.entries(meta.acceptedExportHolds)) {
    const text=contents.get('r/'+id+'/index.html').toString('utf8');
    requireFact(hold.htmlProofAvailable===false && text.includes('full HTML proof unavailable') &&
      !text.includes('Full selected proof · exact TeX'),'unbound full proof in '+id);
    const witness=hold.verifiedReaderDestination;
    if (witness) {
      requireFact(Number.isInteger(witness.page) && witness.page>0 && witness.page<=meta.reader.pages &&
        text.includes('/'+reader+'#nameddest='+encodeURIComponent(witness.destination)),
      'unbound PDF witness in '+id);
    } else requireFact(text.includes('No exact same-edition PDF destination has been verified.'),
      'missing PDF limit in '+id);
  }
  const searchBytes=await verifiedFile(path.join(release,'search.json'),manifest.search);
  requireFact(!privacy.test(searchBytes.toString('utf8')),'private control content in search');
  const rows=JSON.parse(searchBytes);
  const ids=new Set();
  for (const row of rows) {
    requireFact(idPattern.test(row.id) && row.project==='foundations' && row.link==='/r/'+row.id+'/' &&
      !ids.has(row.id) && names.has(row.link.slice(1)+'index.html'),'invalid Foundations search row');
    ids.add(row.id);
  }
  requireFact(ids.size===1205 && [...names].filter(n=>n.startsWith('r/')).length===ids.size,
    'missing or extra exact IDs');
  return augmentFoundationsLogic(root,{current, manifest, manifestBytes, meta, contents, rows});
}

export function foundationsOverview(release, url) {
  const source=release.contents.get(publicHome.slice(1)+'index.html').toString('utf8');
  const chapters=source.match(/<h2>Chapters and supplements<\/h2>(<ul class="entries">.*?<\/ul>)/s);
  requireFact(chapters,'edition chapter index missing');
  const n=release.meta.counts;
  const links=[
    [publicHome+'logic/','Foundations proof map'],
    [publicHome+'coverage/','Coverage and gaps'],
    ['/'+prefix+'reader-en.pdf','English PDF'],
    ['/'+prefix,'Fixed edition'],
  ];
  return '<p>'+n.wholeHtml.toLocaleString('en-US')+' complete HTML proofs. '+n.held+
    ' accepted records have PDF destinations.</p><nav aria-label="Foundations edition links">'+
    links.map(([href,title])=>'<p><a href="'+url(href)+'">'+title+'</a></p>').join('')+'</nav>'+
    chapters[1].replace(/href="(\/[^"]+)"/g,(_,route)=>'href="'+url(route)+'"');
}

function stablePath(name) {
  return '/'+name.slice(0,-'index.html'.length);
}

function fixedPath(route) {
  return '/'+prefix+(route.startsWith(publicHome) ? route.slice(publicHome.length) : route.slice(1));
}

function render(html, url, origin, fixed) {
  return html
    .replace(/(<link rel="canonical" href=")(\/[^"]*)"/g,(_,tag,route)=>
      tag+origin+(fixed ? fixed.get(route) : route)+'"')
    .replace('</head>',(fixed ? '<meta name="robots" content="noindex,follow">' : '')+'</head>')
    .replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g,(_,attr,href)=>{
      const [route,fragment]=href.split('#',2);
      return attr+'="'+url(fixed?.get(route) ?? route)+(fragment===undefined?'':'#'+fragment)+'"';
    });
}

export async function buildFoundationsRelease({release, output, url, origin, base}) {
  if (!release) return {rows:[],routes:[],indexableRoutes:[]};
  const {contents,current,rows}=release;
  const pages=path.join(output,'projects','foundations');
  const allowedExisting=new Set(['index.html','acknowledgements/index.html','versions/0/index.html']);
  requireFact((await inventory(pages)).every(n=>allowedExisting.has(n)),'unexpected Foundations output collision');
  const html = [...contents].filter(([name])=>name.endsWith('/index.html'));
  const fixed = new Map(html.map(([name])=>[stablePath(name),fixedPath(stablePath(name))]));

  async function emit(name, bytes) {
    const dest=path.join(output,name);
    requireFact(!(await optionalRegular(dest)), 'route or file collides with existing output '+name);
    await mkdir(path.dirname(dest),{recursive:true});
    await writeFile(dest,bytes);
  }
  for (const [name,bytes] of contents) {
    if (!name.endsWith('/index.html')) {
      await emit(name,bytes);
      if (!base) await emit('math-research-atlas/'+name,bytes);
      continue;
    }
    const route=stablePath(name);
    const text=bytes.toString('utf8');
    requireFact(text.includes('rel="canonical" href="'+route+'"'),'wrong canonical in frozen input '+name);
    await emit(fixed.get(route).slice(1)+'index.html',render(text,url,origin,fixed));
    if(current && route!==publicHome) await emit(name,render(text,url,origin,null));
  }
  const versionRoute=publicHome+'versions/1/';
  const destination='/'+prefix;
  const redirect='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="robots" content="noindex,follow"><link rel="canonical" href="'+origin+destination+'">'+
    '<title>Foundations version 1</title></head><body><main><h1>Foundations version 1</h1>'+
    '<p><a href="'+url(destination)+'">Open the fixed edition</a></p></main>'+
    '<script>location.replace('+JSON.stringify(url(destination))+'+location.search+location.hash);</script></body></html>';
  await emit(versionRoute.slice(1)+'index.html',redirect);
  const active = current ? [...fixed.keys()] : [];
  return {
    rows:current ? rows.map(row=>({...row,link:url(row.link)})) : [],
    routes:[...fixed.values(),versionRoute,...active],
    indexableRoutes:active,
  };
}
