import React, { useEffect } from 'react';
import { StyleSheet, TextInput, TextStyle, StyleProp } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function AnimatedCounter({
  value,
  duration = 800,
  delay = 0,
  style,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => {
    const rounded = Math.round(animatedValue.value);

    return {
      text: `${prefix}${rounded}${suffix}`,
    };
  });

  useEffect(() => {
    cancelAnimation(animatedValue);
    animatedValue.value = 0;

    const timer = setTimeout(() => {
      animatedValue.value = withTiming(Math.round(value), {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimation(animatedValue);
    };
  }, [animatedValue, value, duration, delay]);

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      style={[styles.text, style]}
      defaultValue={`${prefix}0${suffix}`}
      animatedProps={animatedProps as never}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
});
