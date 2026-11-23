import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const managementRoot = fileURLToPath(new URL('../', import.meta.url));
export function readConfig(env = process.env) {
  const demo = env.OPENMATH_DEMO === 'true';
  const origin = new URL(env.APP_ORIGIN || 'http://127.0.0.1:8787');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password)
    throw Error('APP_ORIGIN must be an origin without a path or credentials.');
  const local = ['127.0.0.1', '[::1]', 'localhost'].includes(origin.hostname);
  if(env.NODE_ENV==='production' && origin.protocol!=='https:')throw Error('Production APP_ORIGIN must use HTTPS.');
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && local))
    throw Error('APP_ORIGIN must use HTTPS except on loopback.');
  const host = env.HOST || '127.0.0.1';
  if (demo && (!local || !['127.0.0.1', '::1'].includes(host) || !env.OPENMATH_DB))
    throw Error('Demo requires a loopback origin/bind and an explicit disposable OPENMATH_DB.');
  if (!demo && !/^\d+$/.test(env.OWNER_GITHUB_ID || ''))
    throw Error('Set OWNER_GITHUB_ID to the verified numeric GitHub owner ID.');
  if (demo && (env.GITHUB_PUBLICATION_TOKEN || env.GITHUB_CLIENT_SECRET))
    throw Error('Demo must not receive real GitHub credentials.');
  const repository = env.GITHUB_REPOSITORY || 'DongKaicheng/math-research-atlas';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw Error('Invalid repository.');
  const port = Number(env.PORT || origin.port || 8787);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT.');
  const dbPath = path.resolve(env.OPENMATH_DB || path.join(managementRoot, 'data/openmath.sqlite'));
  for (const publicPath of ['dist', 'web', '../dist', '../public', '../assets']) {
    const root = path.resolve(managementRoot, publicPath);
    if (dbPath === root || dbPath.startsWith(root + path.sep)) throw Error('Database must be outside public assets.');
  }
  return Object.freeze({
    origin: origin.origin, secure: origin.protocol === 'https:', host, port, demo, dbPath,
    ownerId: demo ? '1001' : env.OWNER_GITHUB_ID,
    clientId: env.GITHUB_CLIENT_ID || '', clientSecret: env.GITHUB_CLIENT_SECRET || '',
    repository, branch: env.GITHUB_BRANCH || 'main',
    publicationToken: env.GITHUB_PUBLICATION_TOKEN || '',
    publicOrigin: 'https://openmath-atlas.org',
    webRoot: path.join(managementRoot, 'dist'), sessionMs: 12 * 60 * 60 * 1000,
  });
}
