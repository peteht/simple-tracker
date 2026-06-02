import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tracker, Entry } from '../types';

const TRACKERS_KEY = '@simple_tracker:trackers';
const ENTRIES_KEY = '@simple_tracker:entries';

export async function getTrackers(): Promise<Tracker[]> {
  const raw = await AsyncStorage.getItem(TRACKERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTracker(tracker: Tracker): Promise<void> {
  const trackers = await getTrackers();
  await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify([tracker, ...trackers]));
}

export async function updateTracker(updated: Tracker): Promise<void> {
  const trackers = await getTrackers();
  await AsyncStorage.setItem(
    TRACKERS_KEY,
    JSON.stringify(trackers.map(t => (t.id === updated.id ? updated : t)))
  );
}

export async function deleteTracker(id: string): Promise<void> {
  const trackers = await getTrackers();
  await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(trackers.filter(t => t.id !== id)));
  const entries = await getEntries(id);
  if (entries.length > 0) {
    const all = await getAllEntries();
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all.filter(e => e.trackerId !== id)));
  }
}

export async function getAllEntries(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getEntries(trackerId: string): Promise<Entry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.trackerId === trackerId).sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveEntry(entry: Entry): Promise<void> {
  const all = await getAllEntries();
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify([...all, entry]));
}

export async function deleteEntry(id: string): Promise<void> {
  const all = await getAllEntries();
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all.filter(e => e.id !== id)));
}
