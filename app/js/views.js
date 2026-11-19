// Views: the checklist rows, the guide detail pane, the roadmap stages and
// the missables list. All rendering is plain DOM, no framework, so the first
// load stays small and the app works with the network off.
import { isSpoiled, kindLabel } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function badge(text, extraClass) {
  return el('span', `badge${extraClass ? ` ${extraClass}` : ''}`, text);
}

// A count badge for trophies PSN tracks a number for (42 challenges, 250 stunts…).
function countBadge(trophy) {
  if (!trophy.count) return null;
  const label = trophy.count >= 1000 ? `$${trophy.count.toLocaleString('en-US')}` : `${trophy.count}×`;
  return badge(`PSN target: ${label}`, 'count');
}

// One checklist row: checkbox, official name and description, grade and kind
// badges, a missable flag, and the PSN target where the list tracks one.
// With spoilers on, an unearned story trophy shows a hidden placeholder instead.
export function trophyRow(trophy, state, handlers) {
  const { earned, spoilerOn, selectedId } = state;
  const li = el('li', 'trophy');
  if (earned.has(trophy.id)) li.classList.add('is-earned');
  if (selectedId === trophy.id) li.classList.add('is-selected');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Earned: ${trophy.name}`);
  box.addEventListener('change', () => handlers.onToggle(trophy.id, box.checked));
  box.addEventListener('click', (event) => event.stopPropagation());
  li.append(box);

  const body = el('div', 'trophy-body');
  const spoiled = isSpoiled(trophy, spoilerOn, earned);
  body.append(el('div', 'trophy-name', spoiled ? 'Hidden story trophy — earn it to reveal' : trophy.name));
  body.append(el('div', 'trophy-desc', spoiled ? 'Its name and description stay hidden until earned.' : trophy.description));
  const meta = el('div', 'trophy-meta');
  meta.append(badge(trophy.grade, `grade-${trophy.grade}`));
  meta.append(badge(kindLabel(trophy.kind)));
  if (trophy.missable) meta.append(badge('Missable', 'missable'));
  const target = countBadge(trophy);
  if (target) meta.append(target);
  body.append(meta);
  li.append(body);
  li.addEventListener('click', () => handlers.onSelect(trophy.id));
  return li;
}

// Render the filtered checklist into the list element.
export function renderChecklist(listEl, trophies, state, handlers) {
  listEl.replaceChildren();
  for (const trophy of trophies) listEl.append(trophyRow(trophy, state, handlers));
}

// The detail pane: the selected trophy's official name, description and
// grade, its guide in our own words, the missable note where one applies,
// and the sources beside the guide so a reader sees where each fact came from.
export function renderDetail(detailEl, trophy, state) {
  detailEl.replaceChildren();
  if (!trophy) {
    detailEl.append(el('p', 'empty', 'Select a trophy on the left to read its guide, its sources, and when it can be missed.'));
    return;
  }
  const { earned, spoilerOn } = state;
  const spoiled = isSpoiled(trophy, spoilerOn, earned);
  detailEl.append(el('h2', null, spoiled ? 'Hidden story trophy' : trophy.name));
  detailEl.append(el('p', 'official', spoiled
    ? 'Official name and description hidden until earned (spoiler setting on).'
    : `Official description: ${trophy.description}`));
  const meta = el('div', 'trophy-meta');
  meta.append(badge(trophy.grade, `grade-${trophy.grade}`));
  meta.append(badge(kindLabel(trophy.kind)));
  if (trophy.missable) meta.append(badge('Missable', 'missable'));
  const target = countBadge(trophy);
  if (target) meta.append(target);
  detailEl.append(meta);
  if (earned.has(trophy.id)) detailEl.append(el('p', 'earned-line', '✓ Earned — ticked in your tracker.'));
  if (trophy.missable && trophy.missableNote) {
    detailEl.append(el('h3', null, 'Why it can be missed'));
    detailEl.append(el('p', 'missable-note', trophy.missableNote));
  }
  detailEl.append(el('h3', null, 'Guide'));
  detailEl.append(el('p', null, trophy.guide));
  detailEl.append(el('h3', null, 'Sources'));
  const sources = el('ul', 'sources');
  for (const source of trophy.sources ?? []) sources.append(el('li', null, source));
  if (!trophy.sources || trophy.sources.length === 0) {
    sources.append(el('li', null, 'Official trophy list (Exophase / PSNProfiles).'));
  }
  detailEl.append(sources);
}

// One roadmap stage: its title, its goal, its per-stage progress, and the
// trophies in it with earned ones struck through.
export function renderRoadmap(listEl, roadmap, trophiesById, earned) {
  listEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = el('li', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, stage.title));
    const done = stage.ids.filter((id) => earned.has(id)).length;
    head.append(el('span', 'stage-progress', `${done} / ${stage.ids.length} done`));
    li.append(head);
    li.append(el('p', null, stage.goal));
    const names = el('ul');
    for (const id of stage.ids) {
      const trophy = trophiesById.get(id);
      if (!trophy) continue;
      const item = el('li', earned.has(id) ? 'is-earned' : null,
        `${earned.has(id) ? '✓ ' : ''}${trophy.name} — ${trophy.grade}`);
      names.append(item);
    }
    li.append(names);
    listEl.append(li);
  }
}

// The roadmap's tips list, from the roadmap data file.
export function renderRoadmapTips(listEl, roadmap) {
  listEl.replaceChildren();
  for (const tip of roadmap.tips ?? []) listEl.append(el('li', null, tip));
}

// The header progress bar and counts.
export function renderProgress({ fillEl, countEl, pctEl, missableEl, gradesEl }, trophies, earned) {
  const pct = Math.round((earned.size / trophies.length) * 100);
  fillEl.style.width = `${pct}%`;
  countEl.textContent = `${earned.size} of ${trophies.length} earned`;
  pctEl.textContent = `${pct}% to platinum`;
  const missableDone = trophies.filter((t) => t.missable && earned.has(t.id)).length;
  const missableTotal = trophies.filter((t) => t.missable).length;
  missableEl.textContent = `Missables: ${missableDone} / ${missableTotal} caught`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const done = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    return `${grade} ${done}/${total}`;
  });
  gradesEl.textContent = parts.join(' · ');
}
