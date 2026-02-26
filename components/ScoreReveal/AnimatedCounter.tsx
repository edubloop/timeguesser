import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';

import { formatWholeNumber } from '@/lib/numberFormat';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 800,
  delay = 0,
  style,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now() + delay;
    const from = 0;
    const to = Math.round(value);

    const tick = () => {
      if (cancelled) return;

      const now = Date.now();
      if (now < start) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(from + (to - from) * eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, delay]);

  return <Text style={[styles.text, style]}>{`${prefix}${formatWholeNumber(current)}${suffix}`}</Text>;
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
});
