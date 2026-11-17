#!/usr/bin/env node
// Manual, draft-only paper rebuild. Normal static-site CI does not execute TeX.
// The Pandoc/KaTeX and shared-counter adapters below are preserved from the
// project's established paper builder; no old website checkout is needed.
import { readFile, writeFile, mkdir, realpath, lstat, mkdtemp, open, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import katex from 'katex';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = value => createHash('sha256').update(value).digest('hex');
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const env = { ...process.env, shell_escape: 'f' };
let workDirectory, inputRoot;
const help = [
  'Rebuild one paper in an explicitly new, unfrozen draft edition.',
  '',
  'Usage:',
  '  node scripts/render-paper.mjs --edition vX.Y.Z --paper SLUG [--source PATH]',
  '',
  'Inputs:',
  '  content/strong-green/releases/vX.Y.Z/papers/SLUG.json',
  '  PATH defaults to content/strong-green/releases/vX.Y.Z/latex/SLUG.tex',
  '  Metadata must already name vX.Y.Z. Source must be inside this checkout.',
  '',
  'Writes only the draft paper JSON and its PDF/expanded TeX assets.',
  'Rejects frozen/current editions. Does not change the current pointer,',
  'bundle, publication status, release manifest, git history or deployment.',
  'Requires Node, npm dependencies, latexmk, XeLaTeX, Pandoc and Poppler.',
  'See docs/PAPERS.md. Run trusted TeX only; this is not a security sandbox.'
].join('\n');

function argumentsOf(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return null;
  const values = {};
  for (let i = 0; i < args.length; i++) {
    const match = /^(--edition|--paper|--source)(?:=(.*))?$/.exec(args[i]);
    if (!match) throw new Error('Unknown argument: ' + args[i] + '. Use --help.');
    const key = match[1].slice(2);
    if (Object.hasOwn(values, key)) throw new Error('Repeated --' + key);
    const value = match[2] === undefined ? args[++i] : match[2];
    if (!value || value.startsWith('--')) throw new Error('Missing value for --' + key);
    values[key] = value;
  }
  if (!/^v\d+\.\d+\.\d+$/.test(values.edition || '')) throw new Error('An explicit --edition vX.Y.Z is required.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.paper || '')) throw new Error('A lowercase --paper slug is required.');
  return values;
}
function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}
async function noSymlinks(candidate) {
  if (!inside(root, candidate)) throw new Error('Path is outside the checkout: ' + candidate);
  let current = root;
  for (const segment of path.relative(root, candidate).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Refusing a symlink path: ' + current); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
async function exists(file) {
  try { await lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
async function assertDraft(revision, release, assets) {
  await noSymlinks(release);
  await noSymlinks(assets);
  if (await exists(path.join(release, 'public-files.json')) || await exists(path.join(assets, 'checksums.json'))) {
    throw new Error('Refusing to edit frozen edition ' + revision + '; create a new draft revision.');
  }
  const pointer = path.join(root, 'content/strong-green/current.json');
  if (await exists(pointer)) {
    const current = JSON.parse(await readFile(pointer, 'utf8'));
    if (current.revision === revision) throw new Error('Refusing to rebuild the current edition ' + revision + '; create a new draft revision.');
  }
  const bundleFile = path.join(release, 'bundle.json');
  if (await exists(bundleFile)) {
    const bundle = JSON.parse(await readFile(bundleFile, 'utf8'));
    if (bundle.edition?.revision !== revision) throw new Error('Draft bundle revision does not match --edition.');
    if (!Array.isArray(bundle.project?.authors) || bundle.project.authors.length) throw new Error('Public project author policy requires an empty authors array.');
  }
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: workDirectory, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(command + ' failed: ' + (result.error?.message || result.stderr || '') + '\n' + (result.stdout || '').slice(-12000));
  return result.stdout;
}
function dependencies() {
  for (const command of ['latexmk', 'xelatex', 'xetex', 'kpsewhich', 'pandoc', 'pdfinfo', 'pdftotext']) {
    const result = spawnSync(command, ['latexmk', 'pdfinfo', 'pdftotext'].includes(command) ? ['-v'] : ['--version'], { encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error('Missing or unusable ' + command + '. See docs/PAPERS.md.');
  }
}
async function prepareTex(directory) {
  const cache = path.join(directory, 'tex-cache');
  await mkdir(cache, { recursive: true });
  if (!run('kpsewhich', ['--var-value=TEXMF']).trim()) throw new Error('TeX configuration not found.');
  const lookup = spawnSync('kpsewhich', ['fontspec.sty'], { env, encoding: 'utf8' });
  if (lookup.status !== 0 && existsSync('/usr/share/texlive/texmf-dist/tex/latex/fontspec/fontspec.sty')) {
    env.TEXMF = '{/usr/share/texlive/texmf-dist,/usr/share/texmf,/etc/texmf}';
  }
  const format = spawnSync('kpsewhich', ['xelatex.fmt'], { env, encoding: 'utf8' });
  if (format.status !== 0) {
    run('xetex', ['-ini', '-etex', '-jobname=xelatex', '-interaction=nonstopmode', '-halt-on-error', '-output-directory=' + cache, 'xelatex.ini'], { cwd: cache });
    env.TEXFORMATS = cache + ':' + (env.TEXFORMATS || '');
  }
}
async function expandInputs(file, inputBase, seen = new Set(), sources = []) {
  const absolute = await realpath(file);
  if (!inside(inputRoot, absolute) || !absolute.endsWith('.tex')) throw new Error('TeX input escapes the source directory: ' + file);
  if (seen.has(absolute)) throw new Error('Cyclic TeX input: ' + file);
  const next = new Set(seen); next.add(absolute);
  let text = await readFile(absolute, 'utf8');
  sources.push({ file: path.relative(root, absolute).split(path.sep).join('/'), sha256: sha(text) });
  const matches = [...text.matchAll(/\\(?:input|include)\{([^{}]+)\}/g)];
  for (const match of matches.reverse()) {
    let target = path.resolve(inputBase, match[1]);
    if (!path.extname(target)) target += '.tex';
    const expanded = await expandInputs(target, inputBase, next, sources);
    text = text.slice(0, match.index) + '\n% Source: ' + path.relative(root, target).split(path.sep).join('/') + '\n' + expanded + '\n' + text.slice(match.index + match[0].length);
  }
  return text;
}
function assertUnsigned(paper, source) {
  if ((paper.author != null && paper.author !== '') || (paper.authors != null && (!Array.isArray(paper.authors) || paper.authors.length))) throw new Error('Paper metadata must be unsigned.');
  for (const match of source.matchAll(/\\author(?:\[[^\]]*\])?\{([^}]*)\}/g)) if (match[1].trim()) throw new Error('Remove the nonempty TeX author command before rebuilding.');
  for (const match of source.matchAll(/pdfauthor\s*=\s*\{([^}]*)\}/g)) if (match[1].trim()) throw new Error('Remove the nonempty PDF author metadata before rebuilding.');
}

// A shared LaTeX counter supplies a number, not the kind of a statement.
// Preserve the environment type that Pandoc read from the manuscript.
function bindStatementTypes(ast, labels, theoremNames) {
  const kinds = new Set(theoremNames);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value.t === 'Div') {
      const [attr, blocks] = value.c;
      const kind = attr[1].find(name => kinds.has(name));
      const first = blocks[0];
      if (kind && first?.t === 'Para' && first.c[0]?.t === 'Strong') {
        const keys = [attr[0], ...first.c.filter(node => node.t === 'RawInline')
          .map(node => node.c[1].match(/^\\label\{([^}]+)\}$/)?.[1])].filter(Boolean);
        for (const key of keys) {
          const label = labels.get(key);
          if (label) labels.set(key, { ...label, kind });
        }
      }
    }
    for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
  }
  visit(ast);
  return labels;
}

function groups(text) {
  const out=[]; let depth=0,start=-1;
  for(let i=0;i<text.length;i++) {
    if(text[i]==='\\') {i++;continue;}
    if(text[i]==='{') {if(depth===0)start=i+1;depth++;}
    else if(text[i]==='}') {depth--;if(depth===0)out.push(text.slice(start,i));}
  }
  return out;
}
function readLabels(aux) {
  const labels=new Map(),cites=new Map();
  for (const line of aux.split('\n')) {
    if(line.startsWith('\\newlabel{')) {
      const [key,fields]=groups(line),values=groups(fields||'');
      if(key.endsWith('@cref')) { const keyBase=key.slice(0,-5); const item=labels.get(keyBase)||{}; item.kind=(values[0]||'').match(/^\[([^\]]+)\]/)?.[1];labels.set(keyBase,item); }
      else labels.set(key,{...(labels.get(key)||{}),number:values[0],page:values[1],text:values[2],anchor:values[3]});
    } else if(line.startsWith('\\bibcite{')) { const [key,num]=groups(line);cites.set(key,num); }
  }
  return {labels,cites};
}
const capital=text=>text ? text[0].toUpperCase()+text.slice(1) : '';
function inlineText(nodes) {return (nodes||[]).map(x=>x.t==='Str'?x.c:x.t==='Space'?' ':x.t==='SoftBreak'?' ':x.t==='Math'?x.c[1]:Array.isArray(x.c)?inlineText(x.c):'').join('');}

