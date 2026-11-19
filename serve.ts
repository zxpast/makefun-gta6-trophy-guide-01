// A small static server for app/ (Node 22, standard library only), so the guide
// can be opened in a browser while you work on it, with no build step:
//   node serve.ts            -> http://localhost:8080
//   node serve.ts --port 8123
// It only serves files inside app/, on the loopback interface, and sends
// no-store so a refresh always shows the latest edit. A development aid only,
// not a server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(argv) {
  const flagAt = argv.indexOf('--port');
  const wanted = flagAt === -1 ? NaN : Number(argv[flagAt + 1]);
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}

function mimeFor(file) {
  const table = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  return table[extname(file).toLowerCase()] ?? 'application/octet-stream';
}

function resolveInside(requestPath) {
  const clean = requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
  const target = resolve(join(appRoot, normalize(clean)));
  return target === appRoot || target.startsWith(appRoot + sep) ? target : null;
}

const port = pickPort(process.argv.slice(2));

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  const target = resolveInside(pathname);
  if (target === null) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mimeFor(target),
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Leonida Trophy Guide at http://localhost:${port}`);
});
