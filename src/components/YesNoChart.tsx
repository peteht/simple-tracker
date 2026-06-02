import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Entry, TimeRange } from '../types';
import { filterEntriesByRange, formatXLabel } from '../utils/timeRange';
import { colors, spacing, typography } from '../theme';

interface DayBucket {
  label: string;
  state: 'yes' | 'no' | 'empty';
}

interface Props {
  entries: Entry[];
  range: TimeRange;
  color: string;
}

export default function YesNoChart({ entries, range, color }: Props) {
  const buckets = useMemo<DayBucket[]>(() => {
    const now = Date.now();
    const filtered = filterEntriesByRange(entries, range);

    // Determine bucket size
    let numBuckets: number;
    let bucketMs: number;

    if (range === '24H') {
      numBuckets = 24;
      bucketMs = 60 * 60 * 1000;
    } else if (range === '7D') {
      numBuckets = 7;
      bucketMs = 24 * 60 * 60 * 1000;
    } else if (range === '1M') {
      numBuckets = 30;
      bucketMs = 24 * 60 * 60 * 1000;
    } else if (range === '1Y') {
      numBuckets = 12;
      bucketMs = 30 * 24 * 60 * 60 * 1000;
    } else {
      // ALL — use days, capped at 60
      if (filtered.length === 0) return [];
      const oldest = Math.min(...filtered.map(e => e.timestamp));
      const totalDays = Math.ceil((now - oldest) / (24 * 60 * 60 * 1000)) + 1;
      numBuckets = Math.min(totalDays, 60);
      bucketMs = 24 * 60 * 60 * 1000;
    }

    const result: DayBucket[] = [];
    for (let i = numBuckets - 1; i >= 0; i--) {
      const bucketEnd = now - i * bucketMs;
      const bucketStart = bucketEnd - bucketMs;
      const inBucket = filtered.filter(
        e => e.timestamp >= bucketStart && e.timestamp < bucketEnd
      );
      let state: DayBucket['state'] = 'empty';
      if (inBucket.length > 0) {
        state = inBucket.some(e => e.value === 1) ? 'yes' : 'no';
      }
      result.push({ label: formatXLabel(bucketStart, range), state });
    }
    return result;
  }, [entries, range]);

  if (buckets.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data for this range</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {buckets.map((b, i) => (
          <View key={i} style={styles.dotCol}>
            <View
              style={[
                styles.dot,
                b.state === 'yes' && { backgroundColor: color },
                b.state === 'no'  && styles.dotNo,
                b.state === 'empty' && styles.dotEmpty,
              ]}
            />
          </View>
        ))}
      </View>
      {/* Show a few evenly spaced x labels */}
      <View style={styles.labelRow}>
        {[0, Math.floor(buckets.length / 2), buckets.length - 1].map(idx => (
          <Text key={idx} style={styles.label}>
            {buckets[idx]?.label ?? ''}
          </Text>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Yes</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotNo]} />
          <Text style={styles.legendText}>No</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotEmpty]} />
          <Text style={styles.legendText}>No entry</Text>
        </View>
      </View>
    </View>
  );
}

const DOT = 14;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  dotCol: { alignItems: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  dotNo: {
    backgroundColor: colors.danger,
    opacity: 0.5,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  label: { ...typography.small },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small },
  empty: { height: 100, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
