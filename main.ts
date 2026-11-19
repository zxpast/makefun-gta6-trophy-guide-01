// Leonida Trophy Guide — entry program (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, style.css,
// app.js, data/*.json) that run offline in a browser. This program hands it
// in: it copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored make.fun
// library, exactly as the scorer rebuilds it. vendor/makefun-frontend.ts
// stays untouched. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the kit: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all.
// buildDossier refuses anything over those caps, so a bad build fails
// loudly here instead of silently shipping a broken dossier.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
