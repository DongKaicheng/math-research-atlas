import {hash, secret, equal} from './store.mjs';

export class HttpError extends Error {
  constructor(status,code,message) { super(message); this.status=status; this.code=code; }
}
export const fail = (status,code,message) => { throw new HttpError(status,code,message); };
export function cookies(req) {
  const result={};
  for(const part of (req.headers.cookie||'').split(';')) {
    const n=part.indexOf('='); if(n<0)continue;
    const name=part.slice(0,n).trim(); if(Object.hasOwn(result,name))continue;
    result[name]=part.slice(n+1).trim();
  }
  return result;
}
export const cookieName=(config,name)=>config.secure?'__Host-'+name:name;
export function cookie(config,name,value,maxAge,path='/') {
  return `${cookieName(config,name)}=${value}; Path=${config.secure?'/':path}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${config.secure?'; Secure':''}`;
}
export function identify(req,store,config) {
  const authorization=req.headers.authorization;
  if(authorization) {
    if(!authorization.startsWith('Bearer om_')) fail(401,'invalid_token','Invalid API token.');
    const row=store.get('SELECT id,userId,data FROM tokens WHERE hash=?',hash(authorization.slice(7)));
    if(!row) fail(401,'invalid_token','Invalid or revoked API token.');
    const scope=JSON.parse(row.data);
    if(Date.parse(scope.expiresAt)<=Date.now()) fail(401,'expired_token','This API token has expired.');
    const user=store.get('SELECT id,login,name FROM accounts WHERE id=?',row.userId);
    if(!user) fail(401,'invalid_token','Account not found.');
    return {user,credential:'token',tokenId:row.id,scope,isOwner:user.id===config.ownerId};
  }
  const value=cookies(req)[cookieName(config,'om_session')];
  if(!value) return null;
  const row=store.get('SELECT userId,csrf,expires FROM sessions WHERE hash=?',hash(value));
  if(!row || row.expires<=Date.now()) return null;
  const user=store.get('SELECT id,login,name FROM accounts WHERE id=?',row.userId);
  return user?{user,credential:'session',csrf:row.csrf,isOwner:user.id===config.ownerId}:null;
}
export function csrf(req,actor,config) {
  if(actor.credential==='token') {
    if(req.headers.origin && req.headers.origin!==config.origin) fail(403,'origin','Cross-origin API access is not enabled.');
    return;
  }
  if(req.headers.origin!==config.origin || !equal(req.headers['x-csrf-token'],actor.csrf))
    fail(403,'csrf','Your session could not authorize this request. Refresh the page and try again.');
}
export const requireUser = actor => { if(!actor) fail(401,'sign_in','Sign in with GitHub to continue.'); return actor; };
export function requireOwner(actor) {
  requireUser(actor);
  if(!actor.isOwner || actor.credential!=='session') fail(403,'owner_only','This action requires the site owner in a browser session.');
}
export function roleFor(store,actor,projectId) {
  requireUser(actor);
  if(actor.scope && !actor.scope.projectIds.includes(projectId)) return null;
  if(actor.isOwner) return 'owner';
  return store.get('SELECT role FROM grants WHERE userId=? AND projectId=?',actor.user.id,projectId)?.role||null;
}
export function requireProject(store,actor,projectId,action='read') {
  const project=store.project(projectId);
  const role=roleFor(store,actor,projectId);
  if(!project || !role) fail(404,'not_found','Project not found in your current access.');
  const allowed=action==='read' ? ['owner','manager','editor','reviewer'] :
    action==='edit' ? ['owner','manager','editor'] : ['owner','manager','reviewer'];
  if(!allowed.includes(role) || (action!=='read' && actor.scope && !actor.scope.write))
    fail(403,'permission','Your current project role does not allow this action.');
  return {...project,role};
}
export function requireRevision(store,actor,revisionId,action='read') {
  const revision=store.revision(revisionId);
  if(!revision) fail(404,'not_found','Revision not found in your current access.');
  const project=requireProject(store,actor,revision.projectId,action);
  return {revision,project};
}

