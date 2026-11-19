// Leonida Trophy Guide — boot and rendering. Loads the official trophy list
// from data/trophies.json (a file of this app, fetched from its own server),
// then draws the checklist, the guide pane, the roadmap and the missables
// from that one list, so the page can never disagree with its own data.

import {
  STORAGE_KEY,
  loadProgress,
  saveProgress,
  toggleEarned,
  setSpoiler,
  countEarned,
  downloadExport,
  parseImport,
  resetProgress,
} from './store.js';
import {
  KIND_LABELS,
  visibleTrophies,
  isSpoilerHidden,
  displayName,
  displayDescription,
  targetLabel,
} from './filters.js';

// The five roadmap stages, in the order a player should take them. Each
// stage's trophies come from the data file's own stage numbers.
const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story — Chapters 1 and 2', blurb: 'Start with the opening mission, the first two chapters and the first named missions. Nothing here needs a detour: just play the story.' },
  { stage: 2, title: 'Chapters 3 and 4, side strands and choices', blurb: 'Finish the last two chapters, then work the stranger strands and the final missions for Andy, Kenton, Billy, Randy and Tyrone. Save before the flagged missions and before big choices.' },
  { stage: 3, title: 'Activities, races and skills', blurb: 'The grind stage: stunts, races, the shooting range, drone races, fishing, bowling, meditation and the partner robberies. Most of these count up while you play.' },
  { stage: 4, title: 'Collectibles, exploration and money', blurb: 'Cards, WAiNK It spots, vehicles, areas, garages, bank vaults and the money trophies. Sweep the map in this stage, when fast travel and cash are at their best.' },
  { stage: 5, title: 'Finale, 100% and the platinum', blurb: 'Play the final mission, sweep whatever the 100% counter still shows as missing, and the platinum pops with the last trophy.' },
];

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

let trophies = [];
let state = loadProgress();
let kind = 'all';
let query = '';
let selectedId = null;

const $ = (id) => document.getElementById(id);

// Escape text before it goes into innerHTML. The data is this app's own, but
// a name with an apostrophe or an ellipsis must still render as text.
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function gradeBadge(grade) {
  return `<span class="grade ${escapeHtml(grade)}">${escapeHtml(grade)}</span>`;
}

function trophyTags(trophy) {
  const parts = [gradeBadge(trophy.grade)];
  parts.push(`<span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>`);
  if (trophy.missable) parts.push('<span class="tag missable">Missable</span>');
  const target = targetLabel(trophy);
  if (target) parts.push(`<span class="tag target">${escapeHtml(target)}</span>`);
  return parts.join(' ');
}

// The header counters: earned of 55, per grade and per kind.
function renderProgress() {
  const earned = countEarned(trophies, state);
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = `${Math.round((earned / 55) * 100)}%`;
  $('progressBar').setAttribute('aria-valuenow', String(earned));
  $('gradeCounts').textContent = GRADE_ORDER.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && state.earned[t.id]).length;
    return `${g[0].toUpperCase()}${g.slice(1)} ${got}/${total}`;
  }).join(' · ');
  $('kindCounts').textContent = ['story', 'collectibles', 'activities'].map((k) => {
    const total = trophies.filter((t) => t.kind === k).length;
    const got = trophies.filter((t) => t.kind === k && state.earned[t.id]).length;
    return `${KIND_LABELS[k]} ${got}/${total}`;
  }).join(' · ') + ` · Missable ${trophies.filter((t) => t.missable && state.earned[t.id]).length}/${trophies.filter((t) => t.missable).length}`;
}

// The checklist rows for the current filter and search.
function renderChecklist() {
  const list = $('trophyList');
  const visible = visibleTrophies(trophies, kind, query);
  $('showingLine').textContent = `Showing ${visible.length} of 55 trophies — ${countEarned(visible, state)} earned in this view.`;
  list.innerHTML = visible.map((t) => {
    const earned = Boolean(state.earned[t.id]);
    const hidden = isSpoilerHidden(t, state);
    return `<li class="trophy-row${earned ? ' earned' : ''}${selectedId === t.id ? ' selected' : ''}" data-id="${t.id}">
      <input type="checkbox" ${earned ? 'checked' : ''} aria-label="Earned: ${escapeHtml(displayName(t, state))}">
      <span class="trophy-name">${escapeHtml(displayName(t, state))}</span>
      ${hidden ? '' : `<span class="trophy-meta">${trophyTags(t)}</span>`}
      <span class="trophy-desc">${escapeHtml(displayDescription(t, state))}</span>
    </li>`;
  }).join('');
}

