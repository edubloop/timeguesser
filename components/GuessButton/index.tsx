import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';

interface GuessButtonProps {
  disabled: boolean;
  onPress: () => void;
  label?: string;
  /** Bottom safe area inset — pass from useSafeAreaInsets().bottom */
  bottomInset?: number;
}

export default function GuessButton({
  disabled,
  onPress,
  label = 'GUESS',
  bottomInset = 0,
}: GuessButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const tintPressed = useThemeColor({}, 'tintPressed');
  const card = useThemeColor({}, 'card');
  const tertiaryText = useThemeColor({}, 'tertiaryText');
  const inverseText = useThemeColor({}, 'inverseText');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? card : pressed ? tintPressed : tint,
          transform: [{ scale: !disabled && pressed ? 0.97 : 1 }],
          shadowOpacity: disabled ? 0 : 0.1,
          elevation: disabled ? 0 : 4,
          marginBottom: Math.max(Spacing.lg, bottomInset + Spacing.sm),
        },
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text
        style={[styles.text, { color: disabled ? tertiaryText : inverseText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Layout.safeAreaPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  text: {
    ...TypeScale.headline,
  },
});
