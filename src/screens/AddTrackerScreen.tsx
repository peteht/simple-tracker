import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { saveTracker } from '../utils/storage';
import { Tracker } from '../types';
import { colors, spacing, radius, typography, TRACKER_COLORS } from '../theme';

export default function AddTrackerScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedColor, setSelectedColor] = useState(TRACKER_COLORS[0]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your tracker a name.');
      return;
    }
    const tracker: Tracker = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      unit: unit.trim(),
      createdAt: Date.now(),
      color: selectedColor,
    };
    await saveTracker(tracker);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
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

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>UNIT (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. lbs, hrs, km, $…"
            placeholderTextColor={colors.textMuted}
            value={unit}
            onChangeText={setUnit}
            returnKeyType="done"
          />

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
