import React from 'react';
import { StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Text, View, useThemeColor } from '@/components/Themed';
import AnimatedCounter from '@/components/ScoreReveal/AnimatedCounter';
import { RoundResult } from '@/lib/gameState';
import { MAX_GAME_SCORE } from '@/constants/scoring';
import { formatWholeNumber } from '@/lib/numberFormat';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

interface ScoreSummaryProps {
  results: RoundResult[];
  totalScore: number;
  onPlayAgain: () => void;
}

export default function ScoreSummary({
  results,
  totalScore,
  onPlayAgain,
}: ScoreSummaryProps) {
  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const scorePoor = useThemeColor({}, 'scorePoor');
  const inverseText = useThemeColor({}, 'inverseText');

  const percentage = Math.round((totalScore / MAX_GAME_SCORE) * 100);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Big score card */}
      <Animated.View entering={FadeIn.duration(600)}>
        <View style={[styles.totalCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.gameOverLabel}>Game Over</Text>
          <AnimatedCounter
            value={totalScore}
            duration={1200}
            delay={300}
            style={[styles.totalScore, { color: tint }]}
          />
          <Text style={[styles.maxScore, { color: secondaryText }]}> 
            out of {formatWholeNumber(MAX_GAME_SCORE)} ({percentage}%)
          </Text>
        </View>
      </Animated.View>

      {/* Per-round breakdown */}
      {results.map((result, index) => (
        <Animated.View
          key={result.roundData.id}
          entering={FadeInDown.delay(600 + index * 150).duration(400)}>
          <View style={[styles.roundCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.roundHeader, { backgroundColor: 'transparent' }]}>
              <Text style={styles.roundTitle}>Round {index + 1}</Text>
              <Text style={[styles.roundScore, { color: tint }]}> 
                {formatWholeNumber(result.totalScore)}
              </Text>
            </View>

            <Text style={[styles.roundLocation, { color: secondaryText }]}>
              {result.roundData.label}
            </Text>

            <View style={[styles.roundStats, { backgroundColor: 'transparent' }]}>
              <StatCell
                value={`${formatWholeNumber(result.distanceKm)} km`}
                label="distance"
                secondaryText={secondaryText}
              />
              <StatCell
                value={`${result.yearDiff} yr${result.yearDiff !== 1 ? 's' : ''}`}
                label="off"
                secondaryText={secondaryText}
              />
              <StatCell
                value={formatWholeNumber(result.locationScore)}
                label="location"
                secondaryText={secondaryText}
              />
              <StatCell
                value={formatWholeNumber(result.timeScore)}
                label="time"
                secondaryText={secondaryText}
              />
            </View>

            {result.hintPenalty > 0 && (
              <Text style={[styles.penalty, { color: scorePoor }]}>
                Hint penalty: -{formatWholeNumber(result.hintPenalty)}
              </Text>
            )}
          </View>
        </Animated.View>
      ))}

      {/* Play again button */}
      <Animated.View entering={FadeInDown.delay(600 + results.length * 150).duration(400)}>
        <Pressable
          style={[styles.button, { backgroundColor: tint }]}
          onPress={onPlayAgain}>
          <Text style={[styles.buttonText, { color: inverseText }]}>
            Play Again
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function StatCell({
  value,
  label,
  secondaryText,
}: {
  value: string;
  label: string;
  secondaryText: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: 'transparent' }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color: secondaryText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  totalCard: {
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  gameOverLabel: {
    ...TypeScale.subhead,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginBottom: Spacing.sm,
  },
  totalScore: {
    ...TypeScale.display,
    fontSize: 52,
    lineHeight: 62,
    fontWeight: '800',
    textAlign: 'center',
  },
  maxScore: {
    ...TypeScale.subhead,
    marginTop: Spacing.xs,
  },
  roundCard: {
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roundTitle: {
    ...TypeScale.callout,
    fontWeight: '700',
  },
  roundScore: {
    ...TypeScale.headline,
    fontWeight: '700',
  },
  roundLocation: {
    ...TypeScale.footnote,
    marginBottom: Spacing.md,
  },
  roundStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  statLabel: {
    ...TypeScale.caption2,
    marginTop: 2,
  },
  penalty: {
    ...TypeScale.caption1,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.sheet,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonText: {
    ...TypeScale.headline,
  },
});
