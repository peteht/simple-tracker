import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Entry, TimeRange } from '../types';
import { filterEntriesByRange, formatXLabel } from '../utils/timeRange';
import { colors, typography } from '../theme';

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 40, left: 48 };

interface Props {
  entries: Entry[];
  range: TimeRange;
  color: string;
  unit: string;
}

export default function TrackerChart({ entries, range, color, unit }: Props) {
  const width = Dimensions.get('window').width - 64; // account for screen padding

  const filtered = useMemo(
    () => filterEntriesByRange(entries, range),
    [entries, range]
  );

  if (filtered.length === 0) {
    return (
      <View style={[styles.empty, { height: CHART_HEIGHT + PADDING.bottom }]}>
        <Text style={styles.emptyText}>No data for this range</Text>
      </View>
    );
  }

  if (filtered.length === 1) {
    const entry = filtered[0];
    return (
      <View style={[styles.empty, { height: CHART_HEIGHT + PADDING.bottom }]}>
        <Text style={[styles.singleValue, { color }]}>{entry.value}</Text>
        <Text style={styles.emptyText}>{unit} · only one entry</Text>
      </View>
    );
  }

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const values = filtered.map(e => e.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const minVal = Math.max(0, dataMin);   // never go below zero
  const maxVal = dataMax;
  const valRange = maxVal - minVal || 1;

  const toX = (i: number) => PADDING.left + (i / (filtered.length - 1)) * innerW;
  const toY = (v: number) =>
    PADDING.top + innerH - ((v - minVal) / valRange) * innerH;

  // Build smooth line path
  const points = filtered.map((e, i) => ({ x: toX(i), y: toY(e.value) }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    pathD += ` C ${cp1x} ${points[i - 1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
  }

  // Fill area under curve
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x} ${PADDING.top + innerH}` +
    ` L ${points[0].x} ${PADDING.top + innerH} Z`;

  // Y-axis labels (3 ticks) — whole numbers only
  const yTicks = [minVal, Math.round(minVal + valRange / 2), maxVal];

  // X-axis labels — show max 5 evenly spaced
  const maxLabels = 5;
  const labelStep = Math.max(1, Math.floor(filtered.length / maxLabels));
  const xLabelIndices = filtered
    .map((_, i) => i)
    .filter(i => i % labelStep === 0 || i === filtered.length - 1);

  return (
    <Svg width={width} height={CHART_HEIGHT + PADDING.bottom}>
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <Line
          key={i}
          x1={PADDING.left}
          y1={toY(tick)}
          x2={PADDING.left + innerW}
          y2={toY(tick)}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}

      {/* Fill */}
      <Path d={fillD} fill={color} fillOpacity={0.08} />

      {/* Line */}
      <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => (
        <SvgText
          key={i}
          x={PADDING.left - 6}
          y={toY(tick) + 4}
          textAnchor="end"
          fontSize={11}
          fill={colors.textMuted}
        >
          {Math.round(tick)}
        </SvgText>
      ))}

      {/* X-axis labels */}
      {xLabelIndices.map(i => (
        <SvgText
          key={i}
          x={toX(i)}
          y={CHART_HEIGHT + 16}
          textAnchor="middle"
          fontSize={11}
          fill={colors.textMuted}
        >
          {formatXLabel(filtered[i].timestamp, range)}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  singleValue: {
    fontSize: 36,
    fontWeight: '700',
  },
});
