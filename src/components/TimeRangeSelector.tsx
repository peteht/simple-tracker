import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimeRange } from '../types';
import { TIME_RANGES } from '../utils/timeRange';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function TimeRangeSelector({ selected, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TIME_RANGES.map(range => (
        <TouchableOpacity
          key={range}
          style={[styles.pill, selected === range && styles.pillActive]}
          onPress={() => onChange(range)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, selected === range && styles.labelActive]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 3,
    gap: 2,
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  pillActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