function findNodes(value,type,out=[]) {
  if(value&&typeof value==='object') {
    if(value.t===type)out.push(value);
    for(const child of Object.values(value))if(child&&typeof child==='object')findNodes(child,type,out);
  }
  return out;
}
function rewriteBibliography(text,cites) {
  return text.replace(/\\begin\{thebibliography\}\{[^}]+\}([\s\S]*?)\\end\{thebibliography\}/g,(_,body)=>{
    body=body.replace(/\\addcontentsline\{toc\}\{section\}\{References\}/g,'');
    return '\\section*{References}\n'+body.replace(/\\bibitem(?:\[([^\]]+)\])?\{([^}]+)\}/g,(_m,_label,key)=>{
      if(!cites.has(key))throw new Error('Uncompiled bibliography item '+key);
      return '\n\n\\label{bib-'+key+'}\\textbf{['+cites.get(key)+']} ';
    });
  });
}
function transformAst(ast,labels,cites) {
  const unknownRaw=[],mathErrors=[],toc=[];
  let mathCount=0;
  function reference(command,keyString) {
    return keyString.split(',').map(key=>{
      const item=labels.get(key.trim());
      if(!item?.number)throw new Error('Unresolved cross-reference '+key);
      const typed=/^(Cref|cref|autoref)$/.test(command);
      let text=typed?(capital(item.kind||'result')+' '+item.number):item.number;
      if(command==='eqref')text='('+item.number+')';
      return '<a class="paper-crossref" href="#'+escape(key.trim())+'">'+escape(text)+'</a>';
    }).join(' and ');
  }
  const numbering=[0,0,0,0,0,0];
  function visit(value) {
    if(Array.isArray(value))return value.map(visit);
    if(!value||typeof value!=='object')return value;
    const node=structuredClone(value);
    if(node.t==='Header') {
      const [level,attr,inlines]=node.c;
      const unnumbered=attr[1].includes('unnumbered')||inlineText(inlines)==='References';
      let num='';
      if(!unnumbered) {numbering[level-1]++;for(let i=level;i<numbering.length;i++)numbering[i]=0;num=labels.get(attr[0])?.number||numbering.slice(0,level).join('.');}
      if(level<=2)toc.push({id:attr[0],level,number:num,title:inlineText(inlines)});
      node.c=[Math.min(level+1,6),attr,[...(num?[{t:'Str',c:num+'.'},{t:'Space'}]:[]),...visit(inlines)]];
      return node;
    }
    if(node.t==='Div') {
      const [attr,blocks]=node.c;
      const theoremType=attr[1].find(x=>!['proof'].includes(x));
      if(theoremType && blocks[0]?.t==='Para') {
        const first=blocks[0].c;
        const rawLabel=findNodes(first,'RawInline').find(x=>/^\\label\{/.test(x.c[1]));
        const key=attr[0]||rawLabel?.c[1].match(/^\\label\{([^}]+)\}/)?.[1];
        const record=key?labels.get(key):undefined;
        if(record?.number && first[0]?.t==='Strong') {
          first[0].c=[{t:'Str',c:capital(theoremType)+' '+record.number}];
        }
      }
    }
    if(node.t==='Cite') {
      const citations=node.c[0].map(citation=>{
        if(!cites.has(citation.citationId))throw new Error('Unresolved citation '+citation.citationId);
        const prefix=inlineText(citation.citationPrefix),suffix=inlineText(citation.citationSuffix);
        return (prefix?escape(prefix)+' ':'')+'<a class="paper-citation" href="#bib-'+escape(citation.citationId)+'">'+escape(cites.get(citation.citationId))+'</a>'+(suffix?', '+escape(suffix):'');
      });
      return {t:'RawInline',c:['html','['+citations.join('; ')+']']};
    }
    if(node.t==='Math') {
      mathCount++;
      const display=node.c[0].t==='DisplayMath',anchors=[];
      let tex=node.c[1].replace(/\\label(?:\[[^\]]+\])?\{([^}]+)\}/g,(_,key)=>{anchors.push(key);return '';});
      tex=tex.replace(/\\(?:eqref|ref|Cref|cref)\{([^}]+)\}/g,(m,key)=>{
        const record=labels.get(key);if(!record?.number)throw new Error('Unknown equation reference '+key);
        return '\\text{'+(m.startsWith('\\eqref')?'('+record.number+')':record.number)+'}';
      });
      // Preserve the grouping of a macro argument after Pandoc expands, for
      // example, \widehat\Z into \widehat\mathbb Z.
      tex=tex.replace(/\\(widehat|hat|overline|bar|widetilde|tilde)\s*\\(mathbb|mathbf|mathcal|mathrm)\s*(\{[^{}]*\}|[A-Za-z])/g,(_m,accent,font,arg)=>'\\'+accent+'{\\'+font+(arg.startsWith('{')?arg:'{'+arg+'}')+'}');
      try {
        const html=katex.renderToString(tex,{displayMode:display,throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml',macros:{'\\coloneqq':':='}});
        const ids=anchors.map(key=>'<span id="'+escape(key)+'" class="equation-anchor"></span>').join('');
        // Explicit TeX tags are already rendered by KaTeX. Add an external
        // number only for labels whose display has no native tag; otherwise
        // the same equation number is printed twice on top of itself.
        const numbers=/\\tag\*?\s*\{/.test(tex)?[]:[...new Set(anchors.map(key=>labels.get(key)?.number).filter(Boolean))];
        const tag=display&&numbers.length?'<span class="equation-number">'+numbers.map(n=>'('+escape(n)+')').join('<br>')+'</span>':'';
        return {t:'RawInline',c:['html',display?'<span class="paper-equation">'+ids+html+tag+'</span>':ids+html]};
      } catch(error) {mathErrors.push({tex,message:String(error)});return node;}
    }
    if((node.t==='RawInline'||node.t==='RawBlock') && node.c[0]==='latex') {
      const text=node.c[1];
      if(/^\\newline\s*$/.test(text))return {t:node.t,c:['html','<br>']};
      const label=text.match(/^\\label\{([^}]+)\}$/);
      if(label)return {t:node.t,c:['html','<span class="paper-anchor" id="'+escape(label[1])+'"></span>']};
      const ref=text.match(/^\\(Cref|cref|ref|eqref|autoref)\{([^}]+)\}$/);
      if(ref)return {t:node.t,c:['html',reference(ref[1],ref[2])]};
      if(/^\\(?:maketitle|tableofcontents|clearpage|newpage|pagebreak|medskip|smallskip|bigskip|noindent|centering|raggedright|small|footnotesize|normalsize|allowbreak|qedhere)(?:\[\d+\])?$/.test(text)||/^\\(?:hypersetup|addcontentsline|setlength|vspace|hspace|color|phantomsection)/.test(text))return {t:node.t,c:['html','']};
      unknownRaw.push(text);return node;
    }
    for(const key of Object.keys(node))if(node[key]&&typeof node[key]==='object')node[key]=visit(node[key]);
    return node;
  }
  const transformed=visit(ast);
  if(unknownRaw.length||mathErrors.length)throw new Error(JSON.stringify({unknownRaw:[...new Set(unknownRaw)],mathErrors},null,2));
  return {ast:transformed,toc,mathCount};
}


