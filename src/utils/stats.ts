import { Entry } from '../types';

/** Mean of all entry values. Returns 0 for an empty list. */
export function average(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.value, 0) / entries.length;
}

/** Count of "yes" (value === 1) entries. */
export function yesCount(entries: Entry[]): number {
  return entries.filter(e => e.value === 1).length;
}

/** Percentage of entries that are "yes", rounded. 0 for an empty list. */
export function yesRate(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  return Math.round((yesCount(entries) / entries.length) * 100);
}

/**
 * Number of consecutive "yes" entries counting back from the most recent.
 * Order-independent: sorts by timestamp internally.
 */
export function currentStreak(entries: Entry[]): number {
  const sortedDesc = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  for (const e of sortedDesc) {
    if (e.value === 1) streak++;
    else break;
  }
  return streak;
}
