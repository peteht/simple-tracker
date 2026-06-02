import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveTracker } from '../utils/storage';
import { Tracker, TrackerType, TrackerCadence } from '../types';
import { colors, spacing, radius, typography, TRACKER_COLORS } from '../theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddTracker'>;

export default function AddTrackerScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState<TrackerType>('number');
  const [cadence, setCadence] = useState<TrackerCadence>('daily');
  const [selectedColor, setSelectedColor] = useState(TRACKER_COLORS[0]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your tracker a name.');
      return;
    }
    const tracker: Tracker = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      unit: type === 'yesno' ? '' : unit.trim(),
      type,
      cadence,
      createdAt: Date.now(),
      color: selectedColor,
    };
    await saveTracker(tracker);
    navigation.replace('TrackerDetail', { trackerId: tracker.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>TRACKER NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weight, Sleep Hours, Steps…"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'number' && styles.typeBtnActive]}
              onPress={() => setType('number')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, type === 'number' && styles.typeBtnTextActive]}>
                123  Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'yesno' && styles.typeBtnActive]}
              onPress={() => setType('yesno')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, type === 'yesno' && styles.typeBtnTextActive]}>
                ✓/✗  Yes / No
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>HOW OFTEN</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, cadence === 'daily' && styles.typeBtnActive]}
              onPress={() => setCadence('daily')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, cadence === 'daily' && styles.typeBtnTextActive]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, cadence === 'weekly' && styles.typeBtnActive]}
              onPress={() => setCadence('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, cadence === 'weekly' && styles.typeBtnTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>

          {type === 'number' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>UNIT (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. lbs, hrs, km, $…"
                placeholderTextColor={colors.textMuted}
                value={unit}
                onChangeText={setUnit}
                returnKeyType="done"
              />
            </>
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {TRACKER_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorSwatchActive,
                ]}
                onPress={() => setSelectedColor(c)}
                activeOpacity={0.8}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Create Tracker</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  sectionLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  typeBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeBtnTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
