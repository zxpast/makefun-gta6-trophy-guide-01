// Leonida progress store: keeps earned trophies and the spoiler setting in
// localStorage, and moves that same progress in and out as a plain JSON file.
// Nothing here touches the network; the file the user exports is theirs alone.

export const STORAGE_KEY = 'leonida-trophy-progress-v1';
export const EXPORT_FILENAME = 'leonida-trophy-progress.json';

// Read saved progress. A missing or damaged record starts empty, never throws.
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: {}, spoiler: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { earned: {}, spoiler: false };
    const earned = {};
    if (parsed.earned && typeof parsed.earned === 'object') {
      for (const key of Object.keys(parsed.earned)) {
        if (parsed.earned[key]) earned[key] = true;
      }
    }
    return { earned, spoiler: parsed.spoiler === true };
  } catch {
    return { earned: {}, spoiler: false };
  }
}

// Persist the whole progress object in one write.
export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Flip one trophy's earned flag and save. Returns the new state.
export function toggleEarned(state, id) {
  const next = { earned: { ...state.earned }, spoiler: state.spoiler };
  if (next.earned[id]) delete next.earned[id];
  else next.earned[id] = true;
  saveProgress(next);
  return next;
}

// Flip the spoiler setting and save. Returns the new state.
export function setSpoiler(state, on) {
  const next = { earned: { ...state.earned }, spoiler: on };
  saveProgress(next);
  return next;
}

// How many trophies are earned in a list, given a progress state.
export function countEarned(trophies, state) {
  return trophies.filter((t) => state.earned[t.id]).length;
}

// Build the JSON text an export file holds.
export function exportText(state) {
  return JSON.stringify(
    { app: 'leonida-trophy-guide', version: 1, earned: Object.keys(state.earned).map(Number).sort((a, b) => a - b), spoiler: state.spoiler },
    null,
    2,
  );
}

// Offer the progress JSON as a download. Uses a blob URL, no network.
export function downloadExport(state) {
  const blob = new Blob([exportText(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Parse an imported file's text back into a progress state, or null if it is
// not a progress file this app recognises.
export function parseImport(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.earned)) return null;
    const earned = {};
    for (const id of parsed.earned) {
      if (Number.isInteger(id) && id >= 1 && id <= 55) earned[id] = true;
    }
    return { earned, spoiler: parsed.spoiler === true };
  } catch {
    return null;
  }
}

// Forget everything: clear the saved record and return a fresh state.
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return { earned: {}, spoiler: false };
}
