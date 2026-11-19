// Leonida Trophy Guide — tracker logic, written for this entry.
// Loads data/trophies.json, keeps earned trophies in localStorage, and renders
// the card list, the roadmap stages, and the per-trophy detail dialog. The page
// fetches nothing over the network: the JSON lives beside this file.
const STORE_KEY = 'leonida-guide-progress-v1';
const DATA_URL = 'data/trophies.json';

const els = {
  cards: document.getElementById('cards'),
  stages: document.getElementById('stages'),
  guideView: document.getElementById('guideView'),
  roadmapView: document.getElementById('roadmapView'),
  viewGuide: document.getElementById('viewGuide'),
  viewRoadmap: document.getElementById('viewRoadmap'),
  search: document.getElementById('search'),
  grade: document.getElementById('gradeFilter'),
  kind: document.getElementById('kindFilter'),
  status: document.getElementById('statusFilter'),
  missableOnly: document.getElementById('missableOnly'),
  spoilers: document.getElementById('spoilerToggle'),
  result: document.getElementById('resultLine'),
  ring: document.getElementById('ring'),
  earnedCount: document.getElementById('earnedCount'),
  platinumNote: document.getElementById('platinumNote'),
  dialog: document.getElementById('detailDialog'),
  detailBody: document.getElementById('detailBody'),
  dataDate: document.getElementById('dataDate'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  resetBtn: document.getElementById('resetBtn'),
};

let catalogue = null;
let earnedIds = new Set(readStoredIds());

function readStoredIds() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function persistProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

function trophyById(id) {
  return catalogue.trophies.find((t) => t.id === id);
}

function isHiddenBySpoilers(t) {
  return els.spoilers.checked && t.story && !earnedIds.has(t.id);
}

function visibleTrophies() {
  const needle = els.search.value.trim().toLowerCase();
  return catalogue.trophies.filter((t) => {
    if (isHiddenBySpoilers(t)) return false;
    if (els.grade.value !== 'all' && t.grade !== els.grade.value) return false;
    if (els.kind.value !== 'all' && t.kind !== els.kind.value) return false;
    if (els.status.value === 'earned' && !earnedIds.has(t.id)) return false;
    if (els.status.value === 'missing' && earnedIds.has(t.id)) return false;
    if (els.missableOnly.checked && !t.missable) return false;
    if (needle) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return { story: 'Story', 'side-quest': 'Side quest', activity: 'Activity',
    collectible: 'Collectible', robbery: 'Robbery', exploration: 'Exploration',
    completion: '100% completion', misc: 'Misc', platinum: 'Platinum' }[kind] ?? kind;
}

function badgeRow(t) {
  const bits = [`<span class="chip grade-${t.grade}">${gradeLabel(t.grade)}</span>`,
    `<span class="chip">${kindLabel(t.kind)}</span>`,
    `<span class="chip">Stage ${t.stage}</span>`];
  if (t.missable) bits.push('<span class="chip alert">Missable</span>');
  if (t.story) bits.push('<span class="chip story">Story</span>');
  return bits.join(' ');
}

function sourceLinks(t) {
  return (t.sources ?? []).map((s) => s.url
    ? `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`
    : `<span>${escapeHtml(s.name)}</span>`).join(' · ');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function paintList() {
  const shown = visibleTrophies();
  els.cards.replaceChildren();
  for (const t of shown) {
    const item = document.createElement('li');
    item.className = `card grade-${t.grade}${earnedIds.has(t.id) ? ' is-earned' : ''}`;
    item.innerHTML = `
      <label class="tick"><input type="checkbox" ${earnedIds.has(t.id) ? 'checked' : ''} aria-label="Mark ${escapeHtml(t.name)} earned"> <span>Earned</span></label>
      <div class="card-badges">${badgeRow(t)}</div>
      <h2><button type="button" class="card-title" data-open="${t.id}">${escapeHtml(t.name)}</button></h2>
      <p class="official">${escapeHtml(t.description)}</p>
      <p class="guide">${escapeHtml(t.guide)}</p>
      <p class="sources">Sources: ${sourceLinks(t)}</p>`;
    item.querySelector('input').addEventListener('change', (event) => {
      if (event.target.checked) earnedIds.add(t.id);
      else earnedIds.delete(t.id);
      persistProgress();
      paintList();
      paintScoreboard();
    });
    item.querySelector('[data-open]').addEventListener('click', () => openDetail(t.id));
    els.cards.append(item);
  }
  const hiddenCount = catalogue.trophies.filter(isHiddenBySpoilers).length;
  els.result.textContent = hiddenCount > 0
    ? `Showing ${shown.length} of ${catalogue.trophies.length} trophies — ${hiddenCount} story trophies hidden by the spoiler setting (earn one to reveal it, or switch the setting off).`
    : `Showing ${shown.length} of ${catalogue.trophies.length} trophies.`;
}

function paintScoreboard() {
  const total = catalogue.trophies.length;
  const got = earnedIds.size;
  els.earnedCount.textContent = String(got);
  els.ring.style.setProperty('--fill', `${Math.round((got / total) * 100)}%`);
  els.ring.setAttribute('aria-label', `${got} of ${total} trophies earned`);
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const inGrade = catalogue.trophies.filter((t) => t.grade === grade);
    const gotGrade = inGrade.filter((t) => earnedIds.has(t.id)).length;
    document.getElementById(`count${gradeLabel(grade)}`).textContent = `${gotGrade} / ${inGrade.length}`;
  }
  els.platinumNote.textContent = got === total
    ? 'Platinum earned — you are a Leonida Legend.'
    : got === total - 1
      ? 'One trophy left, then the platinum.'
      : `Earn the other ${total - got - 1} to take the platinum.`;
}

function paintRoadmap() {
  els.stages.replaceChildren();
  for (const stage of catalogue.roadmap) {
    const item = document.createElement('li');
    item.className = 'stage';
    const chips = stage.trophies.map((id) => {
      const t = trophyById(id);
      const locked = isHiddenBySpoilers(t);
      return `<li><button type="button" class="stage-chip" data-open="${t.id}" ${locked ? 'disabled' : ''}>${locked ? 'Story trophy (hidden)' : escapeHtml(t.name)}</button></li>`;
    }).join('');
    item.innerHTML = `
      <h2>Stage ${stage.stage} — ${escapeHtml(stage.title)}</h2>
      <p>${escapeHtml(stage.note)}</p>
      <ol class="stage-chips">${chips}</ol>`;
    item.querySelectorAll('[data-open]').forEach((button) =>
      button.addEventListener('click', () => openDetail(Number(button.dataset.open))));
    els.stages.append(item);
  }
}

function openDetail(id) {
  const t = trophyById(id);
  if (!t) return;
  els.detailBody.innerHTML = `
    <div class="card-badges">${badgeRow(t)}</div>
    <h2>${escapeHtml(t.name)}</h2>
    <p class="official">${escapeHtml(t.description)}</p>
    <p class="guide">${escapeHtml(t.guide)}</p>
    <p class="sources">Sources: ${sourceLinks(t)}</p>
    <label class="tick"><input type="checkbox" id="detailEarned" ${earnedIds.has(t.id) ? 'checked' : ''}> Mark as earned</label>`;
  els.detailBody.querySelector('#detailEarned').addEventListener('change', (event) => {
    if (event.target.checked) earnedIds.add(t.id);
    else earnedIds.delete(t.id);
    persistProgress();
    paintList();
    paintScoreboard();
  });
  els.dialog.showModal();
}

function switchView(which) {
  const toRoadmap = which === 'roadmap';
  els.guideView.hidden = toRoadmap;
  els.roadmapView.hidden = !toRoadmap;
  els.result.hidden = toRoadmap;
  els.viewGuide.classList.toggle('active', !toRoadmap);
  els.viewRoadmap.classList.toggle('active', toRoadmap);
  els.viewGuide.setAttribute('aria-pressed', String(!toRoadmap));
  els.viewRoadmap.setAttribute('aria-pressed', String(toRoadmap));
  if (toRoadmap) paintRoadmap();
  const params = new URLSearchParams(location.search);
  params.set('view', which);
  history.replaceState(null, '', `${location.pathname}?${params}`);
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('grade')) els.grade.value = params.get('grade');
  if (params.get('kind')) els.kind.value = params.get('kind');
  if (params.get('q')) els.search.value = params.get('q');
  if (params.get('spoilers') === 'off') els.spoilers.checked = false;
  if (params.get('view') === 'roadmap') switchView('roadmap');
  return params.get('trophy');
}

function wireToolbar() {
  for (const control of [els.search, els.grade, els.kind, els.status, els.missableOnly, els.spoilers]) {
    control.addEventListener('input', () => { paintList(); });
  }
  els.viewGuide.addEventListener('click', () => switchView('guide'));
  els.viewRoadmap.addEventListener('click', () => switchView('roadmap'));
  els.exportBtn.addEventListener('click', () => {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), earned: [...earnedIds].sort((a, b) => a - b) }, null, 2);
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    anchor.download = 'leonida-trophy-progress.json';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  });
  els.importFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      const known = new Set(catalogue.trophies.map((t) => t.id));
      earnedIds = new Set((Array.isArray(ids) ? ids : []).filter((n) => known.has(n)));
      persistProgress();
      paintList();
      paintScoreboard();
    } catch {
      els.result.textContent = 'That file could not be read as progress — nothing changed.';
    }
    event.target.value = '';
  });
  els.resetBtn.addEventListener('click', () => {
    if (!window.confirm('Clear every earned tick? Export first if you want a copy.')) return;
    earnedIds = new Set();
    persistProgress();
    paintList();
    paintScoreboard();
  });
}

catalogue = await (await fetch(DATA_URL)).json();
els.dataDate.textContent = catalogue.list;
const openOnLoad = applyQueryParams();
wireToolbar();
paintList();
paintScoreboard();
if (openOnLoad) openDetail(Number(openOnLoad));