async function buildPaper(options) {
  const revision = options.edition, slug = options.paper;
  const release = path.join(root, 'content/strong-green/releases', revision);
  const assets = path.join(root, 'public/projects/strong-green/editions', revision);
  await assertDraft(revision, release, assets);
  if (!(await exists(release))) throw new Error('Create the new draft release and paper metadata before rendering.');
  const metadataFile = path.join(release, 'papers', slug + '.json');
  await noSymlinks(metadataFile);
  const originalMetadata = await readFile(metadataFile, 'utf8');
  const paper = JSON.parse(originalMetadata);
  if (paper.slug !== slug || paper.revision !== revision) throw new Error('Metadata slug/revision must match the explicitly requested new draft.');
  for (const key of ['title', 'summary', 'status', 'evidence', 'date']) if (typeof paper[key] !== 'string' || !paper[key].trim()) throw new Error('Existing paper metadata needs ' + key + '.');
  if (!Array.isArray(paper.entries)) throw new Error('Existing paper metadata needs its entry IDs.');
  const sourceFile = path.resolve(root, options.source || path.relative(root, path.join(release, 'latex', slug + '.tex')));
  await noSymlinks(sourceFile);
  const sourceReal = await realpath(sourceFile);
  if (!inside(release, sourceReal)) throw new Error('Draft TeX must be inside the explicitly requested release directory.');
  inputRoot = path.dirname(sourceReal);
  const sources = [];
  const expanded = await expandInputs(sourceReal, inputRoot, new Set(), sources);
  assertUnsigned(paper, expanded);
  if (/\\(?:input|include)\s*(?!\{)/.test(expanded)) throw new Error('Only literal braced TeX inputs are supported.');
  if (/\\(?:includegraphics|bibliography|addbibresource)\b/.test(expanded)) throw new Error('Use a self-contained TeX manuscript with an inline thebibliography environment.');
  dependencies();
  let lock, directory;
  const lockPath = path.join(release, '.render-paper.lock');
  try {
    lock = await open(lockPath, 'wx');
    directory = await mkdtemp(path.join(os.tmpdir(), 'atlas-paper-'));
    workDirectory = directory;
    await prepareTex(directory);
    await writeFile(path.join(directory, slug + '.tex'), expanded);
    run('latexmk', ['-norc', '-xelatex', '-interaction=nonstopmode', '-halt-on-error', '-file-line-error', '-latexoption=-no-shell-escape', '-outdir=' + directory, slug + '.tex']);
    const finalLog = await readFile(path.join(directory, slug + '.log'), 'utf8');
    const badLogLines = finalLog.split('\n').filter(line => /undefined references|undefined on input line|Cref reference format.*undefined|Missing character:/.test(line));
    if (badLogLines.length) throw new Error('Unresolved PDF content: ' + badLogLines.join('\n'));
    const { labels, cites } = readLabels(await readFile(path.join(directory, slug + '.aux'), 'utf8'));
    const htmlSource = rewriteBibliography(expanded, cites).replace(/\\label\[[^\]]+\]\{([^}]+)\}/g, '\\label{$1}');
    const originalAst = JSON.parse(run('pandoc', ['--from=latex+raw_tex', '--to=json'], { input: htmlSource }));
    const theoremNames = [...expanded.matchAll(/\\newtheorem\*?\{([^}]+)\}/g)].map(match => match[1]);
    bindStatementTypes(originalAst, labels, theoremNames);
    const { ast, toc, mathCount } = transformAst(originalAst, labels, cites);
    const expectedProofs = (expanded.match(/\\begin\{proof\}/g) || []).length;
    const actualProofs = findNodes(ast, 'Div').filter(node => node.c[0][1].includes('proof')).length;
    if (expectedProofs !== actualProofs) throw new Error('Proof preservation failed: ' + expectedProofs + ' != ' + actualProofs);
    const counts = [];
    for (const name of new Set(theoremNames)) {
      const expected = (expanded.match(new RegExp('\\\\begin\\{' + name + '\\}', 'g')) || []).length;
      const actual = findNodes(ast, 'Div').filter(node => node.c[0][1].includes(name)).length;
      if (expected !== actual) throw new Error('Statement preservation failed for ' + name + ': ' + expected + ' != ' + actual);
      if (expected) counts.push({ kind: name, count: expected });
    }
    const html = run('pandoc', ['--from=json', '--to=html5', '--wrap=none'], { input: JSON.stringify({ ...ast, meta: {} }) });
    const abstractHtml = run('pandoc', ['--from=json', '--to=html5', '--wrap=none'], { input: JSON.stringify({ 'pandoc-api-version': ast['pandoc-api-version'], meta: {}, blocks: ast.meta.abstract?.c || [] }) });
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    const broken = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]).filter(id => !ids.has(id));
    if (broken.length) throw new Error('Broken paper anchors: ' + [...new Set(broken)].join(', '));
    const pdfFile = path.join(directory, slug + '.pdf');
    const pdf = await readFile(pdfFile);
    const info = run('pdfinfo', [pdfFile]);
    const author = info.match(/^Author:[ \t]*(.*)$/m)?.[1]?.trim();
    if (author) throw new Error('Compiled PDF contains author metadata.');
    const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
    if (!pages) throw new Error('Cannot read the compiled PDF page count.');
    run('pdftotext', [pdfFile, '-']);
    const siteOrigin = (process.env.SITE_ORIGIN || 'https://dongkaicheng.github.io/math-research-atlas').replace(/\/$/, '');
    if (!/^https:\/\//.test(siteOrigin)) throw new Error('SITE_ORIGIN must be an HTTPS publication origin.');
    const result = {
      ...paper, revision, source: path.relative(root, sourceReal).split(path.sep).join('/'),
      html, abstractHtml, toc, pages, pdf: '/papers/' + slug + '.pdf', tex: '/papers/' + slug + '.tex',
      publicationUrl: siteOrigin + '/projects/strong-green/editions/' + revision + '/papers/' + slug + '/',
      pdfSha256: sha(pdf), sourceSha256: sha(expanded), htmlSha256: sha(html),
      sources: [...new Map(sources.map(source => [source.file, source])).values()],
      proofCount: actualProofs, statements: counts, formulaCount: mathCount
    };
    await assertDraft(revision, release, assets);
    if (await readFile(metadataFile, 'utf8') !== originalMetadata) throw new Error('Paper metadata changed during compilation; retry after reviewing the concurrent edit.');
    for (const source of sources) {
      const currentSource = await realpath(path.join(root, source.file));
      if (!inside(inputRoot, currentSource) || sha(await readFile(currentSource)) !== source.sha256) throw new Error('TeX source changed during compilation; retry after reviewing the concurrent edit.');
    }
    const paperAssets = path.join(assets, 'papers');
    await noSymlinks(paperAssets);
    await mkdir(paperAssets, { recursive: true });
    // Metadata is replaced last, after its corresponding byte artifacts.
    for (const [target, value] of [
      [path.join(paperAssets, slug + '.pdf'), pdf],
      [path.join(paperAssets, slug + '.tex'), expanded],
      [metadataFile, JSON.stringify(result)]
    ]) {
      await noSymlinks(target);
      const temporary = target + '.draft-' + randomUUID();
      await writeFile(temporary, value, { flag: 'wx' });
      await rename(temporary, target);
    }
    console.log(JSON.stringify({
      revision, slug, pages, proofCount: actualProofs, formulaCount: mathCount,
      pdfSha256: result.pdfSha256, sourceSha256: result.sourceSha256, htmlSha256: result.htmlSha256,
      publicationUrl: result.publicationUrl,
      files: [path.relative(root, metadataFile), path.relative(root, path.join(paperAssets, slug + '.pdf')), path.relative(root, path.join(paperAssets, slug + '.tex'))],
      next: 'Review the PDF and HTML; reconcile this paper metadata into the draft bundle. No publication or current-pointer change was made.'
    }, null, 2));
  } finally {
    if (lock) { await lock.close(); await rm(lockPath, { force: true }); }
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
try {
  const options = argumentsOf(process.argv.slice(2));
  if (options === null) console.log(help);
  else await buildPaper(options);
} catch (error) {
  console.error('render-paper: ' + error.message);
  process.exitCode = 1;
}