export function authHandlers({store,config,fetchImpl=fetch}) {
  const redirects=(res,target,cookieValues=[])=>{
    res.writeHead(303,{Location:target,'Set-Cookie':cookieValues});res.end();
  };
  const sessionLogin=(res,user)=>{
    const session=store.session(user.id,config.sessionMs);
    store.audit(user.id,null,'account.login');
    redirects(res,'/',[cookie(config,'om_session',session.token,config.sessionMs/1000),cookie(config,'om_oauth','',0,'/auth')]);
  };
  return async (req,res,url)=>{
    if(url.pathname==='/auth/github' && req.method==='GET') {
      if(config.demo) { sessionLogin(res,store.account({id:config.ownerId,login:'demo-owner',name:'Demo owner'})); return true; }
      if(!config.clientId || !config.clientSecret) fail(503,'login_not_configured','GitHub login has not been configured by the operator.');
      const state=secret(),verifier=secret();
      store.run('DELETE FROM oauth WHERE expires<?',Date.now());
      store.run('DELETE FROM sessions WHERE expires<?',Date.now());
      if(store.get('SELECT count(*) AS count FROM oauth').count>=1000) fail(429,'rate_limit','Too many active sign-in requests. Try again shortly.');
      store.run('INSERT INTO oauth VALUES(?,?,?)',hash(state),verifier,Date.now()+10*60*1000);
      const target=new URL('https://github.com/login/oauth/authorize');
      target.search=new URLSearchParams({client_id:config.clientId,redirect_uri:config.origin+'/auth/github/callback',
        scope:'read:user',state,code_challenge:Buffer.from(hash(verifier),'hex').toString('base64url'),code_challenge_method:'S256'}).toString();
      redirects(res,target.href,[cookie(config,'om_oauth',state,600,'/auth')]); return true;
    }
    if(url.pathname==='/auth/github/callback' && req.method==='GET') {
      const state=url.searchParams.get('state'), saved=state&&store.get('SELECT verifier,expires FROM oauth WHERE hash=?',hash(state));
      if(!saved || saved.expires<=Date.now() || !equal(state,cookies(req)[cookieName(config,'om_oauth')])) fail(400,'oauth_state','Sign-in expired or did not match this browser. Start again.');
      store.run('DELETE FROM oauth WHERE hash=?',hash(state));
      if(url.searchParams.has('error')) {redirects(res,'/?auth=cancelled',[cookie(config,'om_oauth','',0,'/auth')]);return true;}
      const code=url.searchParams.get('code');
      if(!code || code.length>1000) fail(400,'oauth_code','Invalid sign-in response.');
      try {
        const response=await fetchImpl('https://github.com/login/oauth/access_token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),
          headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},
          body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,code,code_verifier:saved.verifier,redirect_uri:config.origin+'/auth/github/callback'})});
        if(!response.ok) throw Error('exchange');
        const token=await response.json(); if(typeof token.access_token!=='string')throw Error('exchange');
        const profileResponse=await fetchImpl('https://api.github.com/user',{redirect:'error',signal:AbortSignal.timeout(15000),
          headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token.access_token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'OpenMath-Independent'}});
        if(!profileResponse.ok)throw Error('profile');
        const profile=await profileResponse.json();
        if(!Number.isSafeInteger(profile.id) || profile.id<=0 || typeof profile.login!=='string')throw Error('profile');
        const user=store.account({id:String(profile.id),login:profile.login.slice(0,100),name:String(profile.name||profile.login).slice(0,200)});
        // Identity token is deliberately not persisted or used for publication.
        const previous=cookies(req)[cookieName(config,'om_session')]; if(previous)store.run('DELETE FROM sessions WHERE hash=?',hash(previous));
        sessionLogin(res,user); return true;
      } catch { fail(502,'oauth_failed','GitHub sign-in could not be completed. Start again; no management rights were granted.'); }
    }
    return false;
  };
}
