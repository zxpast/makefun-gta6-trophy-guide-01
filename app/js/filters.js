// Filters: kind, grade, search text, earned-only, and the spoiler rule.
// The spoiler rule hides the name and description of an unearned story trophy
// until it is earned; every other kind stays visible, so the setting only
// ever hides story, never the tracker's counts.
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side strands',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  world: 'World',
  money: 'Money',
  misc: 'Moments',
  platinum: 'Platinum',
  completion: '100% completion',
};

export function kindLabel(kind) {
  return KIND_LABELS[kind] ?? kind;
}

// Does one trophy pass the current filter set? Search matches name and
// description; the "missable" kind matches the flag whatever its own kind is.
export function trophyMatches(trophy, filters, earned) {
  if (filters.kind !== 'all') {
    if (filters.kind === 'missable') {
      if (!trophy.missable) return false;
    } else if (trophy.kind !== filters.kind) {
      return false;
    }
  }
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.earnedOnly && !earned.has(trophy.id)) return false;
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    const haystack = `${trophy.name} ${trophy.description}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

// A trophy's name and description are spoiled when the setting is on, the
// trophy is a story trophy, and it is not earned yet. Earned story trophies
// show in full, so the setting never hides what the player already has.
export function isSpoiled(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

// Grade order for the header counts: platinum, gold, silver, bronze.
export function gradeProgress(trophies, earned) {
  const order = ['platinum', 'gold', 'silver', 'bronze'];
  return order.map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const done = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    return { grade, done, total };
  });
}

// Count how many trophies pass a filter set, for the list hint line.
export function countVisible(trophies, filters, earned) {
  return trophies.filter((t) => trophyMatches(t, filters, earned)).length;
}
