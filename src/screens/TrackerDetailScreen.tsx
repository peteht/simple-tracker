import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Tracker, Entry, TimeRange } from '../types';
import { getTrackers, getEntries, saveEntry, deleteEntry } from '../utils/storage';
import TrackerChart from '../components/TrackerChart';
import YesNoChart from '../components/YesNoChart';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { colors, spacing, radius, typography } from '../theme';
import { RootStackParamList } from '../../App';

type RouteT = RouteProp<RootStackParamList, 'TrackerDetail'>;

export default function TrackerDetailScreen() {
  const route = useRoute<RouteT>();
  const { trackerId } = route.params;

  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [range, setRange] = useState<TimeRange>('7D');
  const [value, setValue] = useState('');

  const load = useCallback(async () => {
    const all = await getTrackers();
    const t = all.find(x => x.id === trackerId) ?? null;
    setTracker(t);
    setEntries(await getEntries(trackerId));
  }, [trackerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLogNumber = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      Alert.alert('Invalid value', 'Please enter a number.');
      return;
    }
    await logValue(num);
    setValue('');
  };

  const handleLogYesNo = async (yes: boolean) => {
    await logValue(yes ? 1 : 0);
  };

  const logValue = async (num: number) => {
    const entry: Entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      trackerId,
      value: num,
      timestamp: Date.now(),
    };
    await saveEntry(entry);
    load();
  };

  const handleDeleteEntry = (entry: Entry) => {
    const label = tracker?.type === 'yesno'
      ? (entry.value === 1 ? 'Yes' : 'No')
      : `${entry.value}${tracker?.unit ? ' ' + tracker.unit : ''}`;
    Alert.alert('Delete entry?', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteEntry(entry.id); load(); },
      },
    ]);
  };

  if (!tracker) return null;

  const isYesNo = tracker.type === 'yesno';
  const sortedDesc = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  // Yes/No stats
  const yesCount = entries.filter(e => e.value === 1).length;
  const pct = entries.length > 0 ? Math.round((yesCount / entries.length) * 100) : 0;
  const streak = (() => {
    let s = 0;
    for (const e of sortedDesc) {
      if (e.value === 1) s++; else break;
    }
    return s;
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Log card */}
          <View style={styles.logCard}>
            <Text style={styles.logLabel}>LOG TODAY</Text>
            {isYesNo ? (
              <View style={styles.yesNoRow}>
                <TouchableOpacity
                  style={[styles.yesNoBtn, { backgroundColor: tracker.color }]}
                  onPress={() => handleLogYesNo(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.yesNoBtnText}>✓  Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, styles.noBtn]}
                  onPress={() => handleLogYesNo(false)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.yesNoBtnText, { color: colors.textSecondary }]}>✗  No</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.logRow}>
                <TextInput
                  style={styles.logInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleLogNumber}
                />
                {tracker.unit ? <Text style={styles.unitLabel}>{tracker.unit}</Text> : null}
                <TouchableOpacity style={styles.logBtn} onPress={handleLogNumber} activeOpacity={0.85}>
                  <Text style={styles.logBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <TimeRangeSelector selected={range} onChange={setRange} />
            <View style={{ marginTop: spacing.md }}>
              {isYesNo ? (
                <YesNoChart entries={entries} range={range} color={tracker.color} />
              ) : (
                <TrackerChart entries={entries} range={range} color={tracker.color} unit={tracker.unit} />
              )}
            </View>
          </View>

          {/* Stats */}
          {entries.length > 0 && (
            <View style={styles.statsRow}>
              {isYesNo ? (
                <>
                  <StatPill label="Total Yes" value={String(yesCount)} />
                  <StatPill label="Yes Rate" value={`${pct}%`} />
                  <StatPill label="Streak" value={`${streak} ✓`} />
                </>
              ) : (
                <>
                  <StatPill label="Entries" value={String(entries.length)} />
                  <StatPill
                    label="Latest"
                    value={`${sortedDesc[0].value}${tracker.unit ? ' ' + tracker.unit : ''}`}
                  />
                  <StatPill
                    label="Avg"
                    value={`${(entries.reduce((s, e) => s + e.value, 0) / entries.length).toFixed(1)}${tracker.unit ? ' ' + tracker.unit : ''}`}
                  />
                </>
              )}
            </View>
          )}

          {/* History */}
          {sortedDesc.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionLabel}>HISTORY</Text>
              {sortedDesc.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.historyRow}
                  onLongPress={() => handleDeleteEntry(entry)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.historyDot,
                      isYesNo
                        ? { backgroundColor: entry.value === 1 ? tracker.color : colors.danger, opacity: entry.value === 1 ? 1 : 0.5 }
                        : { backgroundColor: tracker.color },
                    ]}
                  />
                  <Text style={styles.historyValue}>
                    {isYesNo ? (entry.value === 1 ? 'Yes' : 'No') : `${entry.value}${tracker.unit ? ' ' + tracker.unit : ''}`}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.timestamp).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  value: { ...typography.subtitle, fontWeight: '700' },
  label: { ...typography.small, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  yesNoRow: { flexDirection: 'row', gap: spacing.sm },
  yesNoBtn: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  noBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yesNoBtnText: { color: colors.white, fontWeight: '700', fontSize: 17 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  unitLabel: { ...typography.body, color: colors.textSecondary },
  logBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  logBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  historySection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyValue: { ...typography.body, fontWeight: '500', flex: 1 },
  historyDate: { ...typography.caption },
});
