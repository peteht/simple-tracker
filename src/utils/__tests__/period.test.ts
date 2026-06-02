import { getPeriodStart, findCurrentPeriodEntry } from '../period';
import { Entry } from '../../types';

const DAY = 24 * 60 * 60 * 1000;

function entry(timestamp: number, value = 1): Entry {
  return { id: `${timestamp}`, trackerId: 't1', value, timestamp };
}

describe('getPeriodStart', () => {
  it('daily: returns local midnight of the same day', () => {
    const now = new Date('2026-06-15T13:42:09').getTime();
    const start = new Date(getPeriodStart(now, 'daily'));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getDate()).toBe(15);
  });

  it('daily: start is at or before now and within 24h', () => {
    const now = new Date('2026-06-15T13:42:09').getTime();
    const start = getPeriodStart(now, 'daily');
    expect(start).toBeLessThanOrEqual(now);
    expect(now - start).toBeLessThan(DAY);
  });

  it('weekly: snaps to Monday midnight (mid-week)', () => {
    // 2026-06-17 is a Wednesday
    const now = new Date('2026-06-17T09:00:00').getTime();
    const start = new Date(getPeriodStart(now, 'weekly'));
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(15); // Mon 2026-06-15
    expect(start.getHours()).toBe(0);
  });

  it('weekly: Sunday snaps back to the previous Monday, not forward', () => {
    // 2026-06-21 is a Sunday
    const now = new Date('2026-06-21T09:00:00').getTime();
    const start = new Date(getPeriodStart(now, 'weekly'));
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(15); // Mon of that week
  });

  it('weekly: Monday maps to itself', () => {
    const now = new Date('2026-06-15T09:00:00').getTime(); // Monday
    const start = new Date(getPeriodStart(now, 'weekly'));
    expect(start.getDate()).toBe(15);
    expect(start.getHours()).toBe(0);
  });
});

describe('findCurrentPeriodEntry', () => {
  const now = new Date('2026-06-17T12:00:00').getTime(); // Wednesday

  it('returns null when there are no entries', () => {
    expect(findCurrentPeriodEntry([], 'daily', now)).toBeNull();
  });

  it('defaults to the real now when no timestamp is passed', () => {
    // Exercises the Date.now() default param; empty list keeps it deterministic.
    expect(findCurrentPeriodEntry([], 'daily')).toBeNull();
  });

  it('daily: finds an entry logged earlier today', () => {
    const today = new Date('2026-06-17T08:00:00').getTime();
    const found = findCurrentPeriodEntry([entry(today)], 'daily', now);
    expect(found?.timestamp).toBe(today);
  });

  it('daily: ignores yesterday', () => {
    const yesterday = new Date('2026-06-16T08:00:00').getTime();
    expect(findCurrentPeriodEntry([entry(yesterday)], 'daily', now)).toBeNull();
  });

  it('weekly: finds an entry from earlier this week (Monday)', () => {
    const monday = new Date('2026-06-15T08:00:00').getTime();
    const found = findCurrentPeriodEntry([entry(monday)], 'weekly', now);
    expect(found?.timestamp).toBe(monday);
  });

  it('weekly: ignores last week', () => {
    const lastWeek = new Date('2026-06-14T08:00:00').getTime(); // Sunday before
    expect(findCurrentPeriodEntry([entry(lastWeek)], 'weekly', now)).toBeNull();
  });

  it('daily: an entry that falls in this week but not today is ignored by daily', () => {
    const monday = new Date('2026-06-15T08:00:00').getTime();
    expect(findCurrentPeriodEntry([entry(monday)], 'daily', now)).toBeNull();
  });
});
