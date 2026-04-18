import { Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing } from '@/constants/theme';
import type { PresentationMode } from '@/lib/gameScreenPresentation';

interface FloatingControlRailProps {
  mode: PresentationMode;
  hintsEnabled: boolean;
  hintsUsed: number;
  maxHints: number;
  showResult: boolean;
  guessLocked: boolean;
  onMapToggle: () => void;
  onHintPress: () => void;
  topInset: number;
}

export default function FloatingControlRail({
  mode,
  hintsEnabled,
  hintsUsed,
  maxHints,
  showResult,
  guessLocked,
  onMapToggle,
  onHintPress,
  topInset,
}: FloatingControlRailProps) {
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const inverseText = useThemeColor({}, 'inverseText');

  const showHintButton = mode === 'map' && hintsEnabled && !showResult && !guessLocked;
  const hintDisabled = hintsUsed >= maxHints;

  return (
    <View style={[styles.container, { top: topInset + Spacing.xxxl + Spacing.md }]}>
      {/* Map/Photo Toggle Button */}
      <Pressable
        style={[styles.button, { backgroundColor: cardBg, borderColor }]}
        onPress={onMapToggle}
        accessibilityRole="button"
        accessibilityLabel={mode === 'photo' ? 'Switch to map mode' : 'Switch to photo mode'}
        testID={mode === 'photo' ? 'enter-map-button' : 'return-photo-button'}
      >
        <FontAwesome name={mode === 'photo' ? 'map-o' : 'image'} size={20} color={tint} />
      </Pressable>

      {/* Hint Button - only in map mode */}
      {showHintButton && (
        <Pressable
          style={[styles.button, { backgroundColor: cardBg, borderColor }]}
          onPress={onHintPress}
          accessibilityRole="button"
          accessibilityLabel="Get hint"
          testID="hint-open"
          disabled={hintDisabled}
        >
          <FontAwesome name="lightbulb-o" size={20} color={hintDisabled ? '#888' : tint} />
          <View style={[styles.badge, { backgroundColor: tint }]}>
            <Text style={[styles.badgeText, { color: inverseText }]}>{hintsUsed}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Layout.safeAreaPadding,
    zIndex: 15,
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  button: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
