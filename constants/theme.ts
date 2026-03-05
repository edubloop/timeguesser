export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  buttonY: 14,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 4,
  md: 6,
  lg: 8,
  sheet: 12,
  pill: 999,
} as const;

export const Layout = {
  photoMaxHeight: '40%',
  safeAreaPadding: 16,
  minTouchTarget: 44,
} as const;

export const TypeScale = {
  displayLg: { fontSize: 52, lineHeight: 62, fontWeight: '800' as const },
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  displaySm: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' as const },
} as const;
