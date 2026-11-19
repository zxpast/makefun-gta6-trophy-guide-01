// Leonida Trophy Guide — GTA VI: checklist, roadmap, cited step guides.
// Data lives in data/trophies.json, data/roadmap.json and data/sources.json;
// progress lives in this browser only (localStorage), nothing is fetched
// from the network at run time.
const KEY = 'gta6-leonida-guide-v3';
const SPOIL_KEY = 'gta6-leonida-guide-spoilers';
const KIND_LABELS = {
  platinum: 'Platinum', story: 'Story', completion: 'Completion',
  activities: 'Activities', side: 'Side', collectibles: 'Collectibles',
  crime: 'Crime', world: 'World', misc: 'Misc', money: 'Money'
};
const $ = (id) => document.getElementById(id);
const state = {
  earned: new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')),
  spoiler: localStorage.getItem(SPOIL_KEY) !== 'off',
  filter: 'all',
  selected: 28,
  tab: 'checklist'
};
let TROPHIES = [], ROADMAP = null, SOURCES = [];

function save() {
  localStorage.setItem(KEY, JSON.stringify([...state.earned]));
  localStorage.setItem(SPOIL_KEY, state.spoiler ? 'on' : 'off');
}
function byId(id) { return TROPHIES.find((t) => t.id === id); }
function coverageOf(n) { return TROPHIES.filter((t) => t.sources.includes(n)).length; }
function singleSourceIds() {
  return TROPHIES.filter((t) => {
    const m = new Set();
    for (const s of t.steps) for (const n of s.cites) if (n !== 5) m.add(n);
    return m.size === 1;
  }).map((t) => t.id);
}
function renderAudit() {
  const total = TROPHIES.length;
  const cited = TROPHIES.filter((t) => t.sources.length).length;
  const steps = TROPHIES.flatMap((t) => t.steps);
  const stepsCited = steps.filter((s) => s.cites.length).length;
  const miss = TROPHIES.filter((t) => t.missable_status === 'possibly-missable').length;
  const watch = TROPHIES.filter((t) => t.missable_status === 'watch').length;
  const unconf = TROPHIES.filter((t) => t.confirm_status === 'unconfirmed').length;
  const single = singleSourceIds().length;
  const disagree = TROPHIES.filter((t) => t.disagree).length;
  $('audit').innerHTML =
    `AUDIT <b>55 official · 1P 2G 6S 46B · 28 hidden</b> · ${cited}/${total} guides cite a source · ` +
    `<b>${stepsCited}/${steps.length} steps cited</b> · 7 sources read 20 Nov 2026 · ` +
    `${miss} possibly missable · ${watch} watch · ${unconf} unconfirmed · ${single} single-source · ${disagree} disagree`;
}
function renderPills() {
  const defs = [['all', 'All', TROPHIES.length]];
  for (const k of Object.keys(KIND_LABELS)) {
    defs.push([k, KIND_LABELS[k], TROPHIES.filter((t) => t.kind === k).length]);
  }
  defs.push(['missable', 'Missable', TROPHIES.filter((t) => t.missable_status === 'possibly-missable').length]);
  defs.push(['watch', 'Watch', TROPHIES.filter((t) => t.missable_status === 'watch').length]);
  defs.push(['unconfirmed', 'Unconfirmed', TROPHIES.filter((t) => t.confirm_status === 'unconfirmed').length]);
  defs.push(['disagree', 'Disagree', TROPHIES.filter((t) => t.disagree).length]);
  defs.push(['earned', 'Earned', state.earned.size]);
  const nav = $('pills');
  nav.replaceChildren();
  for (const [key, label, n] of defs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${label} ${n}`;
    if (state.filter === key) b.classList.add('on');
    b.addEventListener('click', () => { state.filter = key; renderList(); renderPills(); });
    nav.append(b);
  }
}
function filtered() {
  const f = state.filter;
  if (f === 'all') return TROPHIES;
  if (f === 'missable') return TROPHIES.filter((t) => t.missable_status === 'possibly-missable');
  if (f === 'watch') return TROPHIES.filter((t) => t.missable_status === 'watch');
  if (f === 'unconfirmed') return TROPHIES.filter((t) => t.confirm_status === 'unconfirmed');
  if (f === 'disagree') return TROPHIES.filter((t) => t.disagree);
  if (f === 'earned') return TROPHIES.filter((t) => state.earned.has(t.id));
  return TROPHIES.filter((t) => t.kind === f);
}
function hiddenBySpoiler(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
}
function flagBadges(t) {
  const out = [];
  if (t.missable_status === 'possibly-missable') out.push(['miss', 'POSSIBLY MISSABLE']);
  if (t.missable_status === 'watch') out.push(['watch', 'WATCH']);
  if (t.confirm_status === 'unconfirmed') out.push(['unconf', 'UNCONFIRMED']);
  if (t.disagree) out.push(['dis', 'SOURCES DISAGREE']);
  return out;
}
function renderList() {
  const ul = $('trophyList');
  ul.replaceChildren();
  for (const t of filtered()) {
    const li = document.createElement('li');
    if (t.id === state.selected) li.classList.add('sel');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.id); else state.earned.delete(t.id);
      save(); renderProgress(); renderList(); renderDetail(); renderPills();
    });
    const wrap = document.createElement('div');
    const masked = hiddenBySpoiler(t);
    const name = document.createElement('div');
    name.className = 'tname' + (state.earned.has(t.id) ? ' earned' : '');
    name.textContent = masked ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = masked ? 'Earn it to reveal the name and description.' : t.description;
    const meta = document.createElement('div');
    meta.className = 'tmeta';
    const grade = document.createElement('span');
    grade.className = `grade ${t.grade}`;
    grade.textContent = masked ? '?' : t.grade;
    meta.append(grade, document.createTextNode(` ${masked ? '' : KIND_LABELS[t.kind] + ' · '}Stage ${t.stage}` + (t.count ? ` · ${t.count.toLocaleString()}` : '')));
    for (const [cls, txt] of flagBadges(t)) {
      const f = document.createElement('span');
      f.className = `flag ${cls}`;
      f.textContent = txt;
      meta.append(document.createTextNode(' '), f);
    }
    wrap.append(name, desc, meta);
    li.append(box, wrap);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      state.selected = t.id;
      showTab('checklist');
      history.replaceState(null, '', `#/trophy/${t.id}`);
      renderList(); renderDetail();
    });
    ul.append(li);
  }
  $('progress').textContent = `${state.earned.size} / ${TROPHIES.length} earned`;
}
function renderProgress() {
  $('progress').textContent = `${state.earned.size} / ${TROPHIES.length} earned`;
}
function renderDetail() {
  const t = byId(state.selected) ?? TROPHIES[0];
  const el = $('detail');
  el.replaceChildren();
  const masked = hiddenBySpoiler(t);
  const h = document.createElement('h2');
  h.textContent = masked ? 'Hidden story trophy' : t.name;
  el.append(h);
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = masked
    ? 'Official name and description hidden until earned (spoiler setting is on).'
    : `“${t.description}” — official description · ${t.grade} · ${KIND_LABELS[t.kind]} · Stage ${t.stage}` +
      (t.hidden ? ' · Hidden on PlayStation until earned' : '') +
      (t.count ? ` · Count: ${t.count.toLocaleString()}` : '');
  el.append(off);
  for (const [cls, txt] of flagBadges(t)) {
    const f = document.createElement('span');
    f.className = `flag ${cls}`;
    f.style.marginRight = '6px';
    f.textContent = txt;
    el.append(f);
  }
  if (masked) {
    const p = document.createElement('p');
    p.className = 'summary';
    p.textContent = 'Tick this trophy off (or switch the spoiler setting off) to see its guide.';
    el.append(p);
    return;
  }
  const sum = document.createElement('p');
  sum.className = 'summary';
  sum.textContent = t.guide;
  el.append(sum);
  if (t.disagree && t.disagree_note) {
    const d = document.createElement('p');
    d.className = 'disnote';
    d.textContent = 'Sources disagree — both versions shown: ' + t.disagree_note;
    el.append(d);
  }
  if (t.missable_status === 'possibly-missable') {
    const w = document.createElement('p');
    w.className = 'warnnote';
    w.textContent = 'Possibly missable: the Chapter 1 balcony meditation is gone after Chapter 1, and it is unconfirmed whether the trophy needs it. Do it anyway and keep a Chapter 1 save.';
    el.append(w);
  }
  if (t.missable_status === 'watch') {
    const w = document.createElement('p');
    w.className = 'warnnote';
    w.textContent = 'Watch: one step in this guide is time-sensitive. Do it the moment it appears.';
    el.append(w);
  }
  const ol = document.createElement('ol');
  ol.className = 'steps';
  for (const s of t.steps) {
    const li = document.createElement('li');
    li.append(document.createTextNode(s.text + ' '));
    for (const n of s.cites) {
      const c = document.createElement('span');
      c.className = 'cite';
      c.textContent = `[${n}]`;
      li.append(c, document.createTextNode(' '));
    }
    ol.append(li);
  }
  el.append(ol);
  const sh = document.createElement('h2');
  sh.textContent = 'Sources for this guide';
  sh.style.fontSize = '14px';
  el.append(sh);
  const srcList = document.createElement('ol');
  srcList.className = 'dsrc';
  for (const n of t.sources) {
    const s = SOURCES.find((x) => x.number === n);
    if (!s) continue;
    const li = document.createElement('li');
    li.append(document.createTextNode(`[${n}] ${s.name} — read 20 Nov 2026, cited by ${coverageOf(n)} of 55 guides. `));
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.url;
      li.append(a);
    } else {
      li.append(document.createTextNode('(official list, no URL)'));
    }
    srcList.append(li);
  }
  el.append(srcList);
}
function renderSourceCol() {
  const ol = $('sourceCol');
  ol.replaceChildren();
  for (const s of SOURCES) {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'snum';
    num.textContent = `[${s.number}] `;
    const name = document.createElement('span');
    name.textContent = s.name + ' ';
    const cov = document.createElement('span');
    cov.className = 'scov';
    cov.textContent = `cited by ${coverageOf(s.number)} of 55 guides`;
    li.append(num, name, cov);
    ol.append(li);
  }
}
function renderRoadmap() {
  const box = $('roadmapStages');
  box.replaceChildren();
  for (const st of ROADMAP.stages) {
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `Stage ${st.n} — ${st.title}`;
    const hrs = document.createElement('div');
    hrs.className = 'hours';
    hrs.textContent = st.hours;
    const p = document.createElement('p');
    p.textContent = st.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const id of st.trophies) {
      const t = byId(id);
      if (!t) continue;
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip' + (state.earned.has(id) ? ' done' : '');
      c.textContent = (state.earned.has(id) ? '✓ ' : '') + t.name;
      c.addEventListener('click', () => {
        state.selected = id;
        history.replaceState(null, '', `#/trophy/${id}`);
        showTab('checklist');
        renderList(); renderDetail();
      });
      chips.append(c);
    }
    const prog = document.createElement('p');
    prog.style.color = 'var(--muted)';
    prog.textContent = `${st.trophies.filter((id) => state.earned.has(id)).length} / ${st.trophies.length} earned in this stage`;
    card.append(h, hrs, p, chips, prog);
    box.append(card);
  }
}
function missableCard(title, body) {
  const card = document.createElement('div');
  card.className = 'misscard';
  const h = document.createElement('h3');
  h.textContent = title;
  card.append(h);
  card.append(body);
  return card;
}
function trophyLink(id) {
  const t = byId(id);
  const a = document.createElement('a');
  a.href = `#/trophy/${id}`;
  a.textContent = t ? t.name : `#${id}`;
  a.addEventListener('click', () => {
    state.selected = id;
    showTab('checklist');
    renderList(); renderDetail();
  });
  return a;
}
function renderMissable() {
  const box = $('missableView');
  box.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'missgrid';
  const pm = document.createElement('div');
  pm.append(document.createTextNode('Only one trophy is possibly missable. '));
  pm.append(trophyLink(28));
  pm.append(document.createTextNode(': meditate at every spot. The Chapter 1 balcony meditation at Jason\u2019s house is gone after Chapter 1, and no guide has confirmed whether the trophy needs it. Do it anyway and keep a Chapter 1 manual save. [1][2][3][6][7]'));
  grid.append(missableCard('Possibly missable — 1', pm));
  const w = document.createElement('div');
  w.append(trophyLink(25));
  w.append(document.createTextNode(': Yago\u2019s Race Against Yago in Chapter 3 is time-sensitive (hourglass icon). Save first and race it the moment it appears, or the strand can fail. [2]'));
  grid.append(missableCard('Watch — 1', w));
  const u = document.createElement('ul');
  for (const id of [49, 51, 29]) {
    const li = document.createElement('li');
    li.append(trophyLink(id));
    li.append(document.createTextNode(id === 29
      ? ' — which animal Bret wants is still unconfirmed. [1][3]'
      : ' — no launch-day guide gives a method yet. [1][2][4]'));
    u.append(li);
  }
  grid.append(missableCard('Unconfirmed — 3', u));
  const d = document.createElement('ul');
  for (const id of [7, 25, 28, 40]) {
    const t = byId(id);
    const li = document.createElement('li');
    li.append(trophyLink(id));
    li.append(document.createTextNode(' — ' + (t.disagree_note ?? '')));
    d.append(li);
  }
  grid.append(missableCard('Sources disagree — 4 (both versions shown)', d));
  const cleared = document.createElement('div');
  cleared.append(document.createTextNode('Cleared, not missable: Kenton, Let\u2019s Go Bowling, Hot Together and the quest-givers are all still there after the story, and every other trophy can be earned in free roam. [1][2] Cheats disable trophies and saving — keep them off a trophy save. [1][2][3]'));
  grid.append(missableCard('Cleared — everything else', cleared));
  box.append(grid);
}
function renderMatrix() {
  const box = $('sourceMatrix');
  box.replaceChildren();
  const table = document.createElement('table');
  table.className = 'matrix';
  const head = document.createElement('tr');
  for (const h of ['#', 'Source', 'Read', 'URL', 'Cited by']) {
    const th = document.createElement('th');
    th.textContent = h;
    head.append(th);
  }
  table.append(head);
  for (const s of SOURCES) {
    const tr = document.createElement('tr');
    const cells = [];
    const n = document.createElement('td');
    n.textContent = `[${s.number}]`;
    cells.push(n);
    const name = document.createElement('td');
    name.textContent = s.name + ' — ' + s.note;
    cells.push(name);
    const read = document.createElement('td');
    read.textContent = '20 Nov 2026';
    cells.push(read);
    const url = document.createElement('td');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.url;
      url.append(a);
    } else {
      url.textContent = '— (official list, no URL)';
    }
    cells.push(url);
    const cov = document.createElement('td');
    cov.textContent = `${coverageOf(s.number)} of 55 guides`;
    cells.push(cov);
    tr.append(...cells);
    table.append(tr);
  }
  box.append(table);
}
function showTab(tab) {
  state.tab = tab;
  for (const b of document.querySelectorAll('.tabs button')) {
    b.classList.toggle('active', b.dataset.tab === tab);
  }
  for (const p of document.querySelectorAll('.tabpane')) {
    p.classList.toggle('active', p.id === `tab-${tab}`);
  }
  if (tab === 'roadmap') renderRoadmap();
  if (tab === 'missable') renderMissable();
  if (tab === 'sources') renderMatrix();
}
function applyHash() {
  const h = location.hash;
  const m = h.match(/^#\/trophy\/(\d+)$/);
  if (m && byId(+m[1])) {
    state.selected = +m[1];
    showTab('checklist');
    return;
  }
  if (h === '#/roadmap' || h === '#/missable' || h === '#/sources') {
    showTab(h.slice(2));
    return;
  }
  showTab('checklist');
}
async function loadData() {
  const [t, r, s] = await Promise.all([
    fetch('data/trophies.json').then((x) => x.json()),
    fetch('data/roadmap.json').then((x) => x.json()),
    fetch('data/sources.json').then((x) => x.json())
  ]);
  TROPHIES = t.trophies.slice().sort((a, b) => a.id - b.id);
  ROADMAP = r;
  SOURCES = s.sources.slice().sort((a, b) => a.number - b.number);
}
function wireControls() {
  for (const b of document.querySelectorAll('.tabs button')) {
    b.addEventListener('click', () => {
      history.replaceState(null, '', b.dataset.tab === 'checklist' ? `#/trophy/${state.selected}` : `#/${b.dataset.tab}`);
      showTab(b.dataset.tab);
    });
  }
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    save(); renderList(); renderDetail();
  });
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...state.earned].sort((a, b) => a - b), exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      const valid = new Set(TROPHIES.map((t) => t.id));
      state.earned = new Set(ids.filter((id) => valid.has(id)));
      save(); renderProgress(); renderList(); renderDetail(); renderPills();
    } catch {
      alert('That file is not a valid progress export.');
    }
    e.target.value = '';
  });
  window.addEventListener('hashchange', () => { applyHash(); renderList(); renderDetail(); });
}
await loadData();
wireControls();
renderAudit();
renderPills();
renderList();
renderDetail();
renderSourceCol();
applyHash();
renderList();
renderDetail();

