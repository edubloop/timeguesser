import { Pressable, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';

interface FloatingCTABarProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
  bottomInset: number;
}

export default function FloatingCTABar({
  label,
  disabled = false,
  onPress,
  testID,
  bottomInset,
}: FloatingCTABarProps) {
  const tint = useThemeColor({}, 'tint');
  const tintPressed = useThemeColor({}, 'tint'); // Same color, opacity handled by press
  const inverseText = useThemeColor({}, 'inverseText');

  return (
    <View style={[styles.container, { bottom: bottomInset + Spacing.lg }]} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: disabled ? '#888' : pressed ? tintPressed : tint,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
      >
        <Text style={[styles.buttonText, { color: inverseText }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Layout.safeAreaPadding,
    right: Layout.safeAreaPadding,
    zIndex: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  button: {
    minWidth: 200,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.buttonY,
    borderRadius: Radius.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    ...TypeScale.callout,
    fontWeight: '700',
  },
});
