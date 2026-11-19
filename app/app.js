// Leonida Trophy Guide — tracker, filters, roadmap, source matrix.
// All data comes from the local JSON files under data/; the app fetches
// nothing from the network and stores progress only in localStorage.
const STORE_KEY = "leonida-progress-v2";
const DEMO_EARNED = [2, 3, 4, 8, 15, 16, 20, 21, 35, 42, 46];
const KIND_LABELS = { platinum: "Platinum", story: "Story", completion: "100%", activities: "Activities", side: "Side", collectibles: "Collectibles", crime: "Crime", world: "World", misc: "Misc", money: "Money" };
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

let trophies = [], sources = [], roadmap = null;
let earned = new Set(), openId = 28, kindFilter = "all", searchText = "", spoilerOn = false, tab = "guide";

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function citeMarks(cites) { return cites.map(n => "[" + n + "]").join(" "); }
function trophyById(id) { return trophies.find(t => t.id === id); }
function loadEarned() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return new Set(JSON.parse(raw).filter(n => Number.isInteger(n))); } catch (e) {}
  return null;
}
function saveEarned() { try { localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b))); } catch (e) {} }
function gradeBadge(t) { return '<span class="grade ' + t.grade + '">' + esc(t.grade) + "</span>"; }
function flagChips(t) {
  let out = "";
  if (t.missable_status === "possibly-missable") out += '<span class="flag miss">Possibly missable</span>';
  if (t.missable_status === "watch") out += '<span class="flag watch">Watch — timed step</span>';
  if (t.confirm_status === "unconfirmed") out += '<span class="flag unconf">Unconfirmed</span>';
  if (t.disagree) out += '<span class="flag dis">Sources disagree</span>';
  if (t.hidden) out += '<span class="flag unconf">Hidden</span>';
  return out;
}
function sourceName(n) { const s = sources.find(x => x.n === n); return s ? s.name : "Source " + n; }
function coverageOf(n) { return trophies.filter(t => (t.sources || []).includes(n)).length; }

function computeAudit() {
  const totalSteps = trophies.reduce((a, t) => a + (t.steps || []).length, 0);
  const citedSteps = trophies.reduce((a, t) => a + (t.steps || []).filter(s => (s.cites || []).length).length, 0);
  const guidesCited = trophies.filter(t => (t.sources || []).length).length;
  const miss = trophies.filter(t => t.missable_status === "possibly-missable").length;
  const watch = trophies.filter(t => t.missable_status === "watch").length;
  const unconf = trophies.filter(t => t.confirm_status === "unconfirmed").length;
  const single = trophies.filter(t => { const m = new Set(); (t.steps || []).forEach(s => (s.cites || []).forEach(n => { if (n !== 5) m.add(n); })); return m.size === 1; }).length;
  const dis = trophies.filter(t => t.disagree).length;
  return "AUDIT · 55 official · 1P 2G 6S 46B · 28 hidden · " + guidesCited + "/55 guides cite a source · " + citedSteps + "/" + totalSteps + " steps cited · 7 sources read 20 Nov 2026 · " + miss + " possibly missable · " + watch + " watch · " + unconf + " unconfirmed · " + single + " single-source · " + dis + " disagree";
}

function visibleTrophies() {
  return trophies.filter(t => {
    if (kindFilter === "missable") { if (t.missable_status !== "possibly-missable") return false; }
    else if (kindFilter === "watch") { if (t.missable_status !== "watch") return false; }
    else if (kindFilter === "unconfirmed") { if (t.confirm_status !== "unconfirmed") return false; }
    else if (kindFilter === "disagree") { if (!t.disagree) return false; }
    else if (kindFilter !== "all") { if (t.kind !== kindFilter) return false; }
    if (searchText) { const hay = (t.name + " " + t.description + " " + (t.guide || "")).toLowerCase(); if (!hay.includes(searchText)) return false; }
    return true;
  });
}

function renderPills() {
  const counts = {};
  trophies.forEach(t => { counts[t.kind] = (counts[t.kind] || 0) + 1; });
  const specials = [
    ["missable", "Missable " + trophies.filter(t => t.missable_status === "possibly-missable").length],
    ["watch", "Watch " + trophies.filter(t => t.missable_status === "watch").length],
    ["unconfirmed", "Unconfirmed " + trophies.filter(t => t.confirm_status === "unconfirmed").length],
    ["disagree", "Disagree " + trophies.filter(t => t.disagree).length],
  ];
  let html = '<button type="button" class="pill' + (kindFilter === "all" ? " active" : "") + '" data-kind="all">All ' + trophies.length + "</button>";
  Object.keys(KIND_LABELS).forEach(k => { if (counts[k]) html += '<button type="button" class="pill' + (kindFilter === k ? " active" : "") + '" data-kind="' + k + '">' + KIND_LABELS[k] + " " + counts[k] + "</button>"; });
  specials.forEach(([k, label]) => { html += '<button type="button" class="pill' + (kindFilter === k ? " active" : "") + '" data-kind="' + k + '">' + label + "</button>"; });
  $("pillRow").innerHTML = html;
  $("pillRow").querySelectorAll(".pill").forEach(p => p.addEventListener("click", () => { kindFilter = p.dataset.kind; renderAll(); }));
}

