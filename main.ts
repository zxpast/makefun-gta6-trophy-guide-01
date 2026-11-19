// Leonida Trophy Guide — the entrypoint (Node 22, standard library only).
//
// The guide itself is app/: static files a browser opens at app/index.html
// (an ES module, a stylesheet, and the trophy data at app/data/trophies.json),
// offline — nothing in the app is fetched over the network. This program hands
// the guide in: it stages app/ and screenshots/ under the output directory and
// writes dossier.json there with the kit's vendored library, the scorer's own
// copy, so the dossier is byte for byte what the scorer writes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader's container, /output is used when the variable is unset.
// Serve the guide while you work on it with `node serve.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function stageFolder(name) {
  const from = join(entryRoot, name);
  if (!existsSync(from)) return;
  mkdirSync(join(destination, name), { recursive: true });
  cpSync(from, join(destination, name), { recursive: true });
}

function publishGuide() {
  mkdirSync(destination, { recursive: true });
  stageFolder('app');
  stageFolder('screenshots');
  const dossier = buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(destination, 'dossier.json'), dossier);
  return destination;
}

const stagedAt = publishGuide();
console.log(`guide staged at ${stagedAt}`);
