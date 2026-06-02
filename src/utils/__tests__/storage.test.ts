jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackers,
  saveTracker,
  updateTracker,
  deleteTracker,
  getAllEntries,
  getEntries,
  saveEntry,
  deleteEntry,
} from '../storage';
import { Tracker, Entry } from '../../types';

const TRACKERS_KEY = '@simple_tracker:trackers';

function makeTracker(over: Partial<Tracker> = {}): Tracker {
  return {
    id: over.id ?? 't1',
    name: over.name ?? 'Weight',
    unit: over.unit ?? 'lbs',
    type: over.type ?? 'number',
    cadence: over.cadence ?? 'daily',
    createdAt: over.createdAt ?? 1000,
    color: over.color ?? '#5C7A6E',
  };
}

function makeEntry(over: Partial<Entry> = {}): Entry {
  return {
    id: over.id ?? 'e1',
    trackerId: over.trackerId ?? 't1',
    value: over.value ?? 100,
    timestamp: over.timestamp ?? 1000,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('tracker CRUD', () => {
  it('starts empty', async () => {
    expect(await getTrackers()).toEqual([]);
  });

  it('saveTracker prepends (newest first)', async () => {
    await saveTracker(makeTracker({ id: 'a' }));
    await saveTracker(makeTracker({ id: 'b' }));
    const ids = (await getTrackers()).map(t => t.id);
    expect(ids).toEqual(['b', 'a']);
  });

  it('updateTracker replaces the matching tracker by id', async () => {
    await saveTracker(makeTracker({ id: 'a', name: 'Old' }));
    await updateTracker(makeTracker({ id: 'a', name: 'New' }));
    const list = await getTrackers();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('New');
  });

  it('updateTracker leaves other trackers untouched', async () => {
    await saveTracker(makeTracker({ id: 'a', name: 'A' }));
    await saveTracker(makeTracker({ id: 'b', name: 'B' }));
    await updateTracker(makeTracker({ id: 'a', name: 'A2' }));
    const byId = Object.fromEntries((await getTrackers()).map(t => [t.id, t.name]));
    expect(byId).toEqual({ a: 'A2', b: 'B' });
  });

  it('deleteTracker removes the tracker', async () => {
    await saveTracker(makeTracker({ id: 'a' }));
    await saveTracker(makeTracker({ id: 'b' }));
    await deleteTracker('a');
    expect((await getTrackers()).map(t => t.id)).toEqual(['b']);
  });

  it('deleteTracker cascades to its entries but keeps others', async () => {
    await saveTracker(makeTracker({ id: 'a' }));
    await saveTracker(makeTracker({ id: 'b' }));
    await saveEntry(makeEntry({ id: 'e1', trackerId: 'a' }));
    await saveEntry(makeEntry({ id: 'e2', trackerId: 'b' }));
    await deleteTracker('a');
    const remaining = await getAllEntries();
    expect(remaining.map(e => e.id)).toEqual(['e2']);
  });
});

describe('migration backfill', () => {
  it('fills cadence and type for legacy trackers missing those fields', async () => {
    // Simulate data written before cadence/type existed.
    const legacy = [{ id: 'old', name: 'Steps', unit: '', createdAt: 1, color: '#000' }];
    await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(legacy));

    const [t] = await getTrackers();
    expect(t.cadence).toBe('daily');
    expect(t.type).toBe('number');
  });

  it('does not overwrite existing cadence/type', async () => {
    await saveTracker(makeTracker({ id: 'a', type: 'yesno', cadence: 'weekly' }));
    const [t] = await getTrackers();
    expect(t.type).toBe('yesno');
    expect(t.cadence).toBe('weekly');
  });
});

describe('entry CRUD', () => {
  it('saveEntry appends entries', async () => {
    await saveEntry(makeEntry({ id: 'e1' }));
    await saveEntry(makeEntry({ id: 'e2' }));
    expect((await getAllEntries()).map(e => e.id)).toEqual(['e1', 'e2']);
  });

  it('getEntries filters by trackerId', async () => {
    await saveEntry(makeEntry({ id: 'e1', trackerId: 'a' }));
    await saveEntry(makeEntry({ id: 'e2', trackerId: 'b' }));
    await saveEntry(makeEntry({ id: 'e3', trackerId: 'a' }));
    const result = await getEntries('a');
    expect(result.map(e => e.id)).toEqual(['e1', 'e3']);
  });

  it('getEntries returns entries sorted ascending by timestamp', async () => {
    await saveEntry(makeEntry({ id: 'late', trackerId: 'a', timestamp: 300 }));
    await saveEntry(makeEntry({ id: 'early', trackerId: 'a', timestamp: 100 }));
    await saveEntry(makeEntry({ id: 'mid', trackerId: 'a', timestamp: 200 }));
    expect((await getEntries('a')).map(e => e.id)).toEqual(['early', 'mid', 'late']);
  });

  it('deleteEntry removes only the matching entry', async () => {
    await saveEntry(makeEntry({ id: 'e1' }));
    await saveEntry(makeEntry({ id: 'e2' }));
    await deleteEntry('e1');
    expect((await getAllEntries()).map(e => e.id)).toEqual(['e2']);
  });
});
