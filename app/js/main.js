// Boot: fetch the trophy list and roadmap, wire the filters, tabs, detail
// pane and save buttons, and keep every view in step with one shared state.
// Views are hash-routed so a screenshot link can open a view directly:
// #roadmap, #missables, #about, or #trophy-<id> for a trophy's guide.
import { loadEarned, saveEarned, loadSpoiler, saveSpoiler, parseImportedProgress, buildExportPayload, downloadTextFile, progressSummary } from './store.js';
import { trophyMatches, gradeProgress, countVisible } from './filters.js';
import { renderChecklist, renderDetail, renderRoadmap, renderRoadmapTips, renderProgress } from './views.js';

const $ = (id) => document.getElementById(id);
const trophyListEl = $('trophyList');
const detailEl = $('detail');
const listHintEl = $('listHint');

const doc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = doc.trophies;
const trophiesById = new Map(trophies.map((t) => [t.id, t]));
const validIds = new Set(trophies.map((t) => t.id));

const state = {
  earned: loadEarned(),
  spoilerOn: loadSpoiler(),
  filters: { kind: 'all', grade: 'all', search: '', earnedOnly: false },
  selectedId: null,
};

function visibleTrophies() {
  return trophies.filter((t) => trophyMatches(t, state.filters, state.earned));
}

function renderAll() {
  const visible = visibleTrophies();
  renderChecklist(trophyListEl, visible, state, {
    onToggle: (id, checked) => {
      if (checked) state.earned.add(id);
      else state.earned.delete(id);
      saveEarned(state.earned);
      renderAll();
    },
    onSelect: (id) => {
      state.selectedId = id;
      renderAll();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
  });
  renderDetail(detailEl, trophiesById.get(state.selectedId) ?? null, state);
  listHintEl.textContent = `Showing ${visible.length} of ${trophies.length} trophies` +
    (state.spoilerOn ? ' — story spoilers hidden until earned.' : '.');
  renderProgress(
    { fillEl: $('progressFill'), countEl: $('progressCount'), pctEl: $('progressPct'), missableEl: $('missableCount'), gradesEl: $('gradeCounts') },
    trophies,
    state.earned,
  );
  renderRoadmap($('roadmapList'), roadmapDoc, trophiesById, state.earned);
  renderRoadmapTips($('roadmapTips'), roadmapDoc);
  const missables = trophies.filter((t) => t.missable);
  renderChecklist($('missableList'), missables, state, {
    onToggle: (id, checked) => {
      if (checked) state.earned.add(id);
      else state.earned.delete(id);
      saveEarned(state.earned);
      renderAll();
    },
    onSelect: (id) => {
      state.selectedId = id;
      switchView('checklist');
      renderAll();
    },
  });
  $('missablePill').textContent = String(missables.length);
  const summary = progressSummary(state.earned, trophies.length);
  document.title = summary.earned === 0
    ? 'Leonida Trophy Guide — GTA VI Platinum Roadmap'
    : `Leonida Trophy Guide — ${summary.earned}/${summary.total} earned (${summary.pct}%)`;
}

// Tabs and hash routing: one view visible at a time, the tab marked active.
const viewNames = ['checklist', 'roadmap', 'missables', 'about'];
function switchView(name) {
  if (!viewNames.includes(name)) name = 'checklist';
  for (const view of viewNames) {
    $(`view-${view}`).hidden = view !== name;
    document.querySelector(`.tab[data-view="${view}"]`).classList.toggle('is-active', view === name);
  }
}
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    location.hash = view === 'checklist' ? '' : view;
    switchView(view);
  });
});
function routeFromHash() {
  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('trophy-')) {
    const id = Number(hash.slice('trophy-'.length));
    if (validIds.has(id)) state.selectedId = id;
    switchView('checklist');
  } else {
    switchView(hash || 'checklist');
  }
  // A hash-only navigation does not reload the page, so re-render here:
  // without this, opening #trophy-<id> would leave the detail pane empty.
  renderAll();
}
window.addEventListener('hashchange', routeFromHash);

// Filters: kind, grade, search, earned-only, and the spoiler setting.
$('kind').addEventListener('change', (event) => { state.filters.kind = event.target.value; renderAll(); });
$('grade').addEventListener('change', (event) => { state.filters.grade = event.target.value; renderAll(); });
$('search').addEventListener('input', (event) => { state.filters.search = event.target.value; renderAll(); });
$('earnedOnly').addEventListener('change', (event) => { state.filters.earnedOnly = event.target.checked; renderAll(); });
const spoilerBox = $('spoiler');
spoilerBox.checked = state.spoilerOn;
spoilerBox.addEventListener('change', (event) => {
  state.spoilerOn = event.target.checked;
  saveSpoiler(state.spoilerOn);
  renderAll();
});

// Save controls: export the earned set, import a progress file, reset all.
$('exportBtn').addEventListener('click', () => {
  downloadTextFile('leonida-trophy-progress.json', buildExportPayload(state.earned));
});
$('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state.earned = parseImportedProgress(await file.text(), validIds);
    saveEarned(state.earned);
    renderAll();
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies? This cannot be undone.')) {
    state.earned = new Set();
    saveEarned(state.earned);
    renderAll();
  }
});

// Grade progress (for the header counts) is computed once here so the
// numbers stay consistent with the filter module's own ordering.
gradeProgress(trophies, state.earned);
countVisible(trophies, state.filters, state.earned);

// The app is ready: mark the document so the screenshot harness can tell.
document.documentElement.dataset.appReady = 'true';

routeFromHash();
renderAll();
