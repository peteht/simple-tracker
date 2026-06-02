import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tracker } from '../types';
import { getTrackers, getAllEntries, deleteTracker } from '../utils/storage';
import { seedSampleData } from '../utils/devSeed';
import { colors, spacing, radius, typography, card as cardStyle } from '../theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [lastValues, setLastValues] = useState<Record<string, number | null>>({});

  const load = useCallback(async () => {
    const [list, allEntries] = await Promise.all([getTrackers(), getAllEntries()]);
    setTrackers(list);

    // Single pass over all entries: keep the most recent value per tracker.
    const latestTs: Record<string, number> = {};
    const vals: Record<string, number | null> = {};
    for (const e of allEntries) {
      if (latestTs[e.trackerId] === undefined || e.timestamp > latestTs[e.trackerId]) {
        latestTs[e.trackerId] = e.timestamp;
        vals[e.trackerId] = e.value;
      }
    }
    setLastValues(vals);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSeed = () => {
    Alert.alert(
      'Load sample data?',
      'This replaces ALL current trackers and entries with ~6 months of generated sample data for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            await seedSampleData();
            load();
          },
        },
      ]
    );
  };

  const handleDelete = (tracker: Tracker) => {
    Alert.alert(
      `Delete "${tracker.name}"?`,
      'All entries will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTracker(tracker.id);
            load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Trackers</Text>
        <View style={styles.headerButtons}>
          {trackers.length > 1 && (
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={() => navigation.navigate('Compare')}
              activeOpacity={0.8}
            >
              <Text style={styles.compareBtnText}>Compare</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddTracker')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {trackers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing tracked yet</Text>
          <Text style={styles.emptyBody}>Tap + New to create your first tracker.</Text>
          {__DEV__ && (
            <TouchableOpacity style={styles.devBtn} onPress={handleSeed} activeOpacity={0.8}>
              <Text style={styles.devBtnText}>🌱 Load sample data (dev)</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={trackers}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            __DEV__ ? (
              <TouchableOpacity style={styles.devBtn} onPress={handleSeed} activeOpacity={0.8}>
                <Text style={styles.devBtnText}>🌱 Reset & load sample data (dev)</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TrackerDetail', { trackerId: item.id })}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.85}
            >
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                {lastValues[item.id] != null && (
                  <Text style={styles.cardLast}>
                    Last: {lastValues[item.id]} {item.unit}
                  </Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.largeTitle },
  headerButtons: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  compareBtn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  compareBtnText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: {
    ...cardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cardBody: { flex: 1 },
  cardName: { ...typography.subtitle },
  cardLast: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, marginTop: -1 },
  devBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignSelf: 'center',
  },
  devBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.title, color: colors.textSecondary },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
