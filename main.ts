// Leonida Trophy Guide — the hand-in program (Node 22, standard library
// only). It takes the guide as it sits in this repository — the static app/
// folder and the screenshots/ folder — and lays out a clean copy in the
// output directory, then asks the vendored make.fun library to write the
// dossier.json the judge reads. Nothing is built, bundled or fetched: the
// app is plain files, so handing it in is copying it.
//
// Run it from the repository root. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output, so a local check looks like:
//   mkdir -p /tmp/trophy-out && MAKEFUN_OUTPUT_DIR=/tmp/trophy-out node main.ts
// Run it twice into two fresh directories and the two trees must match byte
// for byte — the program writes no timestamps and keeps no state.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader gives us /output; locally the environment variable overrides it.
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from an empty hand-in directory so a second run can never inherit
// stale files from a first one. That is what makes two runs identical.
if (existsSync(handInDir)) rmSync(handInDir, { recursive: true, force: true });
mkdirSync(handInDir, { recursive: true });

// The guide itself, then its screenshots. Both are copied whole, as they are.
cpSync(join(repoRoot, 'app'), join(handInDir, 'app'), { recursive: true });
mkdirSync(join(handInDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(handInDir, 'screenshots'), { recursive: true });
}

// The dossier carries the same limits the gate checks the entry against:
// at most 160 KiB of source text, at most 4 screenshots of at most 256 KiB,
// and app/ inside its 993-file, 48 MiB ceiling. The library refuses an
// entry past those limits instead of writing a dossier the gate would reject.
const dossierText = buildDossier(handInDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(handInDir, 'dossier.json'), dossierText);

console.log(`Leonida Trophy Guide handed in to ${handInDir}`);
