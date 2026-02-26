import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { View, Text, useThemeColor } from '@/components/Themed';
import AnimatedCounter from './AnimatedCounter';
import { RoundResult } from '@/lib/gameState';
import { formatWholeNumber } from '@/lib/numberFormat';
import { MAX_ROUND_SCORE } from '@/constants/scoring';
import { Radius, Spacing, TypeScale } from '@/constants/theme';

interface ScoreRevealProps {
  result: RoundResult;
  onRevealComplete: () => void;
  /** Bottom safe area inset — pass from useSafeAreaInsets().bottom */
  bottomInset?: number;
}

const COUNTER_DURATION = 600;

export default function ScoreReveal({ result, onRevealComplete, bottomInset = 0 }: ScoreRevealProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const scoreExcellent = useThemeColor({}, 'scoreExcellent');
  const scoreGood = useThemeColor({}, 'scoreGood');
  const scoreFair = useThemeColor({}, 'scoreFair');
  const scorePoor = useThemeColor({}, 'scorePoor');

  const scoreRatio = result.totalScore / MAX_ROUND_SCORE;
  const totalColor =
    scoreRatio >= 0.8
      ? scoreExcellent
      : scoreRatio >= 0.5
        ? scoreGood
        : scoreRatio >= 0.2
          ? scoreFair
          : scorePoor;

  const locationYearLabel = `${result.roundData.locationLabel ?? 'Unknown location'} · ${result.roundData.year}`;

  // Signal reveal complete immediately — no phased animation gate
  useEffect(() => {
    onRevealComplete();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent', paddingBottom: Math.max(Spacing.md, bottomInset + Spacing.sm) }]}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {/* Header: title + toggle button */}
        <View style={[styles.headerRow, { backgroundColor: 'transparent' }]}>
          <Text style={styles.locationName} numberOfLines={2}>
            {result.roundData.label}
          </Text>
          <Pressable
            style={[styles.toggleButton, { borderColor }]}
            onPress={() => setIsExpanded((prev) => !prev)}>
            <Text style={styles.toggleButtonText}>
              {isExpanded ? 'Hide details' : 'Show details'}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.metaLine, { color: secondaryText }]} numberOfLines={1}>
          {locationYearLabel}
        </Text>

        {isExpanded ? (
          /* ---- Expanded: full score breakdown ---- */
          <Animated.View entering={FadeIn.duration(200)}>
            {/* Distance */}
            <View style={[styles.row, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.rowLabel, { color: secondaryText }]}>Distance</Text>
              <Text style={styles.rowValue}>
                {result.timedOut ? 'No pin placed' : `${formatWholeNumber(result.distanceKm)} km`}
              </Text>
            </View>

            {/* Year comparison */}
            <View style={[styles.row, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.rowLabel, { color: secondaryText }]}>Year</Text>
              <Text style={styles.rowValue}>
                {result.timedOut ? (
                  <Text style={{ color: secondaryText }}>Timed out</Text>
                ) : (
                  <>
                    {result.guessYear} → {result.roundData.year}
                    <Text style={{ color: secondaryText }}>
                      {'  '}
                      {result.yearDiff} yr{result.yearDiff !== 1 ? 's' : ''} off
                    </Text>
                  </>
                )}
              </Text>
            </View>

            {/* Score breakdown */}
            <Animated.View entering={SlideInDown.duration(200)}>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={[styles.scoreRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.scoreLabel, { color: secondaryText }]}>Location</Text>
                <AnimatedCounter
                  value={result.locationScore}
                  duration={COUNTER_DURATION}
                  style={[styles.scoreValue, { color: tint, fontVariant: ['tabular-nums'] }]}
                />
              </View>

              <View style={[styles.scoreRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.scoreLabel, { color: secondaryText }]}>Time</Text>
                <AnimatedCounter
                  value={result.timeScore}
                  duration={COUNTER_DURATION}
                  delay={COUNTER_DURATION * 0.4}
                  style={[styles.scoreValue, { color: tint, fontVariant: ['tabular-nums'] }]}
                />
              </View>

              {result.hintPenalty > 0 && (
                <View style={[styles.scoreRow, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.scoreLabel, { color: scorePoor }]}>Hint penalty</Text>
                  <Text style={[styles.scoreValue, { color: scorePoor }]}>
                    -{formatWholeNumber(result.hintPenalty)}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={[styles.scoreRow, { backgroundColor: 'transparent' }]}>
                <Text style={styles.totalLabel}>Total</Text>
                <AnimatedCounter
                  value={result.totalScore}
                  duration={COUNTER_DURATION}
                  delay={COUNTER_DURATION * 0.8}
                  style={[styles.totalValue, { color: totalColor, fontVariant: ['tabular-nums'] }]}
                />
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          /* ---- Collapsed: just the total ---- */
          <View style={[styles.collapsedRow, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.collapsedLabel, { color: secondaryText }]}>Total</Text>
            <Text style={[styles.collapsedValue, { color: tint }]}>
              {formatWholeNumber(result.totalScore)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 48,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  locationName: {
    flex: 1,
    ...TypeScale.title3,
    textAlign: 'left',
  },
  toggleButton: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 1,
  },
  toggleButtonText: {
    ...TypeScale.caption2,
  },
  metaLine: {
    ...TypeScale.caption1,
    marginBottom: 6,
  },
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  collapsedLabel: {
    ...TypeScale.subhead,
  },
  collapsedValue: {
    ...TypeScale.display,
    fontSize: 28,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    ...TypeScale.subhead,
  },
  rowValue: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  scoreLabel: {
    ...TypeScale.caption1,
  },
  scoreValue: {
    ...TypeScale.subhead,
    fontWeight: '600',
    textAlign: 'right',
  },
  totalLabel: {
    ...TypeScale.headline,
  },
  totalValue: {
    ...TypeScale.display,
    fontSize: 34,
    textAlign: 'right',
  },
});
