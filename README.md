# Leonida Trophy Guide — GTA VI, all 55 trophies

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zxpast/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zxpast/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every official name, description and grade, a guide to each in our own words that cites its sources, a roadmap to the platinum, every missable trophy flagged, and a checklist that saves your progress in the browser.

## What it is

- **The full official list** — 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with their official names, descriptions and grades, in `app/data/trophies.json`.
- **A guide per trophy** — what to do, where, and when it can be missed, written for this guide in our own words. Each guide names its sources: the official list on Exophase for name, description and grade, PSNProfiles for the PSN progress count where the list tracks one, and our own advice from the official description where nothing else pins a step down. Where the official description does not pin down a place or step, the guide says so plainly instead of inventing one. Nothing here was checked in the game yet.
- **A tracker** — tick trophies off as you earn them; progress is saved in localStorage, exportable to a file and importable back. Filters by kind (story, missable, collectibles, activities), a search box, and a spoiler setting that hides story trophies' names, descriptions and guides until they are earned.
- **A roadmap to the platinum** — five stages built only from the official descriptions: story chapters and named missions first, then side strands, activities, collectibles, and the finale with 100% completion.
- **Missables flagged** — 13 trophies tied to a named mission, a final mission for a named contact, or a one-time moment. The guide recommends a manual save before each one, because nothing in the official list promises a replay.

## How to run it offline

No build step, no install, no network at run time. Serve the `app/` folder with any static file server and open `index.html`:

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

Or with Node, from the repository root, using any static server pointed at `app/`. Everything the page loads is a file under `app/`; it fetches nothing remote. Your progress never leaves your browser except through the export file you choose to save.

## How it is handed in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Running it twice produces byte-identical output.

## Sources

- Exophase — GTA VI trophy list: https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — GTA VI trophies: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi

An unofficial fan guide. Not affiliated with Rockstar Games or PlayStation. No logos, official artwork or game images are used.
