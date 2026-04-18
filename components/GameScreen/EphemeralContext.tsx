import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';

interface EphemeralContextProps {
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  topInset: number;
  visible: boolean;
  onDismiss: () => void;
  onRestore: () => void;
}

const AUTO_DISMISS_DELAY_MS = 3000;
const ANIMATION_DURATION_MS = 300;

export default function EphemeralContext({
  currentRound,
  totalRounds,
  totalScore,
  topInset,
  visible,
  onDismiss,
  onRestore,
}: EphemeralContextProps) {
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const tint = useThemeColor({}, 'tint');

  const [isDismissed, setIsDismissed] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  // Animate in when becoming visible
  useEffect(() => {
    if (visible && !isDismissed) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after delay
      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY_MS);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isDismissed]);

  // Reset dismissed state when round changes
  useEffect(() => {
    setIsDismissed(false);
  }, [currentRound]);

  const handleDismiss = () => {
    if (isDismissed) return;

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDismissed(true);
      onDismiss();
    });
  };

  const handleRestore = () => {
    if (!isDismissed) return;

    setIsDismissed(false);
    onRestore();

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss again after restore
    setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_DELAY_MS);
  };

  // If dismissed, show a small restore indicator
  if (isDismissed) {
    return (
      <Pressable
        style={[styles.restoreTrigger, { top: topInset + Spacing.sm }]}
        onPress={handleRestore}
        accessibilityRole="button"
        accessibilityLabel="Show round information"
      >
        <View style={[styles.restoreDot, { backgroundColor: tint }]} />
      </Pressable>
    );
  }

  const animatedStyle = {
    opacity: opacityAnim,
    transform: [{ translateY: translateYAnim }],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topInset + Spacing.sm, left: Layout.safeAreaPadding },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable onPress={handleDismiss}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.roundText, { color: textColor }]}>
            Round {currentRound + 1} of {totalRounds}
          </Text>
          <Text style={[styles.scoreText, { color: secondaryText }]}>
            {totalScore.toLocaleString()} pts
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  card: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  roundText: {
    ...TypeScale.caption1,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scoreText: {
    ...TypeScale.footnote,
    marginTop: 2,
  },
  restoreTrigger: {
    position: 'absolute',
    left: Layout.safeAreaPadding,
    zIndex: 20,
    padding: Spacing.sm,
  },
  restoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
