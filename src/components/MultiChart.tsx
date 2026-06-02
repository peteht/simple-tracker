import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Entry, TimeRange, Tracker } from '../types';
import { filterEntriesByRange, formatXLabel } from '../utils/timeRange';
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
const PAD = { top: 20, right: 16, bottom: 40, left: 44 };
const YESNO_ROW_H = 28;

export default function MultiChart({ series, range }: Props) {
  const width = Dimensions.get('window').width - 64;
  const innerW = width - PAD.left - PAD.right;

  const numberSeries = series.filter(s => s.tracker.type === 'number');
  const yesnoSeries  = series.filter(s => s.tracker.type === 'yesno');
  const svgHeight = PAD.top + INNER_H + PAD.bottom + yesnoSeries.length * YESNO_ROW_H;

  const computed = useMemo(() => {
    const withFiltered = series.map(s => ({
      ...s,
      filtered: filterEntriesByRange(s.entries, range),
    }));

    const allEntries = withFiltered.flatMap(s => s.filtered);
    if (allEntries.length === 0) return null;

    const globalMinTs = Math.min(...allEntries.map(e => e.timestamp));
    const globalMaxTs = Math.max(...allEntries.map(e => e.timestamp));
    const tsSpan = globalMaxTs - globalMinTs || 1;

    const toX = (ts: number) => PAD.left + ((ts - globalMinTs) / tsSpan) * innerW;
    const toY = (n: number) => PAD.top + INNER_H - n * INNER_H;

    const lines = withFiltered
      .filter(s => s.tracker.type === 'number')
      .map(s => {
        const vals = s.filtered.map(e => e.value);
        const minV = Math.min(...vals);
        const maxV = Math.max(...vals);
        const span = maxV - minV || 1;
        const points = s.filtered.map(e => ({
          x: toX(e.timestamp),
          y: toY((e.value - minV) / span),
          raw: e.value,
        }));
        return { tracker: s.tracker, points, minV, maxV };
      });

    const dots = withFiltered
      .filter(s => s.tracker.type === 'yesno')
      .map(s => ({
        tracker: s.tracker,
        points: s.filtered.map(e => ({
          x: toX(e.timestamp),
          yes: e.value === 1,
        })),
      }));

    // 5 evenly spaced x-axis labels
    const xLabels = Array.from({ length: 5 }, (_, i) => {
      const ts = globalMinTs + (i / 4) * tsSpan;
      return { x: toX(ts), label: formatXLabel(ts, range) };
    });

    return { lines, dots, xLabels, toX, toY };
  }, [series, range, innerW]);

  if (!computed || (computed.lines.every(l => l.points.length === 0) && computed.dots.every(d => d.points.length === 0))) {
    return (
      <View style={[styles.empty, { height: svgHeight }]}>
        <Text style={styles.emptyText}>No data for this range</Text>
      </View>
    );
  }

  const { lines, dots, xLabels } = computed;
  const yGrid = [0, 0.5, 1];

  return (
    <Svg width={width} height={svgHeight}>
      {/* Y grid lines */}
      {yGrid.map((v, i) => {
        const y = PAD.top + INNER_H - v * INNER_H;
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD.left} y1={y}
              x2={PAD.left + innerW} y2={y}
              stroke={colors.border} strokeWidth={1} strokeDasharray="4,4"
            />
            <SvgText x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill={colors.textMuted}>
              {`${Math.round(v * 100)}%`}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Number tracker lines */}
      {lines.map(s => {
        if (s.points.length === 0) return null;
        if (s.points.length === 1) {
          return (
            <Circle key={s.tracker.id}
              cx={s.points[0].x} cy={s.points[0].y}
              r={5} fill={s.tracker.color}
            />
          );
        }
        // Smooth bezier path
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
            {/* Row line */}
            <Line
              x1={PAD.left} y1={cy}
              x2={PAD.left + innerW} y2={cy}
              stroke={colors.border} strokeWidth={1}
            />
            {/* Tracker name label */}
            <SvgText x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={9} fill={s.tracker.color}>
              {s.tracker.name.length > 7 ? s.tracker.name.slice(0, 6) + '…' : s.tracker.name}
            </SvgText>
            {/* Dots */}
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
