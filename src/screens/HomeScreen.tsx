import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tracker } from '../types';
import { getTrackers, getEntries, deleteTracker } from '../utils/storage';
import { colors, spacing, radius, typography } from '../theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [lastValues, setLastValues] = useState<Record<string, number | null>>({});

  const load = useCallback(async () => {
    const list = await getTrackers();
    setTrackers(list);
    const vals: Record<string, number | null> = {};
    for (const t of list) {
      const entries = await getEntries(t.id);
      vals[t.id] = entries.length > 0 ? entries[entries.length - 1].value : null;
    }
    setLastValues(vals);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
        </View>
      ) : (
        <FlatList
          data={trackers}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cardBody: { flex: 1 },
  cardName: { ...typography.subtitle },
  cardLast: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, marginTop: -1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.title, color: colors.textSecondary },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
