import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { View } from '@/components/Themed';
import type { PresentationMode } from '@/lib/gameScreenPresentation';

interface RoundMediaStageProps {
  mode: PresentationMode;
  topInset: number;
  photoSurface: React.ReactNode;
  mapSurface: React.ReactNode;
  floatingControlRail?: React.ReactNode;
  ephemeralContext?: React.ReactNode;
  floatingCTA?: React.ReactNode;
  mapOverlays?: React.ReactNode;
  resultOverlay?: React.ReactNode;
  prioritizeMapSurface?: boolean;
}

const TRANSITION_DURATION_MS = 200;

export default function RoundMediaStage({
  mode,
  topInset: _topInset,
  photoSurface,
  mapSurface,
  floatingControlRail,
  ephemeralContext,
  floatingCTA,
  mapOverlays,
  resultOverlay,
  prioritizeMapSurface = false,
}: RoundMediaStageProps) {
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
      {/* Map Surface (behind photo in photo mode) */}
      <Animated.View
        pointerEvents={visibleMode === 'map' ? 'auto' : 'none'}
        accessibilityElementsHidden={visibleMode !== 'map'}
        importantForAccessibility={visibleMode === 'map' ? 'auto' : 'no-hide-descendants'}
        style={[styles.surface, mapStyle]}
      >
        {mapSurface}
      </Animated.View>

      {/* Photo Surface (in front of map in photo mode) */}
      <Animated.View
        pointerEvents={visibleMode === 'photo' ? 'auto' : 'none'}
        accessibilityElementsHidden={visibleMode !== 'photo'}
        importantForAccessibility={visibleMode === 'photo' ? 'auto' : 'no-hide-descendants'}
        style={[styles.surface, photoStyle]}
      >
        {photoSurface}
      </Animated.View>

      {/* Floating Controls */}
      {floatingControlRail}

      {/* Ephemeral Context (Round/Score) */}
      {ephemeralContext}

      {/* Map Overlays (search, hints, etc.) */}
      {mapOverlays}

      {/* Result Overlay */}
      {resultOverlay}

      {/* Floating CTA Button */}
      {floatingCTA}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
});
