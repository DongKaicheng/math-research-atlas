import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplication} from '../server/app.mjs';
import {DemoRepository} from '../server/demo.mjs';
import {initialProjectFiles} from '../server/github.mjs';
import {readConfig} from '../server/config.mjs';
import {hash} from '../server/store.mjs';
import {cookie} from '../server/auth.mjs';

const projects=['alpha','beta'].map(id=>({id,title:`Project ${id}`,summary:'A test project with no mathematical claims.',category:'research',sourceKind:'repository',createdAt:'2026-11-23T00:00:00Z'}));
class TestRepository extends DemoRepository {
  constructor(){super();this.files.clear();for(const p of projects)for(const f of initialProjectFiles(p))this.files.set(f.path,f.content);this.calls=0;this.failOnce=false;}
  async publish(project,revision,operation,beforeSubmit){await beforeSubmit();this.calls++;if(this.failOnce){this.failOnce=false;throw Error('Timeout after external request');}return {prUrl:'https://github.com/test/repo/pull/1',branch:'openmath/'+operation,headSha:'c'.repeat(40)};}
}
async function fixture(t,options={}) {
  const repo=new TestRepository();
  const config={dbPath:':memory:',origin:'http://127.0.0.1',secure:false,ownerId:'1001',clientId:'test-client',clientSecret:'test-client-secret',
    repository:'test/repo',branch:'main',publicationToken:'test-publication-only',publicOrigin:'https://openmath-atlas.org',demo:false,sessionMs:3600000,webRoot:'/nonexistent',...options.config};
  const app=createApplication({config,repository:repo,seedProjects:projects,oauthFetch:options.oauthFetch});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  config.origin=`http://127.0.0.1:${app.server.address().port}`;
  const users={};
  for(const [name,userId] of Object.entries({owner:'1001',editor:'1002',reviewer:'1003',other:'1004',newcomer:'1005'})){
    app.store.account({id:userId,login:name,name});const session=app.store.session(userId,3600000);users[name]={userId,...session};
  }
  app.store.run('INSERT INTO grants VALUES(?,?,?)','1002','alpha','editor');app.store.run('INSERT INTO grants VALUES(?,?,?)','1003','alpha','reviewer');app.store.run('INSERT INTO grants VALUES(?,?,?)','1004','beta','manager');
  async function req(route,{method='GET',user='owner',body,headers={},csrf=true}={}){
    const credential=users[user];const h={...headers};
    if(credential){h.Cookie=`om_session=${credential.token}`;if(method!=='GET'&&csrf){h.Origin=config.origin;h['X-CSRF-Token']=credential.csrf;}}
    if(body!==undefined)h['Content-Type']='application/json';
    const response=await fetch(config.origin+route,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
    const raw=await response.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}
    return {status:response.status,data,headers:response.headers};
  }
  async function draft(user='editor',projectId='alpha'){
    const project=projects.find(p=>p.id===projectId),file=await repo.readSource(project,`content/projects/${projectId}.json`,repo.ref);
    const content=JSON.parse(file.content);content.project.programme='A source-bound draft.';
    const result=await req(`/api/projects/${projectId}/revisions`,{method:'POST',user,body:{title:'Clarify the programme',baseRef:repo.ref,changes:[{path:file.path,content:JSON.stringify(content),baseSha:file.sha}]}});
    assert.equal(result.status,201,JSON.stringify(result.data));return result.data;
  }
  t.after(()=>app.close());return {app,store:app.store,repo,config,users,req,draft};
}

