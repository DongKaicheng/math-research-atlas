import {createServer} from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {Store, hash, id, secret, revisionHash} from './store.mjs';
import {authHandlers, identify, csrf, requireUser, requireOwner, requireProject, requireRevision,
  roleFor, cookie, cookieName, cookies, fail} from './auth.mjs';

const roles=['manager','editor','reviewer'];
const now=()=>new Date().toISOString();
const text=(value,label,max=4000)=>{
  if(typeof value!=='string' || !value.trim() || value.length>max)fail(400,'validation',`${label} is required (maximum ${max} characters).`);
  return value.trim();
};
const exact=(revision,body,withHash=false)=>{
  if(body.expectedVersion!==revision.version || (withHash&&body.expectedHash!==revision.hash))
    fail(409,'version_conflict','This revision changed. Reload and review its current version.');
};
const mutable=revision=>{
  if(['publishing','pr_open'].includes(revision.status))fail(409,'publication_started','This publication has started. Create a new revision for further changes.');
};
async function jsonBody(req) {
  if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'json_required','Send JSON with Content-Type: application/json.');
  let bytes=0;const chunks=[];
  for await(const chunk of req){bytes+=chunk.length;if(bytes>8*1024*1024)fail(413,'too_large','Request exceeds 8 MiB.');chunks.push(chunk);}
  try {const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value||Array.isArray(value)||typeof value!=='object')throw Error();return value;}
  catch {fail(400,'invalid_json','Request body must be a JSON object.');}
}
function validChanges(changes) {
  if(!Array.isArray(changes)||changes.length<1||changes.length>50)fail(400,'validation','Include between 1 and 50 changed text files, including generated snapshots.');
  if(new Set(changes.map(c=>c?.path)).size!==changes.length)fail(400,'validation','A file path may appear only once.');
  let total=0;
  for(const c of changes){
    if(!c||typeof c.path!=='string'||typeof c.content!=='string'||c.content.includes('\0')||
      !(c.baseSha===null||/^[a-f0-9]{40}$/.test(c.baseSha)))fail(400,'validation','Each file needs its path, text and exact baseline blob SHA (or null for a new file).');
    total+=Buffer.byteLength(c.content); if(total>4*1024*1024)fail(413,'too_large','Changed text exceeds 4 MiB.');
  }
}
export function createApplication({config, repository, store=new Store(config.dbPath), seedProjects=[], oauthFetch=fetch}) {
  const knownOwner=store.get('SELECT value FROM metadata WHERE key=?','ownerId')?.value;
  if(knownOwner && knownOwner!==config.ownerId)throw Error('Configured owner differs from this database. Perform a verified ownership migration.');
  store.run('INSERT OR IGNORE INTO metadata VALUES(?,?)','ownerId',config.ownerId);
  for(const p of seedProjects)store.run('INSERT OR IGNORE INTO projects VALUES(?,?)',p.id,JSON.stringify({...p,sourceKind:'repository',publicationPolicy:'owner_approval',createdAt:p.createdAt||now()}));
  // A crashed external write is uncertain until the same operation is reconciled.
  for(const row of store.all('SELECT id,data FROM jobs')){
    const j=JSON.parse(row.data);
    if(['preparing','submitting'].includes(j.state)){j.state='uncertain';j.error='Service restarted; retry this operation to reconcile its GitHub state.';store.run('UPDATE jobs SET data=? WHERE id=?',JSON.stringify(j),row.id);}
  }
  let queue=Promise.resolve();
  const serial=fn=>{const next=queue.then(fn,fn);queue=next.catch(()=>{});return next;};
  const auth=authHandlers({store,config,fetchImpl:oauthFetch});
  const send=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const detail=revision=>({
    ...revision,
    versions:store.all('SELECT version,data FROM versions WHERE revisionId=? ORDER BY version DESC',revision.id).map(r=>{const v=JSON.parse(r.data);return {version:v.version,hash:v.hash,title:v.title,createdAt:v.updatedAt};}),
    reviews:store.all('SELECT data FROM reviews WHERE revisionId=?',revision.id).map(r=>({...JSON.parse(r.data),applicable:JSON.parse(r.data).hash===revision.hash})),
    job:store.all('SELECT data FROM jobs WHERE revisionId=?',revision.id).map(r=>JSON.parse(r.data)).at(-1)||null,
  });
  const audit=(actor,project,action,extra={})=>store.audit(actor.user.id,project,action,{...extra,...(actor.credential==='token'?{tokenId:actor.tokenId}:{} )});

  async function api(req,res,url,actor) {
    const route=url.pathname,method=req.method;
    if(route==='/api/context' && method==='GET')return send(res,{
      user:actor?.user||null,isOwner:actor?.isOwner||false,csrfToken:actor?.csrf||null,
      loginConfigured:config.demo||!!(config.clientId&&config.clientSecret),publicationConfigured:!config.demo&&!!config.publicationToken,
      publicOrigin:config.publicOrigin,repository:config.repository,demo:config.demo,
    });
    requireUser(actor);
    if(method!=='GET')csrf(req,actor,config);
    if(route==='/api/docs'&&method==='GET')return send(res,{authentication:'Bearer om_<token>',
      permissions:'Each request checks the current account grant and token project scope. API tokens cannot grant membership, accept invitations, approve, or publish.',
      routes:['GET /api/context','GET /api/projects','GET /api/projects/:id/sources','GET /api/projects/:id/source?path=...&ref=...',
        'GET /api/projects/:id/revisions','POST /api/projects/:id/revisions','GET /api/revisions/:id',
        'PUT /api/revisions/:id','POST /api/revisions/:id/submit','POST /api/revisions/:id/review','GET /api/projects/:id/audit'],
      source:'See management/CONTRACT.md in the source repository for request fields.'});
    if(route==='/api/logout'&&method==='POST'){
      if(actor.credential!=='session')fail(400,'session_required','Revoke an API token in token settings.');
      const token=cookies(req)[cookieName(config,'om_session')];store.run('DELETE FROM sessions WHERE hash=?',hash(token));
      res.setHeader('Set-Cookie',cookie(config,'om_session','',0));return send(res,{ok:true});
    }
    if(route==='/api/projects'&&method==='GET')return send(res,{projects:store.all('SELECT data FROM projects').map(r=>JSON.parse(r.data)).map(p=>({...p,role:roleFor(store,actor,p.id)})).filter(p=>p.role)});
    if(route==='/api/projects'&&method==='POST'){
      requireOwner(actor);const b=await jsonBody(req);
      const slug=text(b.slug,'Project ID',64);
      if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)||['site','admin','api','history','projects','agents','feedback','workspaces'].includes(slug))fail(400,'validation','Use a unique lowercase project ID with letters, numbers and hyphens.');
      if(!['research','foundations'].includes(b.category))fail(400,'validation','Choose Research or Foundations.');
      if(b.proposalIssue!==undefined&&(!Number.isSafeInteger(b.proposalIssue)||b.proposalIssue<1))fail(400,'validation','Proposal Issue must be an existing positive Issue number.');
      if(store.project(slug))fail(409,'project_exists','That project ID is already registered.');
      const project={id:slug,title:text(b.title,'Title',200),summary:text(b.summary,'Scope'),category:b.category,
        sourceKind:'workspace',publicationPolicy:'owner_approval',createdAt:now(),proposalIssue:b.proposalIssue||null};
      // Check repository scope before accepting an ID which may have been added elsewhere.
      const sources=await repository.listSources(project);
      if(sources.files.some(f=>f.path===`content/projects/${slug}.json`&&f.sha))fail(409,'project_exists','This project already exists in the repository; import it through an operator migration.');
      requireOwner(identify(req,store,config));
      store.transaction(()=>{store.run('INSERT INTO projects VALUES(?,?)',slug,JSON.stringify(project));audit(actor,slug,'project.created');});
      return send(res,project,201);
    }
    if(route==='/api/accounts'&&method==='GET'){requireOwner(actor);return send(res,{accounts:store.all('SELECT id,login,name FROM accounts ORDER BY login')});}
    if(route==='/api/invitations'&&method==='GET'){
      if(actor.credential!=='session')fail(403,'browser_required','Use a browser session for invitations.');
      return send(res,{invitations:store.all('SELECT * FROM invitations WHERE userId=? AND status=?',actor.user.id,'pending').filter(i=>Date.parse(i.expiresAt)>Date.now()).map(i=>({...i,projectTitle:store.project(i.projectId)?.title}))});
    }
    let m=route.match(/^\/api\/invitations\/([^/]+)(\/accept)?$/);
    if(m){
      if(actor.credential!=='session')fail(403,'browser_required','Use a browser session for invitations.');
      const invite=store.get('SELECT * FROM invitations WHERE id=?',m[1]);
      if(!invite)fail(404,'not_found','Invitation not found.');
      if(method==='DELETE'&&!m[2]){requireOwner(actor);store.run('UPDATE invitations SET status=? WHERE id=?','revoked',invite.id);audit(actor,invite.projectId,'invitation.revoked',{id:invite.id});return send(res,{ok:true});}
      if(method==='POST'&&m[2]){
        if(invite.userId!==actor.user.id)fail(404,'not_found','Invitation not found.');
        if(invite.status!=='pending'||Date.parse(invite.expiresAt)<=Date.now())fail(409,'invitation_inactive','This invitation expired or was revoked. Ask the owner for a new invitation.');
        store.transaction(()=>{store.run('INSERT INTO grants VALUES(?,?,?) ON CONFLICT(userId,projectId) DO UPDATE SET role=excluded.role',actor.user.id,invite.projectId,invite.role);store.run('UPDATE invitations SET status=? WHERE id=?','accepted',invite.id);audit(actor,invite.projectId,'invitation.accepted',{role:invite.role});});
        return send(res,{ok:true});
      }
    }
    m=route.match(/^\/api\/projects\/([^/]+)(?:\/(members|invitations|sources|source|revisions|audit)(?:\/([^/]+))?)?$/);
    if(m){
      const [,projectId,section,objectId]=m;
      const project=requireProject(store,actor,projectId);
      if(!section&&method==='GET')return send(res,project);
      if(section==='members'&&method==='GET'){
        if(!['owner','manager'].includes(project.role))fail(403,'permission','Project membership is available to its managers.');
        return send(res,{members:store.all('SELECT g.userId,a.login,g.role FROM grants g JOIN accounts a ON g.userId=a.id WHERE g.projectId=?',projectId),
          invitations:actor.isOwner?store.all('SELECT i.*,a.login FROM invitations i JOIN accounts a ON a.id=i.userId WHERE i.projectId=? ORDER BY i.createdAt DESC',projectId):[]});
      }
      if(section==='members'&&method==='DELETE'&&objectId){requireOwner(actor);store.transaction(()=>{store.run('DELETE FROM grants WHERE userId=? AND projectId=?',objectId,projectId);store.run('UPDATE invitations SET status=? WHERE userId=? AND projectId=? AND status=?','revoked',objectId,projectId,'pending');audit(actor,projectId,'membership.revoked',{userId:objectId});});return send(res,{ok:true});}
      if(section==='invitations'&&method==='POST'){
        requireOwner(actor);const b=await jsonBody(req);
        if(!roles.includes(b.role)||typeof b.userId!=='string'||!store.get('SELECT id FROM accounts WHERE id=?',b.userId))fail(400,'validation','Choose a registered GitHub account and a project role.');
        if(b.userId===config.ownerId)fail(400,'owner_membership','The configured owner already has owner access.');
        const invitation={id:id(),userId:b.userId,projectId,role:b.role,status:'pending',expiresAt:new Date(Date.now()+7*86400000).toISOString(),createdAt:now()};
        store.transaction(()=>{store.run('UPDATE invitations SET status=? WHERE userId=? AND projectId=? AND status=?','superseded',b.userId,projectId,'pending');store.run('INSERT INTO invitations VALUES(?,?,?,?,?,?,?)',...Object.values(invitation));audit(actor,projectId,'invitation.created',{id:invitation.id,userId:b.userId,role:b.role});});
        return send(res,invitation,201);
      }
      if(section==='sources'&&method==='GET'){
        const result=await repository.listSources(project);requireProject(store,identify(req,store,config),projectId);return send(res,result);
      }
      if(section==='source'&&method==='GET'){
        const result=await repository.readSource(project,text(url.searchParams.get('path'),'Source path',600),text(url.searchParams.get('ref'),'Source ref',40));
        requireProject(store,identify(req,store,config),projectId);return send(res,result);
      }
      if(section==='revisions'&&method==='GET')return send(res,{revisions:store.all('SELECT data FROM revisions WHERE projectId=? ORDER BY rowid DESC',projectId).map(r=>{const {changes,...meta}=JSON.parse(r.data);return meta;})});
      if(section==='revisions'&&method==='POST'){
        requireProject(store,actor,projectId,'edit');const b=await jsonBody(req);validChanges(b.changes);
        if(!/^[a-f0-9]{40}$/.test(b.baseRef))fail(400,'validation','Read the exact source baseline first.');
        const changes=await repository.validateChanges(project,b.baseRef,b.changes);
        requireProject(store,identify(req,store,config),projectId,'edit');
        const r={id:id(),projectId,title:text(b.title,'Revision title',200),baseRef:b.baseRef,changes,version:1,status:'draft',authorId:actor.user.id,createdAt:now(),updatedAt:now(),approval:null};
        r.hash=revisionHash(r);store.transaction(()=>{store.saveRevision(r);audit(actor,projectId,'revision.created',{id:r.id,version:r.version,hash:r.hash});});return send(res,detail(r),201);
      }
      if(section==='audit'&&method==='GET')return send(res,{events:store.all('SELECT * FROM audit WHERE projectId=? ORDER BY rowid DESC LIMIT 200',projectId).map(e=>({...e,detail:JSON.parse(e.detail)}))});
    }
    m=route.match(/^\/api\/revisions\/([^/]+)(?:\/(submit|review|approve|publish))?$/);
    if(m){
      const [,revisionId,action]=m;
      let {revision:r,project}=requireRevision(store,actor,revisionId);
      if(!action&&method==='GET'){
        if(url.searchParams.has('version')){
          const version=Number(url.searchParams.get('version'));
          const row=store.get('SELECT data FROM versions WHERE revisionId=? AND version=?',revisionId,version);
          if(!row)fail(404,'not_found','Historical version not found.');
          return send(res,{...JSON.parse(row.data),historical:true});
        }
        return send(res,{...detail(r),projectRole:project.role});
      }
      if(!action&&method==='PUT'){
        requireProject(store,actor,r.projectId,'edit');const b=await jsonBody(req);exact(r,b);mutable(r);validChanges(b.changes);
        const changes=await repository.validateChanges(project,r.baseRef,b.changes);
        requireProject(store,identify(req,store,config),r.projectId,'edit');
        r={...r,title:text(b.title,'Revision title',200),changes,version:r.version+1,status:'draft',approval:null,updatedAt:now()};r.hash=revisionHash(r);
        store.transaction(()=>{store.saveRevision(r);audit(actor,r.projectId,'revision.updated',{id:r.id,version:r.version,hash:r.hash});});return send(res,detail(r));
      }
      if(action&&method==='POST'){
        const b=await jsonBody(req);exact(r,b,action!=='submit');
        if(action==='submit'){
          requireProject(store,actor,r.projectId,'edit');mutable(r);if(r.status!=='draft')fail(409,'state','Only a draft can be submitted.');
          r.status='submitted';r.updatedAt=now();store.transaction(()=>{store.saveRevision(r,false);audit(actor,r.projectId,'revision.submitted',{id:r.id,hash:r.hash});});return send(res,detail(r));
        }
        if(action==='review'){
          requireProject(store,actor,r.projectId,'review');mutable(r);
          if(!['note','changes_requested','ready'].includes(b.verdict))fail(400,'validation','Select a review verdict.');
          const review={id:id(),revisionId:r.id,version:r.version,hash:r.hash,reviewerId:actor.user.id,reviewerLogin:actor.user.login,
            kind:actor.credential==='token'?'api_assisted':actor.user.id===r.authorId?'author_reread':'human_review',verdict:b.verdict,notes:text(b.notes,'Review findings',30000),createdAt:now()};
          store.transaction(()=>{store.run('INSERT INTO reviews VALUES(?,?,?)',review.id,r.id,JSON.stringify(review));if(b.verdict==='changes_requested'){r.status='draft';r.approval=null;store.saveRevision(r,false);}audit(actor,r.projectId,'revision.reviewed',{id:r.id,hash:r.hash,verdict:b.verdict});});return send(res,detail(r));
        }
        if(action==='approve'){
          requireOwner(actor);mutable(r);if(!['submitted','approved'].includes(r.status))fail(409,'state','Submit the revision before approving publication.');
          r.status='approved';r.approval={userId:actor.user.id,version:r.version,hash:r.hash,createdAt:now()};r.updatedAt=now();
          store.transaction(()=>{store.saveRevision(r,false);audit(actor,r.projectId,'publication.approved',{id:r.id,hash:r.hash});});return send(res,detail(r));
        }
        if(action==='publish'){
          requireOwner(actor);
          if(config.demo||!config.publicationToken)fail(503,'publication_unconfigured','GitHub publication is not configured. The private revision remains saved.');
          if(!r.approval||r.approval.hash!==r.hash||r.approval.version!==r.version)fail(409,'approval_required','Approve this exact revision before public disclosure.');
          const operationId=text(b.operationId,'Operation ID',80);
          if(!/^[a-zA-Z0-9-]{16,80}$/.test(operationId))fail(400,'validation','Use a unique operation ID (for example a UUID).');
          let jobRow=store.get('SELECT data FROM jobs WHERE id=?',operationId),job=jobRow&&JSON.parse(jobRow.data);
          if(job&&(job.revisionId!==r.id||job.hash!==r.hash))fail(409,'operation_conflict','That operation belongs to a different candidate.');
          if(job?.state==='submitted')return send(res,{job});
          const prior=store.all('SELECT data FROM jobs WHERE revisionId=?',r.id).map(x=>JSON.parse(x.data)).find(j=>j.id!==operationId&&j.state!=='failed');
          if(prior)fail(409,'operation_exists','Retry the existing publication operation before starting another.');
          if(!['approved','publishing'].includes(r.status))fail(409,'state','This revision is not ready for publication.');
          const previouslyStarted=job?.externalStarted||job?.state==='uncertain'||r.status==='publishing';
          job={id:operationId,revisionId:r.id,projectId:r.projectId,hash:r.hash,state:'preparing',externalStarted:!!previouslyStarted,createdAt:job?.createdAt||now(),updatedAt:now()};
          const saveJob=()=>store.run('INSERT INTO jobs VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',job.id,r.id,JSON.stringify(job));
          saveJob();
          try {
            const result=await repository.publish(project,r,operationId,async()=>{
              const currentActor=identify(req,store,config);requireOwner(currentActor);requireProject(store,currentActor,r.projectId,'edit');
              const current=store.revision(r.id);exact(current,b,true);
              if(current.approval?.hash!==r.hash)fail(409,'approval_required','Approval changed before submission.');
              job.state='submitting';job.externalStarted=true;r.status='publishing';store.transaction(()=>{saveJob();store.saveRevision(r,false);audit(actor,r.projectId,'publication.started',{id:r.id,operationId,hash:r.hash});});
            });
            job={...job,...result,state:'submitted',updatedAt:now()};r.status='pr_open';
            store.transaction(()=>{saveJob();store.saveRevision(r,false);audit(actor,r.projectId,'publication.pr_opened',{id:r.id,operationId,prUrl:result.prUrl});});
          }catch(error){
            const begun=job.externalStarted;job.state=begun?'uncertain':'failed';job.updatedAt=now();
            job.error=begun?'The GitHub outcome is uncertain. Retry this same operation to reconcile it.':(error.status||error.statusCode)?error.message:'GitHub preparation failed. Retry after checking the service configuration.';
            if(!begun)r.status='approved';saveJob();store.saveRevision(r,false);audit(actor,r.projectId,'publication.'+job.state,{id:r.id,operationId});
          }
          return send(res,{job},job.state==='submitted'?200:409);
        }
      }
    }
    if(route==='/api/tokens'&&method==='GET'){
      if(actor.credential!=='session')fail(403,'browser_required','Use a browser session for token settings.');
      return send(res,{tokens:store.all('SELECT id,data FROM tokens WHERE userId=?',actor.user.id).map(row=>({id:row.id,...JSON.parse(row.data)}))});
    }
    if(route==='/api/tokens'&&method==='POST'){
      if(actor.credential!=='session')fail(403,'browser_required','Create API tokens in a browser session.');
      const b=await jsonBody(req), name=text(b.name,'Token name',100),days=b.days??30;
      if(!Number.isInteger(days)||days<1||days>90||typeof b.write!=='boolean'||!Array.isArray(b.projectIds)||!b.projectIds.length||b.projectIds.length>50||new Set(b.projectIds).size!==b.projectIds.length)fail(400,'validation','Choose project scopes and an expiry from 1 to 90 days.');
      for(const p of b.projectIds)requireProject(store,actor,p);
      const token='om_'+secret(),tokenId=id(),data={name,projectIds:b.projectIds,write:b.write,createdAt:now(),expiresAt:new Date(Date.now()+days*86400000).toISOString()};
      store.run('INSERT INTO tokens VALUES(?,?,?,?)',tokenId,hash(token),actor.user.id,JSON.stringify(data));
      for(const p of b.projectIds)audit(actor,p,'token.created',{id:tokenId,write:b.write});
      return send(res,{id:tokenId,token,...data},201);
    }
    m=route.match(/^\/api\/tokens\/([^/]+)$/);
    if(m&&method==='DELETE'){
      if(actor.credential!=='session')fail(403,'browser_required','Revoke tokens in a browser session.');
      store.run('DELETE FROM tokens WHERE id=? AND userId=?',m[1],actor.user.id);return send(res,{ok:true});
    }
    fail(404,'not_found','API endpoint not found.');
  }

  const server=createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if(config.secure)res.setHeader('Strict-Transport-Security','max-age=31536000');
    try{
      const url=new URL(req.url,config.origin);
      if(url.origin!==config.origin)fail(400,'origin','Invalid request URL.');
      if(url.pathname==='/healthz'&&req.method==='GET')return send(res,{ok:true});
      const expectedHost=new URL(config.origin).host;
      if(req.headers.host!==expectedHost)fail(421,'host','Use the configured application origin.');
      if(await auth(req,res,url))return;
      if(url.pathname.startsWith('/api/')){
        const run=()=>api(req,res,url,identify(req,store,config));
        if(req.method==='GET')await run();else await serial(run);
        return;
      }
      if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'method','Method not allowed.');
      const relative=url.pathname==='/'||url.pathname==='/ai'?'index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
      if(!/\.(?:html|js|css|svg|ico|woff2?|ttf)$/.test(relative))fail(404,'not_found','Page not found.');
      const target=path.resolve(config.webRoot,relative);
      if(!target.startsWith(path.resolve(config.webRoot)+path.sep))fail(404,'not_found','Page not found.');
      let resolved;try{resolved=await realpath(target);}catch{fail(404,'not_found','Page not found. Build the management frontend before starting.');}
      if(!resolved.startsWith(path.resolve(config.webRoot)+path.sep)||(await stat(resolved)).isDirectory())fail(404,'not_found','Page not found.');
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
      res.writeHead(200,{'Content-Type':types[path.extname(resolved)]});res.end(req.method==='HEAD'?undefined:await readFile(resolved));
    }catch(error){
      if(res.headersSent){res.end();return;}
      const status=Number(error.status||error.statusCode)||500;
      send(res,{error:status>=500?'The service could not complete this request. Check configuration or try again.':error.message,
        code:error.code||'service_error'},status);
    }
  });
  server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=60;
  return {server,store,close:()=>new Promise(resolve=>{server.close(()=>{store.close();resolve();});server.closeIdleConnections();})};
}
