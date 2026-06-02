import {
  filterEntriesByRange,
  snapToBucket,
  formatXLabel,
  TIME_RANGES,
} from '../timeRange';
import { Entry } from '../../types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function entry(timestamp: number, value = 1): Entry {
  return { id: `${timestamp}`, trackerId: 't1', value, timestamp };
}

// Fixed "now" so range cutoffs are deterministic.
const NOW = new Date('2026-06-15T12:00:00').getTime();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('filterEntriesByRange', () => {
  it('returns everything for ALL', () => {
    const entries = [entry(NOW - 400 * DAY), entry(NOW - DAY), entry(NOW)];
    expect(filterEntriesByRange(entries, 'ALL')).toHaveLength(3);
  });

  it('keeps only the last 24h for 24H', () => {
    const entries = [
      entry(NOW - 2 * DAY),
      entry(NOW - 2 * HOUR),
      entry(NOW - 30 * 60 * 1000),
    ];
    const result = filterEntriesByRange(entries, '24H');
    expect(result).toHaveLength(2);
    expect(result.every(e => e.timestamp >= NOW - DAY)).toBe(true);
  });

  it('keeps only the last 7 days for 7D', () => {
    const entries = [entry(NOW - 10 * DAY), entry(NOW - 3 * DAY), entry(NOW)];
    expect(filterEntriesByRange(entries, '7D')).toHaveLength(2);
  });

  it('includes an entry exactly on the cutoff boundary', () => {
    const entries = [entry(NOW - 7 * DAY)];
    expect(filterEntriesByRange(entries, '7D')).toHaveLength(1);
  });

  it('returns empty for an empty input', () => {
    expect(filterEntriesByRange([], '1M')).toEqual([]);
  });
});

describe('snapToBucket', () => {
  it('snaps two times on the same day to the same bucket for 7D', () => {
    const morning = new Date('2026-06-15T08:30:00').getTime();
    const evening = new Date('2026-06-15T22:15:00').getTime();
    expect(snapToBucket(morning, '7D')).toBe(snapToBucket(evening, '7D'));
  });

  it('keeps different days in different buckets for 7D', () => {
    const d1 = new Date('2026-06-15T08:00:00').getTime();
    const d2 = new Date('2026-06-16T08:00:00').getTime();
    expect(snapToBucket(d1, '7D')).not.toBe(snapToBucket(d2, '7D'));
  });

  it('snaps two times in the same hour to the same bucket for 24H', () => {
    const a = new Date('2026-06-15T08:05:00').getTime();
    const b = new Date('2026-06-15T08:55:00').getTime();
    expect(snapToBucket(a, '24H')).toBe(snapToBucket(b, '24H'));
  });

  it('snaps two days in the same month to the same bucket for 1Y', () => {
    const a = new Date('2026-06-01T00:00:00').getTime();
    const b = new Date('2026-06-28T00:00:00').getTime();
    expect(snapToBucket(a, '1Y')).toBe(snapToBucket(b, '1Y'));
  });

  it('is idempotent', () => {
    const ts = new Date('2026-06-15T13:42:00').getTime();
    const once = snapToBucket(ts, '7D');
    expect(snapToBucket(once, '7D')).toBe(once);
  });
});

describe('formatXLabel', () => {
  it('produces a non-empty label for every range', () => {
    for (const range of TIME_RANGES) {
      expect(formatXLabel(NOW, range).length).toBeGreaterThan(0);
    }
  });
});
