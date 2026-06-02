import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { TimeRange, Tracker, Entry } from '../types';
import { filterEntriesByRange, formatXLabel, snapToBucket } from '../utils/timeRange';
import { colors, typography } from '../theme';

export interface TrackerSeries {
  tracker: Tracker;
  entries: Entry[];
}

interface Props {
  series: TrackerSeries[];
  range: TimeRange;
}

const INNER_H = 180;
const PAD = { top: 20, right: 16, bottom: 40, left: 52 };
const YESNO_ROW_H = 28;

export default function MultiChart({ series, range }: Props) {
  const width = Dimensions.get('window').width - 64;
  const innerW = width - PAD.left - PAD.right;

  const yesnoSeries = series.filter(s => s.tracker.type === 'yesno');
  const svgHeight = PAD.top + INNER_H + PAD.bottom + yesnoSeries.length * YESNO_ROW_H;

  const computed = useMemo(() => {
    const withFiltered = series.map(s => ({
      ...s,
      filtered: filterEntriesByRange(s.entries, range),
    }));

    const allEntries = withFiltered.flatMap(s => s.filtered);
    if (allEntries.length === 0) return null;

    // --- X axis: global timestamp range, snapped to bucket ---
    const snapped = allEntries.map(e => snapToBucket(e.timestamp, range));
    const globalMinTs = Math.min(...snapped);
    const globalMaxTs = Math.max(...snapped);
    const tsSpan = globalMaxTs - globalMinTs || 1;
    const toX = (ts: number) => PAD.left + ((snapToBucket(ts, range) - globalMinTs) / tsSpan) * innerW;

    // --- Y axis: global value range across all number trackers ---
    const numberEntries = withFiltered
      .filter(s => s.tracker.type === 'number')
      .flatMap(s => s.filtered);

    const allValues = numberEntries.map(e => e.value);
    const rawMin = allValues.length > 0 ? Math.min(...allValues) : 0;
    const rawMax = allValues.length > 0 ? Math.max(...allValues) : 1;

    // Pad the top a little; floor at zero
    const topPadding = (rawMax - rawMin) * 0.1 || 1;
    const yMin = Math.max(0, rawMin);
    const yMax = rawMax + topPadding;
    const ySpan = yMax - yMin || 1;

    const toY = (v: number) => PAD.top + INNER_H - ((v - yMin) / ySpan) * INNER_H;

    // 4 evenly spaced Y grid ticks — whole numbers only
    const yTicks = Array.from({ length: 4 }, (_, i) => {
      const v = Math.round(yMin + (i / 3) * ySpan);
      return { y: toY(v), label: String(v) };
    });

    // Number tracker lines
    const lines = withFiltered
      .filter(s => s.tracker.type === 'number')
      .map(s => ({
        tracker: s.tracker,
        points: s.filtered.map(e => ({
          x: toX(e.timestamp),
          y: toY(e.value),
          raw: e.value,
        })),
      }));

    // Yes/No dot strips
    const dots = withFiltered
      .filter(s => s.tracker.type === 'yesno')
      .map(s => ({
        tracker: s.tracker,
        points: s.filtered.map(e => ({
          x: toX(e.timestamp),
          yes: e.value === 1,
        })),
      }));

    // 5 evenly spaced X labels
    const xLabels = Array.from({ length: 5 }, (_, i) => {
      const ts = globalMinTs + (i / 4) * tsSpan;
      return { x: toX(ts), label: formatXLabel(ts, range) };
    });

    return { lines, dots, xLabels, yTicks };
  }, [series, range, innerW]);

  if (!computed) {
    return (
      <View style={[styles.empty, { height: svgHeight }]}>
        <Text style={styles.emptyText}>No data for this range</Text>
      </View>
    );
  }

  const { lines, dots, xLabels, yTicks } = computed;

  return (
    <Svg width={width} height={svgHeight}>
      {/* Y grid lines + labels */}
      {yTicks.map((tick, i) => (
        <React.Fragment key={i}>
          <Line
            x1={PAD.left} y1={tick.y}
            x2={PAD.left + innerW} y2={tick.y}
            stroke={colors.border} strokeWidth={1} strokeDasharray="4,4"
          />
          <SvgText
            x={PAD.left - 6} y={tick.y + 4}
            textAnchor="end" fontSize={10} fill={colors.textMuted}
          >
            {tick.label}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Number tracker lines */}
      {lines.map(s => {
        if (s.points.length === 0) return null;
        if (s.points.length === 1) {
          return (
            <Circle
              key={s.tracker.id}
              cx={s.points[0].x} cy={s.points[0].y}
              r={5} fill={s.tracker.color}
            />
          );
        }
        let d = `M ${s.points[0].x} ${s.points[0].y}`;
        for (let i = 1; i < s.points.length; i++) {
          const cpx = (s.points[i - 1].x + s.points[i].x) / 2;
          d += ` C ${cpx} ${s.points[i - 1].y}, ${cpx} ${s.points[i].y}, ${s.points[i].x} ${s.points[i].y}`;
        }
        return (
          <React.Fragment key={s.tracker.id}>
            <Path d={d} fill="none" stroke={s.tracker.color} strokeWidth={2.5} strokeLinecap="round" />
            {s.points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={s.tracker.color} />
            ))}
          </React.Fragment>
        );
      })}

      {/* X axis labels */}
      {xLabels.map((l, i) => (
        <SvgText
          key={i}
          x={l.x} y={PAD.top + INNER_H + 20}
          textAnchor="middle" fontSize={10} fill={colors.textMuted}
        >
          {l.label}
        </SvgText>
      ))}

      {/* Yes/No dot strips */}
      {dots.map((s, rowIdx) => {
        const cy = PAD.top + INNER_H + PAD.bottom + rowIdx * YESNO_ROW_H + YESNO_ROW_H / 2;
        return (
          <React.Fragment key={s.tracker.id}>
            <Line
              x1={PAD.left} y1={cy} x2={PAD.left + innerW} y2={cy}
              stroke={colors.border} strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 6} y={cy + 4}
              textAnchor="end" fontSize={9} fill={s.tracker.color}
            >
              {s.tracker.name.length > 7 ? s.tracker.name.slice(0, 6) + '…' : s.tracker.name}
            </SvgText>
            {s.points.map((p, i) => (
              <Circle
                key={i} cx={p.x} cy={cy} r={5}
                fill={p.yes ? s.tracker.color : colors.danger}
                fillOpacity={p.yes ? 1 : 0.45}
              />
            ))}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
