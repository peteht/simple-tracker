import { average, yesCount, yesRate, currentStreak } from '../stats';
import { Entry } from '../../types';

function entry(timestamp: number, value: number): Entry {
  return { id: `${timestamp}`, trackerId: 't1', value, timestamp };
}

describe('average', () => {
  it('returns 0 for an empty list', () => {
    expect(average([])).toBe(0);
  });

  it('computes the mean', () => {
    expect(average([entry(1, 10), entry(2, 20), entry(3, 30)])).toBe(20);
  });

  it('handles a single entry', () => {
    expect(average([entry(1, 7)])).toBe(7);
  });
});

describe('yesCount', () => {
  it('counts only value === 1', () => {
    expect(yesCount([entry(1, 1), entry(2, 0), entry(3, 1)])).toBe(2);
  });

  it('is 0 for an all-no list', () => {
    expect(yesCount([entry(1, 0), entry(2, 0)])).toBe(0);
  });
});

describe('yesRate', () => {
  it('returns 0 for an empty list', () => {
    expect(yesRate([])).toBe(0);
  });

  it('computes a rounded percentage', () => {
    // 2 of 3 = 66.67 -> 67
    expect(yesRate([entry(1, 1), entry(2, 1), entry(3, 0)])).toBe(67);
  });

  it('is 100 when all yes', () => {
    expect(yesRate([entry(1, 1), entry(2, 1)])).toBe(100);
  });
});

describe('currentStreak', () => {
  it('returns 0 for an empty list', () => {
    expect(currentStreak([])).toBe(0);
  });

  it('counts consecutive yes from the most recent backwards', () => {
    // newest -> oldest: yes, yes, no, yes  => streak 2
    const entries = [
      entry(4, 1),
      entry(3, 1),
      entry(2, 0),
      entry(1, 1),
    ];
    expect(currentStreak(entries)).toBe(2);
  });

  it('is order-independent (sorts internally)', () => {
    const shuffled = [entry(1, 1), entry(4, 1), entry(2, 0), entry(3, 1)];
    expect(currentStreak(shuffled)).toBe(2);
  });

  it('is 0 when the most recent entry is a no', () => {
    expect(currentStreak([entry(1, 1), entry(2, 0)])).toBe(0);
  });

  it('counts the whole list when all yes', () => {
    expect(currentStreak([entry(1, 1), entry(2, 1), entry(3, 1)])).toBe(3);
  });
});
