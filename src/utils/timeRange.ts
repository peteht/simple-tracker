import { TimeRange, Entry } from '../types';

export function filterEntriesByRange(entries: Entry[], range: TimeRange): Entry[] {
  if (range === 'ALL') return entries;
  const now = Date.now();
  const cutoff: Record<Exclude<TimeRange, 'ALL'>, number> = {
    '24H': now - 24 * 60 * 60 * 1000,
    '7D': now - 7 * 24 * 60 * 60 * 1000,
    '1M': now - 30 * 24 * 60 * 60 * 1000,
    '1Y': now - 365 * 24 * 60 * 60 * 1000,
  };
  return entries.filter(e => e.timestamp >= cutoff[range]);
}

export function formatXLabel(timestamp: number, range: TimeRange): string {
  const d = new Date(timestamp);
  switch (range) {
    case '24H':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    case '7D':
      return d.toLocaleDateString([], { weekday: 'short' });
    case '1M':
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case '1Y':
      return d.toLocaleDateString([], { month: 'short' });
    case 'ALL':
      return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }
}

export const TIME_RANGES: TimeRange[] = ['24H', '7D', '1M', '1Y', 'ALL'];
