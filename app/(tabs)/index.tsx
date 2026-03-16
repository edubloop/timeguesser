import { useState } from 'react';
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useGame } from '@/lib/gameState';
import { ROUNDS_PER_GAME, MAX_GAME_SCORE } from '@/constants/scoring';
import { useSettings } from '@/lib/SettingsContext';
import { formatWholeNumber } from '@/lib/numberFormat';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

export default function HomeScreen() {
  const { startGame } = useGame();
  const { photoSource, publicImageSource, personalRounds } = useSettings();
  const [starting, setStarting] = useState(false);
  const tint = useThemeColor({}, 'tint');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const inverseText = useThemeColor({}, 'inverseText');

  const handleStartGame = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await startGame();
      router.push('/(tabs)/game');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TimeGuesser</Text>
      <Text style={[styles.subtitle, { color: secondaryText }]}>Guess where and when</Text>

      <View style={[styles.info, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.infoText, { color: secondaryText }]}>
          {ROUNDS_PER_GAME} rounds &middot; {formatWholeNumber(MAX_GAME_SCORE)} max points
        </Text>
        <Text style={[styles.infoText, { color: secondaryText }]}>
          Source: {photoSource}
          {photoSource !== 'personal' ? ` [${publicImageSource}]` : ''}
          {photoSource !== 'public' ? ` (${personalRounds.length} personal)` : ''}
        </Text>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: tint }]}
        disabled={starting}
        onPress={handleStartGame}
      >
        {starting ? (
          <ActivityIndicator color={inverseText} />
        ) : (
          <Text style={[styles.buttonText, { color: inverseText }]}>Start Game</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...TypeScale.display,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TypeScale.title3,
    fontWeight: '400',
    marginBottom: Spacing.xxl,
  },
  info: {
    marginBottom: Spacing.xxxl,
  },
  infoText: {
    ...TypeScale.subhead,
  },
  button: {
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.sheet,
  },
  buttonText: {
    ...TypeScale.title3,
    fontWeight: '600',
  },
});
