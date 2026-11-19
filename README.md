# Leonida Trophy Guide — GTA VI, all 55 trophies

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zxpast/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zxpast/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline, open-source tracker and guide for all 55 Grand Theft Auto VI trophies on PlayStation 5. A checklist saved in the browser, a roadmap to the platinum, missable flags, and a guide to every trophy in our own words, with sources cited beside each one.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. No build step, no network: the app is static files in `app/`, and the trophy data lives in `app/data/trophies.json`.

## What is inside

- `app/index.html`, `app/style.css`, `app/app.js` — the guide: a card list with search, filters by grade, kind and status, a missable-only switch, and a spoiler setting that hides story trophies until you earn them; a three-stage roadmap; a detail view per trophy; progress saved in localStorage with export and import.
- `app/data/trophies.json` — the 55 trophies with their official names, descriptions and grades as PlayStation publishes them, plus our own guide text, cited sources, missable and story flags, and roadmap stage.
- `main.ts` — the entrypoint (Node 22, standard library only): stages `app/` and `screenshots/` under the output directory and writes `dossier.json` with the kit's vendored library.
- `screenshots/` — four real renders of the app running in Chromium.

## Sources

Names and descriptions are shown as PlayStation publishes them. Guide text is written for this page, in our own words, from the sources each trophy cites — never copied. Five trophies are marked *not yet confirmed*: the cited guide has not pinned down their trigger, and this page says so rather than guessing.

- The PlayStation 5 trophy list as listed by Exophase and PSNProfiles (18 Nov 2026).
- PowerPyx, [GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/).
- GTA Zone, [GTA 6 Trophy List](https://gta-zone.com/news/gta-6-trophies-achievements/).

This is an unofficial fan guide, not affiliated with Rockstar Games, Sony, or PlayStation. No Rockstar artwork is used.

## License

MIT — see [LICENSE](LICENSE).
