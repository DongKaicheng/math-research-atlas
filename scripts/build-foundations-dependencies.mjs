import {createHash} from 'node:crypto';

const project = '/projects/foundations/';
const stackTag = /^https:\/\/stacks\.math\.columbia\.edu\/tag\/([A-Z0-9]{4})(?:#.*)?$/;
const statementType = /^<div class="(theorem|lemma|proposition|corollary|definition|example|remark|construction|question)">/;
const applies = /\b(?:by|apply|applying|use|using|invoke|invoking|from|as in|follows from|follows by|given by|combine|combining)\s+(?:the\s+)?(?:(?:lemma|proposition|theorem|corollary|result|definition|criterion|formula)\s*)?$/i;
const numberReference = /\b(Theorem|Lemma|Proposition|Corollary|Definition|Example)\s+([A-Z0-9]+(?:\.\d+){1,3})(?=[\s.,:;)\]]|$)/g;
const tagLike = /\bNAG-\d{6}\b/g;
const labels = /\bid="([^"]+)"/g;
const quoteEntities = {amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",'#x27':"'",nbsp:' '};

const digest = value => createHash('sha256').update(value).digest('hex');
const at = (chapter,index) => `${chapter.key}:${index}`;
const firstLabel = html => [...html.matchAll(labels)].map(([,label])=>label).find(label=>label.startsWith('label-'));

export function readingText(html) {
  return html.replace(/<math\b[^>]*>[\s\S]*?<\/math>/g,' [formula] ').replace(/<[^>]+>/g,'')
    .replace(/&(amp|lt|gt|quot|#39|#x27|nbsp);/g,(_,name)=>quoteEntities[name]).replace(/\s+/g,' ').trim();
}

export const proofParagraphs = html => Array.from(html.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/g), match=>match[0]);
const proofListItems = html => Array.from(html.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)(?=<\/?li\b|$)/g), match=>match[1]);

function proofContent(chapter,proof) {
  return chapter.blocks.slice(proof.index,proof.end+1).join('');
}

export function bindReviewedProofs(native, review) {
  const tags={...native.tags};
  const byKey=new Map(native.byKey);
  const chapters=new Map(native.chapters);
  for(const item of review.bindings) {
    const record=tags[item.id];
    const [key,index]=item.proof.split(':');
    const chapter=byKey.get(key);
    const range=item.inline && record?.index===Number(index) && record.kind==='example' ?
      {index:Number(index),end:Number(index),title:'Argument in the example'} : chapter?.proofs.find(proof=>proof.index===Number(index));
    if (!record || record.proof!=null || record.key!==key || !range ||
        digest(proofContent(chapter,range))!==item.proofSha256 || digest(chapter.blocks[record.index])!==item.statementSha256) {
      throw Error('Stale web proof binding '+item.id);
    }
    if(item.companion) {
      const [route,anchor]=item.companion.split('#');
      if(route!==chapter.route || !anchor || !chapter.blocks.some(block=>block.includes(`id="${anchor}"`))) {
        throw Error('Unbound companion passage '+item.id);
      }
    }
    if(item.inline) {
      const amended={...chapter,proofs:[...chapter.proofs,range].sort((a,b)=>a.index-b.index)};
      byKey.set(key,amended);
      chapters.set(chapter.route,amended);
    }
    tags[item.id]={...record,proof:range.index,proofEnd:range.end,companion:item.companion,inlineProof:item.inline};
  }
  return {...native,tags,byKey,chapters};
}

function adjacentProof(chapter,index) {
  const next=chapter.proofs.find(proof=>proof.index>index);
  if (!next) return null;
  const notes=chapter.blocks.slice(index+1,next.index);
  return notes.every(html=> {
    const text=readingText(html);
    return !text || /^(?:References?|Direct inputs?|Proof inputs?|Proof links?|Dependencies|Source references)[.:]/i.test(text);
  }) ? next : null;
}

function statementTitle(html, kind) {
  const present = html.match(/<strong>([^]*?)<\/strong>/);
  const number = readingText(present?.[1] ?? '').match(/(?:\d+|[A-Z])(?:\.\d+){1,3}/)?.[0];
  const heading = present ? readingText(html.slice(present.index+present[0].length)).match(/^(?:NAG-\d{6}\s+)*\(([^)]{3,125})\)\./)?.[1] : '';
  const reference = kind[0].toUpperCase()+kind.slice(1)+(number ? ' '+number : '');
  return {number,reference,title:heading ? `${reference} · ${heading}` : reference};
}

