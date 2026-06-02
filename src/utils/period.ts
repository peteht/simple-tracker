import { Entry, TrackerCadence } from '../types';

/**
 * Start-of-period timestamp for the period containing `now`.
 * Daily  → midnight today (local).
 * Weekly → midnight of the most recent Monday (local).
 */
export function getPeriodStart(now: number, cadence: TrackerCadence): number {
  const d = new Date(now);
  if (cadence === 'weekly') {
    const daysFromMonday = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - daysFromMonday);
  }
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * The entry (if any) already logged in the current period.
 * Used to enforce the one-entry-per-period rule.
 */
export function findCurrentPeriodEntry(
  entries: Entry[],
  cadence: TrackerCadence,
  now: number = Date.now()
): Entry | null {
  const start = getPeriodStart(now, cadence);
  return entries.find(e => e.timestamp >= start) ?? null;
}