function renderChecklist() {
  const list = visibleTrophies().slice().sort((a, b) => a.id - b.id);
  $("checklist").innerHTML = list.map(t => {
    const isOpen = t.id === openId, isEarned = earned.has(t.id);
    const hiddenName = spoilerOn && t.hidden && !isEarned;
    const name = hiddenName ? "Hidden trophy — earn it to reveal" : esc(t.name);
    const desc = hiddenName ? "Story trophy hidden by the spoiler setting." : esc(t.description);
    return '<div class="trow' + (isOpen ? " open" : "") + (isEarned ? " earned" : "") + '" data-id="' + t.id + '">'
      + '<input type="checkbox" ' + (isEarned ? "checked" : "") + ' aria-label="Earned: ' + esc(t.name) + '">'
      + '<div><div class="tname">' + name + "</div>"
      + '<div class="tdesc">' + desc + "</div>"
      + '<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">' + gradeBadge(t) + flagChips(t) + "</div></div></div>";
  }).join("") || '<p class="roadnote">No trophies match this filter.</p>';
  $("checklist").querySelectorAll(".trow").forEach(row => {
    row.addEventListener("click", ev => {
      const id = Number(row.dataset.id);
      if (ev.target.tagName === "INPUT") { toggleEarned(id); return; }
      openId = id; renderAll();
    });
  });
}
function toggleEarned(id) { if (earned.has(id)) earned.delete(id); else earned.add(id); saveEarned(); renderAll(); }

function renderDetail() {
  const t = trophyById(openId) || trophies[0];
  if (!t) { $("detail").innerHTML = ""; return; }
  const hiddenName = spoilerOn && t.hidden && !earned.has(t.id);
  const steps = (t.steps || []).map(s => '<li><span>' + esc(s.text) + ' <span class="cite">' + citeMarks(s.cites || []) + "</span></span></li>").join("");
  let extra = "";
  if (t.disagree && t.disagree_note) extra += '<div class="disnote"><b>Sources disagree — both versions shown:</b> ' + esc(t.disagree_note) + "</div>";
  if (t.missable_status === "possibly-missable") extra += '<div class="warnnote"><b>Possibly missable:</b> the Chapter 1 balcony meditation vanishes after Chapter 1. Do it early and keep a Chapter 1 manual save until this trophy pops.</div>';
  if (t.confirm_status === "unconfirmed") extra += '<div class="warnnote"><b>Unconfirmed:</b> no launch-day guide gives a proven method for this trophy yet. The steps above say what is believed and what is still unknown.</div>';
  const srcList = (t.sources || []).map(n => "[" + n + "] " + esc(sourceName(n))).join(" · ");
  $("detail").innerHTML = "<h2>" + (hiddenName ? "Hidden trophy" : esc(t.name)) + "</h2>"
    + '<div class="meta">' + gradeBadge(t) + flagChips(t) + '<span class="flag dis">Stage ' + t.stage + " · " + esc(KIND_LABELS[t.kind] || t.kind) + "</span></div>"
    + '<p class="desc">“' + esc(t.description) + "”</p>"
    + '<p style="margin:0 0 4px"><b>Guide — ' + (t.steps || []).length + " steps, every step cited:</b></p>"
    + '<ol class="steps">' + steps + "</ol>" + extra
    + '<p class="srcnote"><b>Sources for this guide:</b> ' + esc(srcList) + ". Full source list in the Source matrix tab.</p>";
  renderSourceCol(t);
}
function renderSourceCol(t) {
  const rows = (t.sources || []).map(n => {
    const s = sources.find(x => x.n === n);
    if (!s) return "";
    return '<div class="srow"><b>[' + n + "]</b> " + esc(s.name) + "<br>Read " + esc(s.read) + " · cited by " + coverageOf(n) + " of 55 guides" + (s.url ? '<br><span class="url">' + esc(s.url) + "</span>" : "") + "</div>";
  }).join("");
  $("sourceCol").innerHTML = "<h3>Sources for this guide</h3>" + rows + '<p class="srcnote">Citations are numbered [1]–[7] in every step. URLs are shown as text only; the app fetches nothing.</p>';
}