function indexResults(native, rows) {
  const byLocation = new Map();
  const exact = new Map(rows.map(row=>[row.link,{id:row.id,route:row.link,title:row.title,kind:'nag'}]));
  const byNumber = new Map();
  const stable = new Map();
  const byBlock = new Map();
  const ownerOf = new Map();
  const exactBook = new Map();
  for (const [id, record] of Object.entries(native.tags)) {
    const result=exact.get(`/r/${id}/`);
    result.book=record.href;
    if(!exactBook.has(record.href))exactBook.set(record.href,[]);
    exactBook.get(record.href).push(result);
    if (record.index==null) continue;
    const key=`${record.key}:${record.index}`;
    if (!ownerOf.has(key)) ownerOf.set(key,[]);
    ownerOf.get(key).push(result);
  }
  for(const [href,results] of exactBook)if(results.length===1)exact.set(href,results[0]);
  for (const chapter of native.chapters.values()) {
    for (const [index,html] of chapter.blocks.entries()) {
      const locators=Array.from(html.matchAll(labels),match=>chapter.route+'#'+match[1]);
      const kind=html.match(statementType)?.[1];
      const key=at(chapter,index);
      for (const href of locators) byLocation.set(href,{chapter,index,result:null});
      if (!kind) continue;
      const anchor = firstLabel(html);
      const registered = ownerOf.get(key) ?? [];
      const names=statementTitle(html,kind);
      const book = anchor ? chapter.route+'#'+anchor : locators[0];
      if (!book) continue;
      const result = registered.length===1 ? registered[0] : {
        id:anchor && !registered.length ? 'FND-'+digest(anchor).slice(0,12).toUpperCase() : null,
        book,kind, title:names.title,route:book, ambiguous:registered.length>1,
      };
      if (result.id?.startsWith('FND-')) {
        result.route=project+'results/'+result.id.toLowerCase()+'/';
        const previous=stable.get(result.id);
        if(previous && previous.book!==book)throw Error('Ambiguous Foundations label: '+anchor);
        stable.set(result.id,{...result,chapter,index,proof:adjacentProof(chapter,index)});
        byBlock.set(key,result);
      }
      for (const locator of locators) byLocation.get(locator).result=result;
      if(names.number) {
        if(!byNumber.has(names.reference))byNumber.set(names.reference,[]);
        byNumber.get(names.reference).push(result);
      }
    }
  }
  return {byLocation,exact,byNumber,stable,byBlock};
}

function referencesIn(paragraph, site, results) {
  const marks=[];
  const known=new Set();
  const added=new Set();
  const note = (node, before = '', clause='') => {
    if (!node) return;
    const key=node.route+' '+clause;
    if(added.has(key))return;
    added.add(key);
    marks.push({node,...site, application:applies.test(before.slice(-120)),clause});
  };
  for (const match of paragraph.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [,href,title] = match;
    known.add(readingText(title));
    const stacks=href.match(stackTag)?.[1];
    const result=results.exact.get(href) ?? results.byLocation.get(href)?.result;
    const target=stacks ? {id:stacks,route:`https://stacks.math.columbia.edu/tag/${stacks}`,title:`Stacks Project, Tag ${stacks}`,kind:'stacks'} : result;
    const clause=stacks ? readingText(paragraph.slice(match.index+match[0].length)).match(/^((?:\([\da-z]+\)){1,2})/i)?.[1] : null;
    note(target,readingText(paragraph.slice(0,match.index)),clause ? 'Cited clause '+clause : '');
  }
  const text=readingText(paragraph);
  for(const match of text.matchAll(numberReference)) {
    const [name,, number]=match;
    const matches=results.byNumber.get(name);
    if(known.has(number)||known.has(name)||matches?.length!==1)continue;
    note(matches[0],text.slice(0,match.index));
  }
  for(const match of text.matchAll(tagLike)) {
    if(!known.has(match[0]))note(results.exact.get(`/r/${match[0]}/`),text.slice(0,match.index));
  }
  return marks;
}

function validatedGraph(graph, reviewed, proofs) {
  const edges = new Map(Object.entries(graph.arguments).map(([key,arg])=>[key,new Set(arg.inputs.map(input=>input.key))]));
  for (const [key,use] of reviewed) {
    const owners=[...proofs.get(key).owners,...proofs.get(key).unregisteredOwners];
    for(const owner of owners) {
      if (!edges.has(owner))edges.set(owner,new Set());
      for(const application of use) {
        const target=application.node.id;
        if(/^(?:NAG-\d{6}|FND-[A-F0-9]{12})$/.test(target ?? '') && target!==owner)edges.get(owner).add(target);
      }
    }
  }
  const done=new Set(), checking=new Set();
  function check(key) {
    if (checking.has(key)) throw Error('Circular dependency in the reviewed Foundations inputs: '+key);
    if (done.has(key)) return;
    checking.add(key);
    for(const input of edges.get(key) ?? []) check(input);
    checking.delete(key);
    done.add(key);
  }
  for(const key of edges.keys())check(key);
}

