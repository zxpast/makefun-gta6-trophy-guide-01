// Leonida filters: which trophies a view shows, and what the spoiler setting
// hides. Pure functions over the trophy list — no DOM, no storage here.

export const KIND_LABELS = {
  all: 'All 55',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
};

// A trophy belongs to the "missable" filter when its own flag says so.
export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

// Case-insensitive search over name, description and guide text.
export function matchesQuery(trophy, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
  return haystack.includes(needle);
}

// The visible list for a kind filter plus a search string.
export function visibleTrophies(trophies, kind, query) {
  return trophies.filter((t) => matchesKind(t, kind) && matchesQuery(t, query));
}

// The spoiler rule: a story trophy that is not earned yet hides its name,
// description and guide while the spoiler setting is on.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler === true && trophy.kind === 'story' && !state.earned[trophy.id];
}

// What the checklist shows as a trophy's name under the spoiler rule.
export function displayName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

// What the checklist shows as a trophy's description under the spoiler rule.
export function displayDescription(trophy, state) {
  return isSpoilerHidden(trophy, state)
    ? 'Earn this story trophy to reveal its name and description.'
    : trophy.description;
}

// A short label for a trophy's PSN target, or an empty string when it has none.
export function targetLabel(trophy) {
  if (trophy.target === null || trophy.target === undefined) return '';
  if (trophy.id === 52) return 'Target: $250,000 laundered';
  if (trophy.id === 53) return 'Target: $100,000 spent';
  if (trophy.id === 14) return 'Target: 100% completion';
  if (trophy.id === 1) return 'Target: all 54 others';
  return `Target: ${trophy.target}`;
}