test('anonymous and registered but unappointed users cannot read private projects',async t=>{
  const f=await fixture(t);
  assert.equal((await f.req('/api/projects',{user:null})).status,401);
  assert.deepEqual((await f.req('/api/projects',{user:'newcomer'})).data.projects,[]);
  assert.equal((await f.req('/api/projects/alpha/sources',{user:'newcomer'})).status,404);
  assert.equal((await f.req('/api/projects',{method:'POST',user:'newcomer',body:{}})).status,403);
});
test('object authorization uses stored project, not a caller-supplied project ID',async t=>{
  const f=await fixture(t),revision=await f.draft('other','beta');
  assert.equal((await f.req(`/api/revisions/${revision.id}?projectId=alpha`,{user:'editor'})).status,404);
  assert.equal((await f.req(`/api/revisions/${revision.id}`,{method:'PUT',user:'editor',body:{...revision,projectId:'alpha',expectedVersion:1}})).status,404);
  assert.equal((await f.req('/api/projects/beta/audit',{user:'editor'})).status,404);
  assert.equal((await f.req('/api/projects/alpha/revisions',{method:'POST',user:'reviewer',body:{}})).status,403);
});
test('CSRF and foreign origins fail; security response headers are present',async t=>{
  const f=await fixture(t);
  assert.equal((await f.req('/api/logout',{method:'POST',csrf:false})).status,403);
  const result=await f.req('/api/projects',{method:'POST',csrf:false,headers:{Origin:'https://other.example','X-CSRF-Token':f.users.owner.csrf},body:{}});
  assert.equal(result.status,403);
  assert.equal((await f.req('/api/logout',{method:'POST',csrf:false,headers:{Origin:f.config.origin,'X-CSRF-Token':'é'.repeat(f.users.owner.csrf.length)}})).status,403);
  assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(result.headers.get('x-frame-options'),'DENY');
  assert.match(result.headers.get('content-security-policy'),/script-src 'self'/);
});
test('pending invitations grant nothing; only the named registered account can accept',async t=>{
  const f=await fixture(t);
  const created=await f.req('/api/projects/alpha/invitations',{method:'POST',body:{userId:'1005',role:'manager'}});
  assert.equal(created.status,201);
  assert.equal((await f.req('/api/projects/alpha',{user:'newcomer'})).status,404);
  assert.equal((await f.req(`/api/invitations/${created.data.id}/accept`,{method:'POST',user:'editor',body:{}})).status,404);
  assert.equal((await f.req(`/api/invitations/${created.data.id}/accept`,{method:'POST',user:'newcomer',body:{}})).status,200);
  assert.equal((await f.req('/api/projects/alpha',{user:'newcomer'})).data.role,'manager');
  assert.equal((await f.req(`/api/invitations/${created.data.id}/accept`,{method:'POST',user:'newcomer',body:{}})).status,409);
  assert.equal((await f.req('/api/projects/alpha/invitations',{method:'POST',user:'newcomer',body:{userId:'1002',role:'manager'}})).status,403);
});
test('expired and revoked invitations cannot grant access; live grants are checked after revoke',async t=>{
  const f=await fixture(t);
  const a=(await f.req('/api/projects/alpha/invitations',{method:'POST',body:{userId:'1005',role:'editor'}})).data;
  f.store.run('UPDATE invitations SET expiresAt=? WHERE id=?','2000-01-01T00:00:00Z',a.id);
  assert.equal((await f.req(`/api/invitations/${a.id}/accept`,{method:'POST',user:'newcomer',body:{}})).status,409);
  const b=(await f.req('/api/projects/alpha/invitations',{method:'POST',body:{userId:'1005',role:'manager'}})).data;
  await f.req(`/api/invitations/${b.id}`,{method:'DELETE'});
  assert.equal((await f.req(`/api/invitations/${b.id}/accept`,{method:'POST',user:'newcomer',body:{}})).status,409);
  const r=await f.draft();await f.req('/api/projects/alpha/members/1002',{method:'DELETE'});
  assert.equal((await f.req(`/api/revisions/${r.id}`,{user:'editor'})).status,404);
});
test('source editing, version conflicts, exact reviews and approval invalidation',async t=>{
  const f=await fixture(t),r=await f.draft();
  assert.equal((await f.req(`/api/revisions/${r.id}`,{method:'PUT',user:'editor',body:{expectedVersion:0,title:r.title,changes:r.changes}})).status,409);
  await f.req(`/api/revisions/${r.id}/submit`,{method:'POST',user:'editor',body:{expectedVersion:1}});
  const reviewed=await f.req(`/api/revisions/${r.id}/review`,{method:'POST',user:'reviewer',body:{expectedVersion:1,expectedHash:r.hash,verdict:'ready',notes:'Checked the supplied text; no mathematical certification.'}});
  assert.equal(reviewed.data.reviews[0].applicable,true);
  assert.equal((await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',user:'editor',body:{expectedVersion:1,expectedHash:r.hash}})).status,403);
  assert.equal((await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',body:{expectedVersion:1,expectedHash:'wrong'}})).status,409);
  assert.equal((await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',body:{expectedVersion:1,expectedHash:r.hash}})).data.status,'approved');
  const edited=await f.req(`/api/revisions/${r.id}`,{method:'PUT',user:'editor',body:{expectedVersion:1,title:'A changed title',changes:r.changes}});
  assert.equal(edited.data.version,2);assert.equal(edited.data.approval,null);assert.equal(edited.data.status,'draft');assert.equal(edited.data.reviews[0].applicable,false);
  const historical=await f.req(`/api/revisions/${r.id}?version=1`,{user:'editor'});assert.equal(historical.data.hash,r.hash);assert.equal(historical.data.title,r.title);
});
test('private revisions never reach GitHub before exact owner approval; retries are idempotent',async t=>{
  const f=await fixture(t),r=await f.draft(),op='publication-operation-123';
  const body={expectedVersion:1,expectedHash:r.hash,operationId:op};
  assert.equal((await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body})).status,409);assert.equal(f.repo.calls,0);
  await f.req(`/api/revisions/${r.id}/submit`,{method:'POST',user:'editor',body:{expectedVersion:1}});
  await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',body});
  const result=await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body});
  assert.equal(result.status,200);assert.equal(result.data.job.state,'submitted');assert.match(result.data.job.prUrl,/\/pull\/1$/);
  assert.equal((await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body})).status,200);assert.equal(f.repo.calls,1);
  assert.equal((await f.req(`/api/revisions/${r.id}`,{method:'PUT',body:{expectedVersion:1,title:r.title,changes:r.changes}})).status,409);
  assert.equal((await f.req(`/api/revisions/${r.id}`)).data.status,'pr_open');
});
test('uncertain external writes remain locked and reconcile through the original operation',async t=>{
  const f=await fixture(t),r=await f.draft();const body={expectedVersion:1,expectedHash:r.hash,operationId:'uncertain-operation-123'};
  await f.req(`/api/revisions/${r.id}/submit`,{method:'POST',user:'editor',body:{expectedVersion:1}});await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',body});f.repo.failOnce=true;
  const result=await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body});assert.equal(result.data.job.state,'uncertain');
  const publish=f.repo.publish.bind(f.repo);
  f.repo.publish=async()=>{throw Error('Reconciliation read failed before write callback');};
  const retry=await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body});
  assert.equal(retry.data.job.state,'uncertain');assert.equal((await f.req(`/api/revisions/${r.id}`)).data.status,'publishing');
  f.repo.publish=publish;
  assert.equal((await f.req(`/api/revisions/${r.id}`,{method:'PUT',body:{expectedVersion:1,title:r.title,changes:r.changes}})).status,409);
  assert.equal((await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body:{...body,operationId:'another-operation-123'}})).status,409);
  assert.equal((await f.req(`/api/revisions/${r.id}/publish`,{method:'POST',body})).data.job.state,'submitted');
});
test('API tokens are hashed, project-scoped, revocable and cannot approve or invite',async t=>{
  const f=await fixture(t),r=await f.draft();
  const created=await f.req('/api/tokens',{method:'POST',body:{name:'Local assistant',projectIds:['alpha'],write:true,days:3}});
  assert.equal(created.status,201);const token=created.data.token,tokenHeaders={Authorization:'Bearer '+token};
  assert.equal(f.store.get('SELECT hash FROM tokens WHERE id=?',created.data.id).hash,hash(token));
  assert.deepEqual((await f.req('/api/projects',{user:null,headers:tokenHeaders})).data.projects.map(p=>p.id),['alpha']);
  assert.equal((await f.req('/api/projects/beta',{user:null,headers:tokenHeaders})).status,404);
  assert.equal((await f.req(`/api/revisions/${r.id}/approve`,{method:'POST',user:null,headers:tokenHeaders,body:{expectedVersion:1,expectedHash:r.hash}})).status,403);
  assert.equal((await f.req('/api/projects/alpha/invitations',{method:'POST',user:null,headers:tokenHeaders,body:{userId:'1005',role:'manager'}})).status,403);
  assert.equal((await f.req('/api/invitations',{user:null,headers:tokenHeaders})).status,403);
  const list=await f.req('/api/tokens');assert.ok(!JSON.stringify(list.data).includes(token));
  await f.req(`/api/tokens/${created.data.id}`,{method:'DELETE'});assert.equal((await f.req('/api/projects',{user:null,headers:tokenHeaders})).status,401);
});
test('revoking a user grant also cuts off existing scoped API tokens',async t=>{
  const f=await fixture(t);
  const token=(await f.req('/api/tokens',{method:'POST',user:'editor',body:{name:'Assistant',projectIds:['alpha'],write:true,days:1}})).data.token;
  await f.req('/api/projects/alpha/members/1002',{method:'DELETE'});
  assert.equal((await f.req('/api/projects/alpha/sources',{user:null,headers:{Authorization:'Bearer '+token}})).status,404);
});
test('OAuth uses PKCE and a one-time browser-bound state, first login cannot become owner',async t=>{
  const calls=[];
  const f=await fixture(t,{oauthFetch:async(url,opts)=>{calls.push({url,opts});return new Response(JSON.stringify(url.endsWith('/user')?{id:98765,login:'new-account',name:'New visitor'}:{access_token:'identity-secret-only'}),{status:200,headers:{'Content-Type':'application/json'}});}});
  const start=await f.req('/auth/github',{user:null});assert.equal(start.status,303);
  const target=new URL(start.headers.get('location')),state=target.searchParams.get('state');
  assert.equal(target.searchParams.get('code_challenge_method'),'S256');assert.equal(target.searchParams.get('scope'),'read:user');
  assert.equal((await f.req(`/auth/github/callback?code=ok&state=${state}`,{user:null})).status,400);
  const complete=await f.req(`/auth/github/callback?code=ok&state=${state}`,{user:null,headers:{Cookie:`om_oauth=${state}`}});
  assert.equal(complete.status,303);assert.ok(calls[0].opts.body.get('code_verifier'));
  const sessionCookie=complete.headers.getSetCookie().find(c=>c.startsWith('om_session=')).split(';')[0];
  const context=await f.req('/api/context',{user:null,headers:{Cookie:sessionCookie}});
  assert.equal(context.data.user.id,'98765');assert.equal(context.data.isOwner,false);
  assert.equal(f.store.all('SELECT * FROM accounts').some(x=>JSON.stringify(x).includes('identity-secret-only')),false);
  assert.equal((await f.req(`/auth/github/callback?code=ok&state=${state}`,{user:null,headers:{Cookie:`om_oauth=${state}`}})).status,400);
});
test('logout and expiration invalidate sessions; numeric identity survives a login-name change',async t=>{
  const f=await fixture(t);f.store.account({id:'1001',login:'renamed-owner',name:'Owner'});
  assert.equal((await f.req('/api/context')).data.isOwner,true);
  await f.req('/api/logout',{method:'POST'});assert.equal((await f.req('/api/projects')).status,401);
  f.store.run('UPDATE sessions SET expires=0 WHERE userId=?','1002');assert.equal((await f.req('/api/projects',{user:'editor'})).status,401);
});
test('production configuration cannot enable public demo or put secrets under public roots',()=>{
  assert.throws(()=>readConfig({OWNER_GITHUB_ID:'1001',APP_ORIGIN:'http://example.com'}),/HTTPS/);
  assert.throws(()=>readConfig({OWNER_GITHUB_ID:'1001',NODE_ENV:'production',APP_ORIGIN:'http://127.0.0.1:8787'}),/HTTPS/);
  assert.throws(()=>readConfig({OPENMATH_DEMO:'true',APP_ORIGIN:'http://127.0.0.1:8787',HOST:'0.0.0.0',OPENMATH_DB:'/tmp/test.sqlite'}),/loopback/);
  assert.throws(()=>readConfig({OWNER_GITHUB_ID:'1001',OPENMATH_DB:'management/dist/secret.sqlite'}),/outside public/);
  assert.throws(()=>readConfig({APP_ORIGIN:'https://example.com'}),/OWNER_GITHUB_ID/);
  assert.match(cookie({secure:true},'om_session','opaque',30),/^__Host-om_session=opaque; Path=\/;.*HttpOnly; SameSite=Lax; Secure$/);
  assert.match(cookie({secure:true},'om_oauth','opaque',30,'/auth'),/^__Host-om_oauth=opaque; Path=\/;/);
});