export function createProofDependencies(release) {
  const {native, rows, graph, dependencyReview} = release;
  const results=indexResults(native,rows);
  const owners=new Map();
  for(const [id,record] of Object.entries(native.tags)) {
    if(record.proof==null)continue;
    const key=`${record.key}:${record.proof}`;
    if(!owners.has(key))owners.set(key,[]);
    owners.get(key).push(id);
  }
  const proofs=new Map();
  const unregisteredOwners=new Map();
  for(const result of results.stable.values()) {
    if(!result.proof)continue;
    const key=at(result.chapter,result.proof.index);
    if(!unregisteredOwners.has(key))unregisteredOwners.set(key,[]);
    unregisteredOwners.get(key).push(result.id);
  }
  for(const chapter of native.chapters.values())for(const proof of chapter.proofs) {
    const key=at(chapter,proof.index);
    const html=proofContent(chapter,proof);
    const paragraphs=proofParagraphs(html);
    proofs.set(key,{key,chapter,proof,digest:digest(html),paragraphs,listItems:proofListItems(html),owners:owners.get(key) ?? [],unregisteredOwners:unregisteredOwners.get(key) ?? []});
  }
  if(dependencyReview?.edition!==release.current.edition || dependencyReview.sourcePdfSha256!==native.sourcePdfSha256) {
    throw Error('Dependency review is out of scope for this edition');
  }
  const reviewed=new Map();
  const selfContained=new Map();
  const policyByBlock=new Map();
  const policyByProof=new Map();
  const usedResults=new Set();
  for(const item of dependencyReview.proofs) {
    const proof=proofs.get(item.proof);
    if (!proof || proof.digest!==item.sha256 || reviewed.has(item.proof)) throw Error('Stale Foundations proof review '+item.proof);
    const inputs=[];
    for(const edge of item.inputs) {
      const stacks=edge.target.match(stackTag)?.[1];
      const node=stacks ? {id:stacks,route:edge.target,title:'Stacks Project, Tag '+stacks,kind:'stacks'} :
        results.exact.get(edge.target) ?? results.byLocation.get(edge.target)?.result;
      const paragraph=proof.paragraphs[edge.paragraph-1];
      if (!node || !paragraph || !edge.step || !edge.evidence || !readingText(paragraph).includes(edge.evidence)) {
        throw Error('Unbound Foundations application evidence '+item.proof+' · '+edge.target);
      }
      if(node.id?.startsWith('FND-'))usedResults.add(node.id);
      inputs.push({node,paragraph:edge.paragraph,step:edge.step,evidence:edge.evidence});
    }
    if(item.selfContained) {
      if(inputs.length)throw Error('Self-contained proof with listed dependencies '+item.proof);
      selfContained.set(item.proof,item.selfContained);
    }
    reviewed.set(item.proof,inputs);
  }
  for(const finding of dependencyReview.policy) {
    const location=results.byLocation.get(finding.anchor);
    const proof=finding.proof ? proofs.get(finding.proof) : null;
    if(!location || digest(location.chapter.blocks[location.index])!==finding.anchorSha256 ||
      (finding.proof && (!proof || proof.digest!==finding.proofSha256)) || !['external-assumption','open'].includes(finding.status)) {
      throw Error('Stale Foundations source policy notice');
    }
    policyByBlock.set(at(location.chapter,location.index),finding);
    if(proof)policyByProof.set(proof.key,finding);
  }
  validatedGraph(graph,reviewed,proofs);

  const byProof=new Map();
  const byId=new Map();
  for(const proof of proofs.values()) {
    const confirmed=reviewed.get(proof.key) ?? [];
    const registered=proof.owners.flatMap(id=>graph.arguments[id]?.inputs.filter(input=>input.key===graph.nodes[input.key].id && !input.scopes.length).map(input=>input.key) ?? []);
    const covered=new Set([...registered,...confirmed.map(item=>item.node.id),...proof.owners]);
    for (const id of proof.owners) {
      const argument=graph.arguments[id];
      for(const input of argument?.external ?? [])covered.add(input.href.match(stackTag)?.[1]);
      for(const input of argument?.standing ?? [])covered.add(graph.contexts[input.key]?.id);
    }
    const candidates=new Map();
    const possible=proof.paragraphs.flatMap((text,i)=>referencesIn(text,{paragraph:i+1},results));
    for(const [number,body] of proof.listItems.entries()) {
      if (!/<p(?:\s[^>]*)?>/.test(body))possible.push(...referencesIn(body,{listItem:number+1},results));
    }
    for(const ref of possible) {
      const {node}=ref;
      if (node.id && (covered.has(node.id) && !ref.clause || proof.unregisteredOwners.includes(node.id))) continue;
      if (node.id?.startsWith('FND-'))usedResults.add(node.id);
      const key=node.route+' '+ref.clause;
      const previous=candidates.get(key);
      if(!previous || (!previous.application && ref.application))candidates.set(key,ref);
    }
    const entry={...proof,confirmed,candidates:[...candidates.values()],selfContained:selfContained.get(proof.key),policy:policyByProof.get(proof.key)};
    byProof.set(proof.key,entry);
    for(const id of proof.owners)byId.set(id,entry);
  }
  const visibleResults=new Map([...results.stable].filter(([id])=>usedResults.has(id)));
  const visibleByBlock=new Map([...results.byBlock].filter(([,result])=>usedResults.has(result.id)));
  return {byProof,byId,results:visibleResults,resultByBlock:visibleByBlock,policyByBlock};
}
