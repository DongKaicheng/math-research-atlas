/** Read-only publication checks. These check files and displayed status, not
 * the mathematical correctness of any proof. No reader input is executed. */
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const here=path.dirname(fileURLToPath(import.meta.url));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const textExtensions=new Set(['.html','.json','.jsonl','.tex','.txt','.md','.csv','.xml','.svg','.js','.mjs','.css','.map','.bib','.yml','.yaml']);
const identity=/kaicheng|kai[\s\\~{},.\-]*cheng[\s\\~{},.\-]*dong|dong[\s\\~{},.\-]*kai[\s\\~{},.\-]*cheng|\bk\.[\s\\~{},.\-]*dong\b|董\s*[开開]\s*[承成]/i;

export function safeRelative(value){
  return typeof value==='string'&&value.length>0&&!value.startsWith('/')&&
    !value.includes('\\')&&!value.includes('\0')&&
    value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');
}

export function decodeText(value){
  let text=String(value).replace(/\\\//g,'/').replace(/&#x([0-9a-f]+);/gi,(_s,x)=>String.fromCodePoint(parseInt(x,16)))
    .replace(/&#([0-9]+);/g,(_s,x)=>String.fromCodePoint(Number(x)))
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[s]);
  // Decode encoded URL segments even when the surrounding paper contains
  // ordinary TeX percent signs, which make whole-document decoding invalid.
  text=text.replace(/(?:%[0-9a-f]{2})+/gi,segment=>{
    try{return decodeURIComponent(segment);}catch{return segment;}
  });
  return text.normalize('NFKC');
}

export function containsPersonalIdentity(value){
  // The owner selected these public hosting/repository addresses. They are
  // technical URLs, not an author credit. No other occurrences are exempt.
  const text=decodeText(value).replace(/https:\/\/(?:dongkaicheng\.github\.io\/math-research-atlas|github\.com\/DongKaicheng\/math-research-atlas)(?=[/?#\s"'<>)]|$)/gi,'https://atlas.example');
  if(identity.test(text))return true;
  return /kaicheng|dongkaicheng|董[开開][承成]/i.test(text.replace(/[\s\\~{},.\-]+/g,''));
}

export function mathAnnotations(html){
  return [...html.matchAll(/<annotation\b[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/g)].map(m=>decodeText(m[1]));
}

async function walk(root,relative=''){
  const result=[];
  for(const item of (await readdir(path.join(root,relative),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const next=path.posix.join(relative,item.name);
    assert.ok(!item.isSymbolicLink(),'No symlinks in a public edition: '+next);
    if(item.isDirectory())result.push(...await walk(root,next));
    else{assert.ok(item.isFile(),'Unexpected filesystem object: '+next);result.push(next);}
  }
  return result;
}

export function zipMembers(bytes){
  // Inspect ZIP central-directory entries in memory; never extract or execute.
  let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}}
  assert.ok(end>=0,'Missing ZIP end record');
  assert.equal(bytes.readUInt16LE(end+4),0,'Multidisk ZIP is unsupported');
  assert.equal(bytes.readUInt16LE(end+6),0,'Multidisk ZIP is unsupported');
  const count=bytes.readUInt16LE(end+10),offset=bytes.readUInt32LE(end+16);
  assert.notEqual(count,0xffff,'ZIP64 is not a publication export');
  let cursor=offset,total=0;const names=new Set(),members=[];
  for(let i=0;i<count;i++){
    assert.equal(bytes.readUInt32LE(cursor),0x02014b50,'Invalid ZIP central directory');
    const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10);
    const compressed=bytes.readUInt32LE(cursor+20),length=bytes.readUInt32LE(cursor+24);
    const nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32);
    const local=bytes.readUInt32LE(cursor+42),name=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
    cursor+=46+nameLength+extra+comment;
    assert.equal(flags&1,0,'Encrypted ZIP members are not allowed');
    assert.ok(!names.has(name),'Duplicate ZIP member');names.add(name);
    if(name.endsWith('/')){assert.ok(safeRelative(name.slice(0,-1)),'Unsafe ZIP directory');continue;}
    assert.ok(safeRelative(name),'Unsafe ZIP member');
    total+=length;assert.ok(total<=512*1024*1024,'ZIP uncompressed size exceeds limit');
    assert.equal(bytes.readUInt32LE(local),0x04034b50,'Invalid ZIP local header');
    const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
    assert.ok(start+compressed<=bytes.length,'Truncated ZIP member');
    const payload=bytes.subarray(start,start+compressed);
    assert.ok(method===0||method===8,'Unsupported ZIP compression');
    const data=method===0?payload:inflateRawSync(payload,{maxOutputLength:length||1});
    assert.equal(data.length,length,'ZIP member length mismatch');
    members.push({name,data});
  }
  return members;
}

function assertPrivacy(text,label){
  assert.equal(containsPersonalIdentity(text),false,'Personal identity in '+label);
  assert.doesNotMatch(text,/(?:file:\/\/\/|\/workspace\/|\/home\/agent\/)/,'Private filesystem path in '+label);
}

function localFile(url,manifest,label){
  if(typeof url!=='string')return null;
  const {origin,basePath,fixedPath}=manifest.publication;
  const target=new URL(decodeText(url),origin+fixedPath+'/');
  if(target.origin!==new URL(origin).origin)return null;
  const prefix=basePath+fixedPath+'/';
  if(!target.pathname.startsWith(prefix))return null;
  const relative=decodeURIComponent(target.pathname.slice(prefix.length));
  assert.ok(safeRelative(relative),'Unsafe public source path in '+label);
  return relative;
}

async function verifyBindings(value,manifest,root,label,counters){
  if(Array.isArray(value)){for(const item of value)await verifyBindings(item,manifest,root,label,counters);return;}
  if(value===null||typeof value!=='object')return;
  const url=value.href||value.url;
  if(typeof value.sha256==='string'&&typeof url==='string'){
    const file=localFile(url,manifest,label);
    if(file){
      assert.match(value.sha256,/^[a-f0-9]{64}$/,'Invalid source digest');
      assert.equal(sha256(await readFile(path.join(root,file))),value.sha256,'Public source digest mismatch: '+label+' → '+file);
      counters.sourceBindings++;
    }
  }
  for(const item of Object.values(value))await verifyBindings(item,manifest,root,label,counters);
}

function inspectPdf(bytes,label,counters){
  assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-','Invalid PDF magic: '+label);
  const text=spawnSync('pdftotext',['-layout','-','-'],{input:bytes,maxBuffer:64*1024*1024,timeout:60000});
  if(text.error?.code==='ENOENT'){counters.pdfTextUnchecked++;return;}
  assert.equal(text.status,0,'PDF text extraction failed: '+label);
  assertPrivacy(text.stdout.toString('utf8'),label+' text');
  for(const args of [['-'],['-meta','-']]){
    const info=spawnSync('pdfinfo',args,{input:bytes,maxBuffer:8*1024*1024,timeout:60000});
    assert.equal(info.status,0,'PDF metadata extraction failed: '+label);
    assertPrivacy(info.stdout.toString('utf8'),label+' metadata');
  }
  counters.pdfTextInspected++;
}

export async function verifyBedfordTaylorRelease(root=path.resolve(here,'..'),{inspectPdfs=true,verifyBuild=true}={}){
  const contentRoot=path.join(root,'content','bedford-taylor');
  const current=JSON.parse(await readFile(path.join(contentRoot,'current.json'),'utf8'));
  assert.equal(current.project,'bedford-taylor');
  assert.match(current.revision,/^v\d+\.\d+\.\d+$/);
  const revisions=(await readdir(path.join(contentRoot,'releases'))).filter(v=>/^v\d+\.\d+\.\d+$/.test(v));
  assert.ok(revisions.includes(current.revision),'Current BT edition is missing');
  const counters={buildChecked:verifyBuild,editions:0,files:0,sourceBindings:0,pdfs:0,zips:0,zipMembers:0,pdfTextInspected:0,pdfTextUnchecked:0};
  for(const revision of revisions){
    const recordBytes=await readFile(path.join(contentRoot,'releases',revision,'manifest.json'));
    const manifest=JSON.parse(recordBytes.toString('utf8'));
    assertPrivacy(recordBytes.toString('utf8'),'release manifest');
    assert.equal(manifest.schemaVersion,1);
    assert.equal(manifest.project,'bedford-taylor');assert.equal(manifest.revision,revision);
    assert.equal(manifest.publication.authorPolicy,'omit');assert.equal(manifest.publication.audience,'public');
    assert.equal(manifest.publication.projectPath,'/projects/bedford-taylor');
    assert.equal(manifest.publication.fixedPath,'/projects/bedford-taylor/editions/'+revision);
    assert.ok(Number.isFinite(Date.parse(manifest.publishedAt)),'Invalid edition date');
    assert.match(manifest.original.sourceCommit,/^[a-f0-9]{40}$/);
    // The first edition predates the receipt locator field but has a separately
    // frozen baseline receipt. Never rewrite its manifest to add that field.
    const receiptName=manifest.original.sourceReceipt||(revision==='v1.0.0'?'2026-11-18.json':null);
    assert.ok(safeRelative(receiptName)&&!receiptName.includes('/'),'Missing or unsafe source receipt');
    const receiptBytes=await readFile(path.join(contentRoot,'source-receipts',receiptName));
    if(manifest.original.sourceReceiptSha256)assert.equal(sha256(receiptBytes),manifest.original.sourceReceiptSha256,'Source receipt digest');
    const receipt=JSON.parse(receiptBytes.toString('utf8'));
    assert.equal(receipt.project,'bedford-taylor');assert.equal(receipt.authorPolicy,'omit');
    assert.equal(receipt.sourceCommit,manifest.original.sourceCommit);
    assert.equal(receipt.readingEdition,manifest.original.readingEdition);
    const approved=new Map(receipt.allowedFiles.map(f=>[f.path,f]));
    assert.equal(approved.size,receipt.allowedFiles.length,'Duplicate source receipt path');
    for(const item of approved.values()){
      assert.ok(safeRelative(item.path));assert.match(item.sha256,/^[a-f0-9]{64}$/);
    }
    const sourcePaths=new Set();
    const prefix=manifest.publication.fixedPath.slice(1),frozen=path.join(root,'public',prefix),built=path.join(root,'dist',prefix);
    const names=new Set();
    for(const file of manifest.files){
      assert.ok(safeRelative(file.path),'Unsafe manifest path');
      assert.notEqual(file.path,'manifest.json','Manifest must not hash itself');
      assert.ok(!names.has(file.path),'Duplicate frozen file');names.add(file.path);
      assert.match(file.sha256,/^[a-f0-9]{64}$/);assert.ok(Number.isSafeInteger(file.bytes)&&file.bytes>=0);
      if(file.sourceSha256!==null){
        const original=approved.get(file.path);
        assert.ok(original,'Unapproved imported source: '+file.path);
        assert.equal(file.sourceSha256,original.sha256,'Imported source receipt mismatch: '+file.path);
        assert.equal(file.sourceBytes,original.bytes,'Imported source size receipt mismatch: '+file.path);
        sourcePaths.add(file.path);
      }
      for(const tree of verifyBuild?[frozen,built]:[frozen]){
        const bytes=await readFile(path.join(tree,file.path));
        assert.equal(bytes.length,file.bytes,'Public file size: '+file.path);
        assert.equal(sha256(bytes),file.sha256,'Frozen bytes changed: '+file.path);
      }
      const bytes=await readFile(path.join(frozen,file.path)),extension=path.extname(file.path).toLowerCase();
      assertPrivacy(file.path,'public path');
      if(file.path.startsWith('sources/files/'))assert.equal(file.sha256,file.sourceSha256,'Audited mathematical source bytes changed during migration: '+file.path);
      if(textExtensions.has(extension)){
        const text=bytes.toString('utf8');assertPrivacy(text,file.path);
        if(file.path!=='manifest.json')assert.doesNotMatch(text,/https?:\/\/[^\s"'<]*spectacularsheep\.chatgpt\.site/,'Private-site dependency: '+file.path);
        if(extension==='.html'){
          assert.doesNotMatch(text,/<meta\b(?=[^>]*\bname=["']author["'])(?=[^>]*\bcontent=["'][^"']+)[^>]*>/i,'Unsigned HTML has an author');
          assert.doesNotMatch(text,/class="[^"]*katex-error/,'Math rendering error: '+file.path);
        }
        if(extension==='.json')await verifyBindings(JSON.parse(text),manifest,frozen,file.path,counters);
      }
      if(extension==='.pdf'){
        assert.equal(file.sha256,file.sourceSha256,'An imported audited PDF was changed: '+file.path);
        if(inspectPdfs)inspectPdf(bytes,file.path,counters);
        counters.pdfs++;
      }
      if(extension==='.zip'){
        const members=zipMembers(bytes);assert.ok(members.length>0);
        const memberRecords=members.map(({name,data})=>({path:name,sha256:sha256(data),bytes:data.length})).sort((a,b)=>a.path.localeCompare(b.path));
        assert.deepEqual(memberRecords,[...manifest.zipMembers].sort((a,b)=>a.path.localeCompare(b.path)),'ZIP inventory differs from its release manifest');
        for(const member of members){
          assertPrivacy(member.name,'ZIP member name');
          if(textExtensions.has(path.extname(member.name).toLowerCase()))assertPrivacy(member.data.toString('utf8'),file.path+'!'+member.name);
          if(!/^(?:[^/]+\/)?README(?:\.[A-Za-z]+)?$/i.test(member.name)){
            const relative=member.name.replace(/^[^/]+\/(?=(?:sources|data|downloads)\/)/,'');
            assert.ok(names.has(relative)||manifest.files.some(f=>f.path===relative),'ZIP member is not a published asset: '+member.name);
            assert.equal(sha256(member.data),sha256(await readFile(path.join(frozen,relative))),'ZIP member differs from the edition: '+member.name);
          }
          counters.zipMembers++;
        }
        counters.zips++;
      }
      counters.files++;
    }
    assert.deepEqual([...sourcePaths].sort(),[...approved.keys()].sort(),'An audited source file disappeared from the import');
    for(const tree of verifyBuild?[frozen,built]:[frozen]){
      assert.ok((await readFile(path.join(tree,'manifest.json'))).equals(recordBytes),'Public release manifest differs from its record');
      assert.deepEqual((await walk(tree)).sort(),[...names,'manifest.json'].sort(),'Missing or unregistered frozen files');
    }
    const topics=JSON.parse(await readFile(path.join(frozen,'data/topics.json'),'utf8'));
    const definitions=JSON.parse(await readFile(path.join(frozen,'data/definitions.json'),'utf8')).definitions;
    const statements=JSON.parse(await readFile(path.join(frozen,'data/statements.json'),'utf8'));
    const programme=JSON.parse(await readFile(path.join(frozen,'data/programme.json'),'utf8'));
    const project=JSON.parse(await readFile(path.join(frozen,'data/project.json'),'utf8'));
    const sources=JSON.parse(await readFile(path.join(frozen,'data/source-manifest.json'),'utf8'));
    const programmeItems=Array.isArray(programme)?programme:programme.items||programme.problems||programme.entries;
    assert.ok(Array.isArray(programmeItems),'Programme item list is missing');
    const actualCounts={topics:topics.length,definitions:definitions.length,formalMatureStatements:statements.length,
      formalProgrammeItems:programmeItems.length,proofSources:sources.length,
      pdfs:manifest.files.filter(f=>f.path.endsWith('.pdf')).length,zips:manifest.files.filter(f=>f.path.endsWith('.zip')).length};
    for(const [key,count] of Object.entries(actualCounts))assert.equal(manifest.counts[key],count,'Manifest count: '+key);
    assert.deepEqual(manifest.recordIds,topics.map(t=>t.id));assert.equal(new Set(manifest.recordIds).size,topics.length);
    const sourceMathState={
      topicStatuses:topics.map(({id,sourceStatus,sourceStatusCode,reviewStatus})=>({id,sourceStatus,sourceStatusCode,reviewStatus})),
      statements:statements.map(item=>({id:item.id,statementTexSha256:sha256(item.statementTex||''),reviewStatus:item.reviewStatus,sourceStatus:item.sourceStatus})),
      programme:programmeItems.map(item=>({id:item.id,status:item.status,statementSha256:sha256(item.statement||'')})),
    };
    assert.deepEqual(sourceMathState,manifest.sourceMathState,'Mathematical text or status changed during public projection');
    assert.deepEqual(project.authors,[]);assert.equal(project.authorPolicy,'omit');assert.equal(project.audience,'public');
    const statusCounts={};for(const t of topics)statusCounts[t.sourceStatus]=(statusCounts[t.sourceStatus]||0)+1;
    if(revision==='v1.0.0'){
      assert.deepEqual(actualCounts,{topics:74,definitions:26,formalMatureStatements:66,formalProgrammeItems:14,proofSources:105,pdfs:12,zips:2});
      assert.ok(statements.every(s=>s.reviewStatus==='not_independently_accepted'),'Initial import must preserve formal proof-review status');
      assert.deepEqual(statusCounts,{'Foundational input':11,'Established in source':33,'Established model case':10,'Counterexample / obstruction':12,'Open problem':8});
    }
    if(manifest.sourceStatusCounts)assert.deepEqual(statusCounts,manifest.sourceStatusCounts,'Published topic status changed during import');
    for(const definition of definitions){assert.ok(definition.articleLinks?.length,'Definition lacks a source link: '+definition.id);}
    if(revision==='v1.0.0'){
      const catalogue=await readFile(path.join(frozen,'conjectures/index.html'),'utf8');
      assert.ok(mathAnnotations(catalogue).some(tex=>tex.includes('C_S^*(E;V)')&&tex.includes('\\overset{?}{=}')),'Capacity question marker must remain above equality');
    }
    counters.editions++;
  }
  return counters;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await verifyBedfordTaylorRelease();
  console.log('BT release integrity: '+JSON.stringify(result));
  if(result.pdfTextUnchecked)console.log('PDF text/metadata extraction unavailable; audited import byte identity was checked. Use Poppler for the additional extraction audit.');
}
