import {build} from 'esbuild';
import {cp, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = path.join(root, 'management', 'dist');
await rm(destination, {recursive: true, force: true});
await mkdir(destination, {recursive: true});
await build({entryPoints: [path.join(root, 'management/web/app.jsx')],
  outfile: path.join(destination, 'app.js'), bundle: true, minify: true,
  sourcemap: false, platform: 'browser', target: ['es2022'],
  define: {'process.env.NODE_ENV': '"production"'}, legalComments: 'none'});
await cp(path.join(root, 'management/web/index.html'), path.join(destination, 'index.html'));
await cp(path.join(root, 'assets/favicon.svg'), path.join(destination, 'favicon.svg'));
await cp(path.join(root, 'node_modules/katex/dist/katex.min.css'), path.join(destination, 'katex/katex.min.css'), {recursive: true});
await cp(path.join(root, 'node_modules/katex/dist/fonts'), path.join(destination, 'katex/fonts'), {recursive: true});
console.log('Built independent management interface in management/dist');
