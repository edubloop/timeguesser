import { Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing } from '@/constants/theme';
import type { PresentationMode } from '@/lib/gameScreenPresentation';

interface FloatingControlRailProps {
  mode: PresentationMode;
  mapToolsVisible: boolean;
  hintsEnabled: boolean;
  hintsUsed: number;
  maxHints: number;
  hintHistoryAvailable: boolean;
  hintHistoryVisible: boolean;
  showResult: boolean;
  guessLocked: boolean;
  onMapToggle: () => void;
  onHintPress: () => void;
  onToggleHintHistory: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  topInset: number;
}

export default function FloatingControlRail({
  mode,
  mapToolsVisible,
  hintsEnabled,
  hintsUsed,
  maxHints,
  hintHistoryAvailable,
  hintHistoryVisible,
  showResult,
  guessLocked,
  onMapToggle,
  onHintPress,
  onToggleHintHistory,
  onZoomIn,
  onZoomOut,
  onResetView,
  topInset,
}: FloatingControlRailProps) {
  const tint = useThemeColor({}, 'tint');
  const inverseText = useThemeColor({}, 'inverseText');

  const showHintButton = mapToolsVisible && hintsEnabled && !showResult && !guessLocked;
  const hintDisabled = hintsUsed >= maxHints;
  const showHistoryToggle = mapToolsVisible && hintHistoryAvailable;
  const showZoomControls = mapToolsVisible;

  return (
    <View style={[styles.container, { top: topInset + Spacing.xxxl + Spacing.md }]}>
      {/* Map/Photo Toggle Button */}
      <Pressable
        style={styles.button}
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
          style={styles.button}
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

      {showHistoryToggle && (
        <Pressable
          style={styles.button}
          onPress={onToggleHintHistory}
          accessibilityRole="button"
          accessibilityLabel={hintHistoryVisible ? 'Hide hint history' : 'Show hint history'}
          testID="hint-history-toggle"
        >
          <FontAwesome name={hintHistoryVisible ? 'list-alt' : 'list'} size={18} color={tint} />
        </Pressable>
      )}

      {showZoomControls && (
        <>
          <Pressable
            testID="map-zoom-in"
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            onPress={onZoomIn}
          >
            <Text style={styles.zoomSymbol}>+</Text>
          </Pressable>
          <Pressable
            testID="map-zoom-out"
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            onPress={onZoomOut}
          >
            <Text style={styles.zoomSymbol}>-</Text>
          </Pressable>
          <Pressable
            testID="map-reset-view"
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Reset map view"
            onPress={onResetView}
          >
            <FontAwesome name="globe" size={16} color={tint} />
          </Pressable>
        </>
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
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(8, 11, 16, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  zoomSymbol: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
    color: '#F8FAFC',
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
