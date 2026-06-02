import { Tracker, Entry, TrackerType, TrackerCadence } from '../types';
import { TRACKER_COLORS } from '../theme';
import { saveTracker, addEntries, clearAllData } from './storage';

const DAY = 24 * 60 * 60 * 1000;
const DAILY_DAYS = 183; // ~6 months
const WEEKS = 26;       // ~6 months

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Local midnight for the day `daysAgo` before today. */
function dayStart(daysAgo: number): number {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // noon, so it lands squarely inside the day bucket
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

/** Noon of the Monday `weeksAgo` before the current week's Monday. */
function weekStart(weeksAgo: number): number {
  const d = new Date();
  const daysFromMonday = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - daysFromMonday - weeksAgo * 7);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

interface Spec {
  name: string;
  unit: string;
  type: TrackerType;
  cadence: TrackerCadence;
  color: string;
  /** value for a given step index (0 = oldest) out of total steps */
  value: (i: number, total: number) => number;
}

const SPECS: Spec[] = [
  // --- 4 number trackers with 6 months of DAILY data ---
  {
    name: 'Weight', unit: 'lbs', type: 'number', cadence: 'daily', color: TRACKER_COLORS[0],
    // gentle downward trend 188 -> ~172 with daily noise
    value: (i, total) => Math.round(188 - (i / total) * 16 + rand(-1.5, 1.5)),
  },
  {
    name: 'Sleep', unit: 'hrs', type: 'number', cadence: 'daily', color: TRACKER_COLORS[1],
    value: () => clamp(Math.round(7 + rand(-2, 2)), 4, 10),
  },
  {
    name: 'Steps', unit: 'steps', type: 'number', cadence: 'daily', color: TRACKER_COLORS[2],
    value: () => Math.max(0, Math.round(8000 + rand(-5000, 6500))),
  },
  {
    name: 'Water', unit: 'glasses', type: 'number', cadence: 'daily', color: TRACKER_COLORS[3],
    value: () => clamp(Math.round(6 + rand(-3, 4)), 0, 12),
  },

  // --- weekly NUMBER data ---
  {
    name: 'Weigh-in', unit: 'lbs', type: 'number', cadence: 'weekly', color: TRACKER_COLORS[4],
    value: (i, total) => Math.round(188 - (i / total) * 16 + rand(-1, 1)),
  },
  {
    name: 'Money Saved', unit: '$', type: 'number', cadence: 'weekly', color: TRACKER_COLORS[5],
    value: () => Math.round(rand(20, 220)),
  },

  // --- daily YES/NO data ---
  {
    name: 'Exercise', unit: '', type: 'yesno', cadence: 'daily', color: TRACKER_COLORS[1],
    value: () => (Math.random() < 0.6 ? 1 : 0),
  },
  {
    name: 'Vitamins', unit: '', type: 'yesno', cadence: 'daily', color: TRACKER_COLORS[3],
    value: () => (Math.random() < 0.82 ? 1 : 0),
  },

  // --- weekly YES/NO data ---
  {
    name: 'GLP-1 Shot', unit: '', type: 'yesno', cadence: 'weekly', color: TRACKER_COLORS[2],
    value: () => (Math.random() < 0.92 ? 1 : 0),
  },
  {
    name: 'Date Night', unit: '', type: 'yesno', cadence: 'weekly', color: TRACKER_COLORS[0],
    value: () => (Math.random() < 0.5 ? 1 : 0),
  },
];

/**
 * Replaces all data with a realistic ~6-month sample set covering every
 * tracker type / cadence combination. Dev-only.
 */
export async function seedSampleData(): Promise<void> {
  await clearAllData();

  for (const spec of SPECS) {
    const tracker: Tracker = {
      id: uid(),
      name: spec.name,
      unit: spec.unit,
      type: spec.type,
      cadence: spec.cadence,
      createdAt: Date.now(),
      color: spec.color,
    };
    await saveTracker(tracker);

    const isWeekly = spec.cadence === 'weekly';
    const total = isWeekly ? WEEKS : DAILY_DAYS;
    const entries: Entry[] = [];

    for (let step = 0; step < total; step++) {
      // step 0 = oldest. Convert to "ago" offset (largest first).
      const ago = total - 1 - step;
      const timestamp = isWeekly ? weekStart(ago) : dayStart(ago);
      entries.push({
        id: `${tracker.id}-${step}`,
        trackerId: tracker.id,
        value: spec.value(step, total),
        timestamp,
      });
    }

    await addEntries(entries);
  }
}
