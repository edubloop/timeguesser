import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import RoundTimer from '@/components/RoundTimer';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';
import type { PresentationMode } from '@/lib/gameScreenPresentation';
import { formatWholeNumber } from '@/lib/numberFormat';

interface RoundMediaStageProps {
  mode: PresentationMode;
  topInset: number;
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  roundTimer: number;
  timerPaused: boolean;
  onTimeUp: () => void;
  photoSurface: React.ReactNode;
  mapSurface: React.ReactNode;
  yearRevealBanner?: React.ReactNode;
  modeChip?: React.ReactNode;
  mapOverlays?: React.ReactNode;
  resultOverlay?: React.ReactNode;
  prioritizeMapSurface?: boolean;
}

const TRANSITION_DURATION_MS = 180;

export default function RoundMediaStage({
  mode,
  topInset,
  currentRound,
  totalRounds,
  totalScore,
  roundTimer,
  timerPaused,
  onTimeUp,
  photoSurface,
  mapSurface,
  yearRevealBanner,
  modeChip,
  mapOverlays,
  resultOverlay,
  prioritizeMapSurface = false,
}: RoundMediaStageProps) {
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');

  const visibleMode: PresentationMode = prioritizeMapSurface ? 'map' : mode;
  const transition = useRef(new Animated.Value(visibleMode === 'map' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: visibleMode === 'map' ? 1 : 0,
      duration: TRANSITION_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [transition, visibleMode]);

  const photoStyle = {
    opacity: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
      {
        scale: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.985],
        }),
      },
    ],
  };

  const mapStyle = {
    opacity: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents={visibleMode === 'map' ? 'auto' : 'none'}
        accessibilityElementsHidden={visibleMode !== 'map'}
        importantForAccessibility={visibleMode === 'map' ? 'auto' : 'no-hide-descendants'}
        style={[styles.surface, mapStyle]}
      >
        {mapSurface}
      </Animated.View>

      <Animated.View
        pointerEvents={visibleMode === 'photo' ? 'auto' : 'none'}
        accessibilityElementsHidden={visibleMode !== 'photo'}
        importantForAccessibility={visibleMode === 'photo' ? 'auto' : 'no-hide-descendants'}
        style={[styles.surface, photoStyle]}
      >
        {photoSurface}
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={[
          styles.topChrome,
          {
            top: topInset + Spacing.sm,
            left: Layout.safeAreaPadding,
            right: Layout.safeAreaPadding,
          },
        ]}
      >
        <View style={[styles.contextCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.roundLabel, { color: textColor }]}>
            Round {currentRound + 1} of {totalRounds}
          </Text>
          <Text style={[styles.scoreLabel, { color: secondaryText }]}>
            {formatWholeNumber(totalScore)} pts
          </Text>
        </View>

        {roundTimer > 0 ? (
          <View style={styles.timerWrap}>
            <RoundTimer
              key={`${currentRound}-${roundTimer}`}
              duration={roundTimer}
              paused={timerPaused}
              onTimeUp={onTimeUp}
            />
          </View>
        ) : null}
      </View>

      {yearRevealBanner ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.yearBannerWrap,
            {
              top: topInset + Spacing.xxxl + Spacing.lg,
              left: Layout.safeAreaPadding,
              right: Layout.safeAreaPadding,
            },
          ]}
        >
          {yearRevealBanner}
        </View>
      ) : null}

      {modeChip ? (
        <View
          pointerEvents="box-none"
          style={visibleMode === 'photo' ? styles.photoChipWrap : styles.mapChipWrap}
        >
          {modeChip}
        </View>
      ) : null}

      {mapOverlays}
      {resultOverlay}
    </View>
  );
}

const chipBase = {
  position: 'absolute' as const,
  bottom: Spacing.xxxl + Spacing.sm,
  backgroundColor: 'transparent',
  zIndex: 15,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
  topChrome: {
    position: 'absolute',
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    gap: Spacing.md,
  },
  contextCard: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: '68%',
  },
  roundLabel: {
    ...TypeScale.caption1,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scoreLabel: {
    ...TypeScale.footnote,
    marginTop: 2,
  },
  timerWrap: {
    flex: 1,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  yearBannerWrap: {
    position: 'absolute',
    zIndex: 19,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  photoChipWrap: {
    ...chipBase,
    right: Layout.safeAreaPadding,
  },
  mapChipWrap: {
    ...chipBase,
    left: Layout.safeAreaPadding,
  },
});
