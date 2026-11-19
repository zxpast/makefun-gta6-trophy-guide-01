# Leonida Trophy Guide — GTA VI Platinum Roadmap

[![make.fun competition](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-orange)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank zxpast/makefun-gta6-trophy-guide-01](https://img.shields.io/badge/rank-zxpast%2Fmakefun--gta6--trophy--guide--01-blue)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward $250](https://img.shields.io/badge/reward-%24250-green)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 official PlayStation 5 trophies** of Grand Theft Auto VI — built for the [make.fun competition gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) ($250: 1st $50, 2nd $30, 3rd $15, 4th–10th $5, 11th–50th $3).

## What it is

A static web app that opens in a desktop browser and works with the network off. No build step, no libraries, no network requests at run time — every file it loads lives under `app/`.

- **Tracker** — a checklist of all 55 trophies with their official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned). Progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Filters** — by kind (story, missable, collectibles, activities, side strands, crime, world, money, moments), by grade, by search text, and earned-only.
- **Spoiler setting** — hides the names and descriptions of unearned story trophies until they are earned.
- **Roadmap to the platinum** — seven stages built from the official descriptions: story, side strands, activities, collectibles and exploration, crime, money and loose ends, then 100% completion and the platinum.
- **Missables** — the 8 trophies with a one-time setup, each flagged with why it can be missed. Chapter and mission trophies are not missable: missions can be replayed.
- **Guides with sources** — a guide to every trophy in our own words, each naming its sources beside it. Names, descriptions and grades are shown exactly as PlayStation publishes them.

## Sources

- Exophase — the official trophy list (names, descriptions, grades)
- PSNProfiles — the official trophy list and PSN progress targets (for example 42 Shooting Range challenges, 250 stunts, 18 meditation spots, 52 areas)
- Our own advice, drawn from each trophy's official description

Where a place is not pinned down by the official description, the guide says so instead of inventing one.

## Screenshots

Four real renders of the running app, taken in headless Chromium at 1280×720:

| File | View |
| --- | --- |
| `screenshots/1-cover.jpg` | Checklist with a trophy guide open, progress and filters visible |
| `screenshots/2-roadmap.jpg` | Roadmap to the platinum |
| `screenshots/3-missable.jpg` | Missable trophies, all 8 flagged with why each can be missed |
| `screenshots/4-detail.jpg` | A missable trophy's guide open with the spoiler setting on (story names hidden until earned) |

## Run it

Serve `app/` with any static file server and open `index.html`, for example:

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080. Everything works offline.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit).

## Layout

| Path | What it is |
| --- | --- |
| `app/index.html` | Page shell: header, progress bar, tabs, filters, views |
| `app/style.css` | Paper theme, coral accent, no web fonts |
| `app/js/main.js` | Boot, state, hash routing, save controls |
| `app/js/store.js` | localStorage progress, export / import, spoiler setting |
| `app/js/filters.js` | Kind, grade, search, earned-only, spoiler rule |
| `app/js/views.js` | Checklist rows, guide detail pane, roadmap, progress |
| `app/data/trophies.json` | The 55 official trophies with guides and sources |
| `app/data/roadmap.json` | The seven roadmap stages and tips |
| `screenshots/` | Four real renders of the running app |
| `main.ts` | The entry program that hands the guide in |
| `LICENSE` | MIT |

## Notes

- Unofficial, fan-made guide. Grand Theft Auto and GTA are trademarks of Rockstar Games; this guide uses no Rockstar logo, artwork or game screenshots.
- No online trophies: the official list holds no online trophy.

---

Built for [make.fun — gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). Referral code: `6hmpy1rq`
