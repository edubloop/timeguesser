import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Text, View, useThemeColor } from '@/components/Themed';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

interface RoundTimerProps {
  /** Duration in seconds. 0 = disabled. */
  duration: number;
  /** Called when time runs out */
  onTimeUp: () => void;
  /** Pauses the timer */
  paused?: boolean;
}

export default function RoundTimer({ duration, onTimeUp, paused = false }: RoundTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useSharedValue(1);

  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const scorePoor = useThemeColor({}, 'scorePoor');

  useEffect(() => {
    setRemaining(duration);
    progress.value = 1;
  }, [duration, progress]);

  useEffect(() => {
    if (duration <= 0) {
      progress.value = 0;
      return;
    }

    const nextProgress = Math.max(0, Math.min(1, remaining / duration));
    progress.value = withTiming(nextProgress, {
      duration: 220,
      easing: Easing.linear,
    });
  }, [duration, remaining, progress]);

  useEffect(() => {
    if (paused || duration <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimation(progress);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration, paused, onTimeUp, progress]);

  const barStyle = useAnimatedStyle(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reanimated types don't accept % strings for width
    width: `${progress.value * 100}%` as any,
  }));

  if (duration <= 0) return null;

  const isUrgent = remaining <= 10;
  const textColor = isUrgent ? scorePoor : tint;
  const barColor = isUrgent ? scorePoor : tint;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.time, { color: textColor }]}>{display}</Text>
      <View style={[styles.barBg, { backgroundColor: borderColor }]}>
        <Animated.View style={[styles.bar, { backgroundColor: barColor }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  time: {
    ...TypeScale.subhead,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  barBg: {
    flex: 1,
    height: Spacing.xs,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.sm,
  },
});
