import { Pressable, StyleSheet } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';

interface ModeChipProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

export default function ModeChip({ label, onPress, testID }: ModeChipProps) {
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const tintSubtle = useThemeColor({}, 'tintSubtle');

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label} mode`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed ? tintSubtle : cardBg,
          borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: Layout.minTouchTarget,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  label: {
    ...TypeScale.caption1,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
