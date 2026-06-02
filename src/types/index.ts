export type TimeRange = '24H' | '7D' | '1M' | '1Y' | 'ALL';

export interface Tracker {
  id: string;
  name: string;
  unit: string;
  createdAt: number;
  color: string;
}

export interface Entry {
  id: string;
  trackerId: string;
  value: number;
  timestamp: number; // ms since epoch
  note?: string;
}
