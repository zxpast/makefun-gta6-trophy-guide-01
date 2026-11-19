// Leonida Trophy Guide — the program that hands the guide in.
//
// The guide itself is the static files under app/: a tracker and cited
// step-by-step guides for all 55 GTA VI trophies, written for this entry.
// This file only carries those files (plus screenshots/) into the output
// folder and writes the dossier the judge reads, using the kit's vendored
// library. It runs on Node 22 with the standard library only, and it
// writes the same bytes every time it runs.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with any static server pointed at app/.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });
}

// The caps below mirror the scorer's own limits: at most 4 screenshots,
// none over 256 KiB, at most 993 files and 48 MiB under app/ — and the
// dossier text cap of 160 KiB the judge's outline is built from.
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
