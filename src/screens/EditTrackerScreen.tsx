import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTrackers, updateTracker } from '../utils/storage';
import { Tracker } from '../types';
import { colors, spacing, radius, typography, TRACKER_COLORS } from '../theme';
import { RootStackParamList } from '../../App';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'EditTracker'>;
type Route = RouteProp<RootStackParamList, 'EditTracker'>;

export default function EditTrackerScreen() {
  const navigation = useNavigation<Nav>();
  const { trackerId } = useRoute<Route>().params;

  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState(TRACKER_COLORS[0]);

  useFocusEffect(useCallback(() => {
    getTrackers().then(list => {
      const t = list.find(x => x.id === trackerId);
      if (t) {
        setTracker(t);
        setName(t.name);
        setUnit(t.unit);
        setColor(t.color);
      }
    });
  }, [trackerId]));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your tracker a name.');
      return;
    }
    if (!tracker) return;
    await updateTracker({ ...tracker, name: name.trim(), unit: unit.trim(), color });
    navigation.goBack();
  };

  if (!tracker) return null;

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
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
            placeholderTextColor={colors.textMuted}
          />

          {tracker.type === 'number' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>UNIT</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g. lbs, hrs, km, $…"
                placeholderTextColor={colors.textMuted}
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
                  color === c && styles.colorSwatchActive,
                ]}
                onPress={() => setColor(c)}
                activeOpacity={0.8}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
  colorRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
