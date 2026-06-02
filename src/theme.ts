export const colors = {
  background: '#F4F4F2',
  surface: '#FFFFFF',
  border: '#E2E2DE',
  textPrimary: '#1C1C1A',
  textSecondary: '#7A7A74',
  textMuted: '#AEAEAD',
  accent: '#5C7A6E',       // muted sage green
  accentLight: '#EAF0ED',
  danger: '#B85C5C',
  dangerLight: '#F5E8E8',
  white: '#FFFFFF',
};

export const TRACKER_COLORS = [
  '#5C7A6E', // sage
  '#6B7FA6', // slate blue
  '#9A6B8A', // mauve
  '#A0855A', // warm tan
  '#5A7A8A', // steel teal
  '#7A8A5A', // olive
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
};

export const typography = {
  largeTitle: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  subtitle: { fontSize: 16, fontWeight: '500' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: '400' as const, color: colors.textMuted },
};