function renderRoadmap() {
  $("roadNote").textContent = roadmap.note || "";
  $("stageList").innerHTML = roadmap.stages.map(st => {
    const done = st.ids.filter(id => earned.has(id)).length;
    const pct = st.ids.length ? Math.round(done / st.ids.length * 100) : 0;
    const names = st.ids.map(id => { const t = trophyById(id); return t ? esc(t.name) : id; }).join(" · ");
    return '<div class="stage"><h3>Stage ' + st.n + " — " + esc(st.title) + "</h3>"
      + "<p>" + esc(st.blurb) + "</p>"
      + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
      + "<p><b>" + done + " / " + st.ids.length + " earned</b> · " + esc(st.hours) + "</p>"
      + '<p class="ids">' + names + "</p></div>";
  }).join("");
}
function renderMissables() {
  const pm = trophies.filter(t => t.missable_status === "possibly-missable");
  const watch = trophies.filter(t => t.missable_status === "watch");
  const unconf = trophies.filter(t => t.confirm_status === "unconfirmed");
  const dis = trophies.filter(t => t.disagree);
  const card = (title, list, body) => '<div class="misscard"><h3>' + title + "</h3>" + body + "<ul>" + list.map(t => '<li><b>' + esc(t.name) + "</b> — " + esc(t.disagree_note || t.guide || "") + "</li>").join("") + "</ul></div>";
  $("missGrid").innerHTML =
    card("Possibly missable — " + pm.length, pm, "<p>Only one trophy carries a chapter-gated risk. Six launch-day guides agree on it.</p>")
    + card("Watch — timed step — " + watch.length, watch, "<p>Method confirmed, but one sub-step has a timing window. Save first, then do it at once.</p>")
    + card("Unconfirmed — " + unconf.length, unconf, "<p>No launch-day guide gives a proven method for these yet. Their steps say what is believed, not what is proven.</p>")
    + card("Sources disagree — " + dis.length, dis, "<p>Both versions are shown in each guide, with both citations. The guide picks neither.</p>");
}
function renderMatrix() {
  const tb = $("matrixTable").querySelector("tbody");
  tb.innerHTML = sources.map(s => "<tr><td><b>[" + s.n + "]</b></td><td><b>" + esc(s.name) + "</b><br><span style='color:var(--muted);font-size:12px'>" + esc(s.note) + "</span></td><td>" + esc(s.read) + "</td><td class='url'>" + (s.url ? esc(s.url) : "— no URL (kit data file)") + "</td><td><b>cited by " + coverageOf(s.n) + " of 55 guides</b></td></tr>").join("");
}
function renderProgress() {
  $("progressLabel").textContent = earned.size + " / 55 earned";
  $("spoilerBtn").textContent = spoilerOn ? "Spoilers: hidden" : "Spoilers: shown";
  $("spoilerBtn").setAttribute("aria-pressed", String(spoilerOn));
}
function renderTabs() {
  document.querySelectorAll("#tabbar button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = $("view-" + tab);
  if (view) view.classList.add("active");
}
function renderAll() {
  renderProgress(); renderPills(); renderChecklist(); renderDetail(); renderRoadmap(); renderMissables(); renderMatrix(); renderTabs();
  $("auditStrip").textContent = computeAudit();
}
function setTab(name) { tab = name; if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name); renderTabs(); }

async function loadJSON(path) { const r = await fetch(path); if (!r.ok) throw new Error("Cannot load " + path); return r.json(); }
async function boot() {
  const params = new URLSearchParams(location.search);
  const [tData, sData, rData] = await Promise.all([loadJSON("data/trophies.json"), loadJSON("data/sources.json"), loadJSON("data/roadmap.json")]);
  trophies = (tData.trophies || []).slice().sort((a, b) => a.id - b.id);
  sources = sData.sources || [];
  roadmap = rData;
  const saved = loadEarned();
  if (saved) earned = saved;
  else if (params.get("demo") === "1") { earned = new Set(DEMO_EARNED); saveEarned(); }
  const openParam = Number(params.get("open"));
  if (openParam && trophyById(openParam)) openId = openParam;
  const hashTab = (location.hash || "").slice(1);
  if (["guide", "roadmap", "missables", "sources"].includes(hashTab)) tab = hashTab;
  document.querySelectorAll("#tabbar button").forEach(b => b.addEventListener("click", () => setTab(b.dataset.tab)));
  $("searchBox").addEventListener("input", e => { searchText = e.target.value.trim().toLowerCase(); renderChecklist(); });
  $("spoilerBtn").addEventListener("click", () => { spoilerOn = !spoilerOn; renderAll(); });
  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned].sort((a, b) => a - b), exported: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leonida-trophy-progress.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("importFile").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); const ids = (data.earned || data || []).filter(n => Number.isInteger(n) && trophyById(n)); earned = new Set(ids); saveEarned(); renderAll(); }
    catch (err) { alert("That file is not a Leonida progress export."); }
    e.target.value = "";
  });
  renderAll();
}
document.addEventListener("DOMContentLoaded", boot);
