import {DatabaseSync} from 'node:sqlite';
import {mkdirSync, chmodSync} from 'node:fs';
import path from 'node:path';
import {createHash, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export const id = () => randomUUID();
export const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const revisionHash = r => hash(JSON.stringify({projectId:r.projectId, baseRef:r.baseRef, title:r.title,
  changes:[...r.changes].sort((a,b)=>a.path.localeCompare(b.path)).map(({path,content,baseSha})=>({path,content,baseSha}))}));

export class Store {
  constructor(filename) {
    if (filename !== ':memory:') mkdirSync(path.dirname(filename), {recursive:true, mode:0o700});
    this.db = new DatabaseSync(filename);
    if (filename !== ':memory:') chmodSync(filename, 0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, login TEXT NOT NULL, name TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS oauth (hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS grants (userId TEXT NOT NULL REFERENCES accounts(id), projectId TEXT NOT NULL REFERENCES projects(id), role TEXT NOT NULL, PRIMARY KEY(userId, projectId));
      CREATE TABLE IF NOT EXISTS invitations (id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id), projectId TEXT NOT NULL REFERENCES projects(id), role TEXT NOT NULL, status TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY, projectId TEXT NOT NULL REFERENCES projects(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS versions (revisionId TEXT NOT NULL REFERENCES revisions(id), version INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(revisionId,version));
      CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, revisionId TEXT NOT NULL REFERENCES revisions(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, revisionId TEXT NOT NULL REFERENCES revisions(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS tokens (id TEXT PRIMARY KEY, hash TEXT NOT NULL UNIQUE, userId TEXT NOT NULL REFERENCES accounts(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, projectId TEXT, actorId TEXT NOT NULL, action TEXT NOT NULL, createdAt TEXT NOT NULL, detail TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS revision_project ON revisions(projectId);
      CREATE INDEX IF NOT EXISTS audit_project ON audit(projectId, createdAt);
    `);
  }
  get(sql, ...params) { return this.db.prepare(sql).get(...params); }
  all(sql, ...params) { return this.db.prepare(sql).all(...params); }
  run(sql, ...params) { return this.db.prepare(sql).run(...params); }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  project(projectId) { const row=this.get('SELECT data FROM projects WHERE id=?', projectId); return row&&JSON.parse(row.data); }
  revision(revisionId) { const row=this.get('SELECT data FROM revisions WHERE id=?', revisionId); return row&&JSON.parse(row.data); }
  saveRevision(r, snapshot = true) {
    this.run('INSERT INTO revisions(id,projectId,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',r.id,r.projectId,JSON.stringify(r));
    if(snapshot) this.run('INSERT INTO versions(revisionId,version,data) VALUES (?,?,?)',r.id,r.version,JSON.stringify(r));
  }
  audit(actorId,projectId,action,detail={}) {
    this.run('INSERT INTO audit VALUES(?,?,?,?,?,?)', id(),projectId||null,actorId,action,new Date().toISOString(),JSON.stringify(detail));
  }
  account(profile) {
    this.run('INSERT INTO accounts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login,name=excluded.name',
      String(profile.id),profile.login,profile.name||profile.login,new Date().toISOString());
    return this.get('SELECT id,login,name FROM accounts WHERE id=?',String(profile.id));
  }
  session(userId, ttl) {
    const token=secret(),csrf=secret();
    this.run('INSERT INTO sessions VALUES(?,?,?,?)',hash(token),userId,csrf,Date.now()+ttl);
    return {token,csrf};
  }
  close() { this.db.close(); }
}
