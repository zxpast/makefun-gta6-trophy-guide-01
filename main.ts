// Leonida Trophy Guide — the entry program (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html opens in a
// desktop browser and works with the network off, its trophy list and guides
// live in app/data/trophies.json, and its roadmap in app/data/roadmap.json.
// This program hands the guide in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary
// the judge reads (the screenshots, the first load's files and bytes, and
// the source), using the vendored make.fun library. Leave
// vendor/makefun-frontend.ts untouched: the scorer requires dossier.json to
// be byte for byte what its own copy of the library writes.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR in place
// of /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files — app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(`Leonida Trophy Guide handed in to ${out}.`);