// The guide pane beside the checklist: guide plus its sources.
function renderDetail() {
  const pane = $('detailPane');
  const trophy = trophies.find((t) => t.id === selectedId);
  if (!trophy) {
    pane.innerHTML = '<h2>Guide</h2><p class="detail-empty">Pick a trophy from the checklist to see its guide and its sources here.</p>';
    return;
  }
  const earned = Boolean(state.earned[trophy.id]);
  const hidden = isSpoilerHidden(trophy, state);
  const sources = trophy.sources.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  pane.innerHTML = `<h2>Guide</h2>
    <p class="trophy-name">${escapeHtml(displayName(trophy, state))}</p>
    ${hidden ? '<p class="trophy-desc spoiler-hidden">Story trophy — earn it to reveal its name, description and guide.</p>' : `${trophyTags(trophy)}<p class="trophy-desc">${escapeHtml(trophy.description)}</p>`}
    ${hidden ? '' : `<h3>How to earn it</h3><p class="guide-text">${escapeHtml(trophy.guide)}</p>
    ${trophy.missable && trophy.missableNote ? `<p class="missable-note">Missable: ${escapeHtml(trophy.missableNote)}</p>` : ''}
    <h3>Sources</h3><ul>${sources}</ul>`}
    <label class="earn-line"><input type="checkbox" id="detailEarned" ${earned ? 'checked' : ''}> Earned</label>`;
  $('detailEarned').addEventListener('change', () => {
    state = toggleEarned(state, trophy.id);
    renderAll();
  });
}

// The roadmap: the same trophies, grouped by their stage number.
function renderRoadmap() {
  $('roadmapStages').innerHTML = ROADMAP_STAGES.map(({ stage, title, blurb }) => {
    const items = trophies.filter((t) => t.stage === stage);
    const rows = items.map((t) => {
      const mark = state.earned[t.id] ? ' <span class="done">✓ earned</span>' : '';
      return `<li>${escapeHtml(displayName(t, state))} — ${escapeHtml(displayDescription(t, state))}${mark}</li>`;
    }).join('');
    return `<li><h3>${escapeHtml(title)}</h3><p>${escapeHtml(blurb)}</p><ul>${rows}</ul></li>`;
  }).join('');
}

// The missables section: every flagged trophy with its note.
function renderMissables() {
  const flagged = trophies.filter((t) => t.missable);
  $('missableList').innerHTML = flagged.map((t) => {
    const mark = state.earned[t.id] ? ' <span class="done">✓ earned</span>' : '';
    return `<li><span class="trophy-name">${escapeHtml(displayName(t, state))}</span>${mark}
      <p>${escapeHtml(t.missableNote || t.description)}</p></li>`;
  }).join('');
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

// Wire the toolbar once the data is in.
function wireControls() {
  $('kindFilters').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    kind = button.dataset.kind;
    document.querySelectorAll('#kindFilters button').forEach((b) => b.classList.toggle('active', b === button));
    renderChecklist();
  });
  $('searchInput').addEventListener('input', (event) => {
    query = event.target.value;
    renderChecklist();
  });
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle').addEventListener('change', (event) => {
    state = setSpoiler(state, event.target.checked);
    renderAll();
  });
  $('exportBtn').addEventListener('click', () => downloadExport(state));
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const imported = parseImport(await file.text());
    if (imported) {
      state = imported;
      saveProgress(state);
      $('spoilerToggle').checked = state.spoiler;
      renderAll();
    } else {
      alert('That file is not a Leonida Trophy Guide progress export.');
    }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and the spoiler setting?')) {
      state = resetProgress();
      selectedId = null;
      $('spoilerToggle').checked = false;
      renderAll();
    }
  });
  // Clicking a row selects it; the checkbox inside toggles earned.
  $('trophyList').addEventListener('click', (event) => {
    const row = event.target.closest('.trophy-row');
    if (!row) return;
    const id = Number(row.dataset.id);
    if (event.target.matches('input[type="checkbox"]')) {
      state = toggleEarned(state, id);
      renderAll();
      return;
    }
    selectedId = id;
    renderChecklist();
    renderDetail();
  });
}

// Boot: fetch the list from this app's own files, then draw everything.
async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  trophies = data.trophies.slice().sort((a, b) => a.id - b.id);
  wireControls();
  renderAll();
  // Keep the storage key visible to the dossier's outline: it is the only
  // browser storage this guide uses, and it never leaves the device.
  void STORAGE_KEY;
}

boot();
