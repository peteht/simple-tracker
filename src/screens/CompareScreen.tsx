import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Tracker, Entry, TimeRange } from '../types';
import { getTrackers, getEntries } from '../utils/storage';
import MultiChart, { TrackerSeries } from '../components/MultiChart';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { colors, spacing, radius, typography, card } from '../theme';

const MAX_SELECTED = 3;

export default function CompareScreen() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [entriesById, setEntriesById] = useState<Record<string, Entry[]>>({});
  const [range, setRange] = useState<TimeRange>('7D');

  useFocusEffect(useCallback(() => {
    // Refresh tracker list on focus so edits/deletes elsewhere show up.
    getTrackers().then(setTrackers);
  }, []));

  const loadEntriesFor = useCallback(async (id: string) => {
    if (entriesById[id]) return; // already cached
    const entries = await getEntries(id);
    setEntriesById(prev => ({ ...prev, [id]: entries }));
  }, [entriesById]);

  const toggleTracker = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_SELECTED) return prev; // at max — ignore tap
      loadEntriesFor(id);
      return [...prev, id];
    });
  };

  // Build series at render time from the live tracker list, so name/color
  // edits are always current. Dropped trackers (deleted) fall out here.
  const seriesData: TrackerSeries[] = selected
    .map(id => {
      const tracker = trackers.find(t => t.id === id);
      return tracker ? { tracker, entries: entriesById[id] ?? [] } : null;
    })
    .filter((s): s is TrackerSeries => s !== null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Chart + time range */}
        {seriesData.length > 0 ? (
          <View style={styles.chartCard}>
            <TimeRangeSelector selected={range} onChange={setRange} />
            <View style={{ marginTop: spacing.md }}>
              <MultiChart series={seriesData} range={range} />
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              {seriesData.map(s => {
                const latestLabel = s.tracker.type === 'yesno' ? 'Yes / No' : s.tracker.unit;
                return (
                  <View key={s.tracker.id} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: s.tracker.color }]} />
                    <Text style={styles.legendName}>{s.tracker.name}</Text>
                    <Text style={styles.legendValue}>{latestLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyTitle}>Select trackers below</Text>
            <Text style={styles.emptyBody}>Pick up to {MAX_SELECTED} to compare on the same chart.</Text>
          </View>
        )}

        {/* Tracker picker */}
        <Text style={styles.sectionLabel}>
          YOUR TRACKERS
          {selected.length === MAX_SELECTED && (
            <Text style={styles.maxNote}> · max {MAX_SELECTED} selected</Text>
          )}
        </Text>

        {trackers.length === 0 ? (
          <Text style={styles.noTrackers}>No trackers yet — create some first.</Text>
        ) : (
          trackers.map(t => {
            const isSelected = selected.includes(t.id);
            const isDisabled = !isSelected && selected.length >= MAX_SELECTED;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.trackerRow,
                  isSelected && { borderColor: t.color, borderWidth: 2 },
                  isDisabled && styles.trackerRowDisabled,
                ]}
                onPress={() => toggleTracker(t.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                <View style={styles.trackerInfo}>
                  <Text style={[styles.trackerName, isDisabled && { color: colors.textMuted }]}>
                    {t.name}
                  </Text>
                  <Text style={styles.trackerMeta}>
                    {t.type === 'yesno' ? 'Yes / No' : t.unit || 'Number'} · {t.cadence}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && { backgroundColor: t.color, borderColor: t.color },
                ]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md },

  chartCard: card,

  emptyChart: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.subtitle, color: colors.textSecondary },
  emptyBody: { ...typography.caption, textAlign: 'center' },

  legend: { marginTop: spacing.md, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { ...typography.body, flex: 1 },
  legendValue: { ...typography.caption, fontWeight: '600' },

  sectionLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  maxNote: { color: colors.textMuted, fontWeight: '400' },
  noTrackers: { ...typography.caption, color: colors.textMuted },

  trackerRow: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackerRowDisabled: { opacity: 0.4 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  trackerInfo: { flex: 1 },
  trackerName: { ...typography.subtitle },
  trackerMeta: { ...typography.caption, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
