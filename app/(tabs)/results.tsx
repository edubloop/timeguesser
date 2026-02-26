import { StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useGame } from '@/lib/gameState';
import ScoreSummary from '@/components/ScoreSummary';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

export default function ResultsScreen() {
  const { state, totalScore, resetGame } = useGame();
  const tint = useThemeColor({}, 'tint');
  const inverseText = useThemeColor({}, 'inverseText');

  const hasResults = state.results.length > 0;

  const handlePlayAgain = () => {
    resetGame();
    router.replace('/(tabs)');
  };

  if (!hasResults) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Complete a game to see your results</Text>
        <Pressable
          style={[styles.button, { backgroundColor: tint }]}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.buttonText, { color: inverseText }]}>
            Go Home
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <ScoreSummary results={state.results} totalScore={totalScore} onPlayAgain={handlePlayAgain} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  emptyText: {
    ...TypeScale.callout,
    opacity: 0.5,
    marginBottom: Spacing.xl,
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.sheet,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    ...TypeScale.headline,
  },
});
