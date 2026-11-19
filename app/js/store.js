// Progress store: earned trophy ids kept in localStorage, with export and import.
// Nothing leaves the browser; the file the export writes is the only copy outside it.
export const STORE_KEY = 'leonida-trophy-progress-v1';
export const SPOILER_KEY = 'leonida-trophy-spoiler-v1';

// Load the earned set from localStorage. A corrupt value is ignored, never fatal.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

// Save the earned set. Returns true when the write landed.
export function saveEarned(earned) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
    return true;
  } catch {
    return false;
  }
}

// Parse an imported progress file. Accepts our own export shape
// ({version, earned:[ids]}) and a bare array of ids, and keeps only ids
// that exist in the trophy list, so a stale or foreign file cannot corrupt state.
export function parseImportedProgress(text, validIds) {
  const parsed = JSON.parse(text);
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('Not a progress file: no earned list found.');
  const kept = ids.filter((id) => Number.isInteger(id) && validIds.has(id));
  return new Set(kept);
}

// Build the export payload for the earned set.
export function buildExportPayload(earned) {
  return JSON.stringify(
    { app: 'leonida-trophy-guide', version: 1, exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) },
    null,
    2,
  );
}

// Download a text payload as a file, then release the object URL.
export function downloadTextFile(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Spoiler setting: persist the checkbox so a reader's choice survives a reload.
export function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}
export function saveSpoiler(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  } catch {
    // Storage may be unavailable; the setting simply does not persist.
  }
}

// One-line summary of the earned set, for the header and the About view.
export function progressSummary(earned, total) {
  const pct = total === 0 ? 0 : Math.round((earned.size / total) * 100);
  return { earned: earned.size, total, pct };
}
