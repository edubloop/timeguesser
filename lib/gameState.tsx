import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { type Coordinate } from './scoring';
import { ROUNDS_PER_GAME } from '@/constants/scoring';
import { useSettings } from './SettingsContext';
import { buildRoundsForGame, initializePublicImageCache, markPublicRoundSeen } from './photos';
import { gameReducer, initialGameState, type GameState, type RoundData } from './gameReducer';

export type { RoundData, RoundResult } from './gameReducer';

interface GameContextValue {
  state: GameState;
  startGame: () => Promise<void>;
  replaceCurrentRound: (round: RoundData) => void;
  submitGuess: (location: Coordinate, year: number, hintsUsed?: number) => void;
  submitTimeoutRound: (hintsUsed?: number) => void;
  nextRound: () => void;
  resetGame: () => void;
  currentRoundData: RoundData | null;
  totalScore: number;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const {
    photoSource,
    publicImageSource,
    personalRounds,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
  } = useSettings();

  useEffect(() => {
    initializePublicImageCache({
      publicImageSource,
      publicSelectionFilters,
      diagnosticsEnabled: photoDiagnosticsEnabled,
    }).catch(() => {
      // Ignore cache warmup failures; game start still has fallbacks.
    });
  }, [publicImageSource, publicSelectionFilters, photoDiagnosticsEnabled]);

  const startGame = useCallback(async () => {
    const rounds = await buildRoundsForGame({
      source: photoSource,
      publicImageSource,
      publicSelectionFilters,
      diagnosticsEnabled: photoDiagnosticsEnabled,
      personalRounds,
      roundsPerGame: ROUNDS_PER_GAME,
    });
    dispatch({ type: 'START_GAME', rounds });
  }, [
    photoSource,
    publicImageSource,
    personalRounds,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
  ]);

  const submitGuess = useCallback(
    (location: Coordinate, year: number, hintsUsed = 0) => {
      const round = state.status === 'playing' ? (state.rounds[state.currentRound] ?? null) : null;
      dispatch({
        type: 'SUBMIT_GUESS',
        guessLocation: location,
        guessYear: year,
        hintsUsed,
      });

      if (round?.source === 'public') {
        markPublicRoundSeen(round).catch(() => {
          // Ignore seen-ledger write failures; gameplay should continue.
        });
      }
    },
    [state.status, state.rounds, state.currentRound]
  );

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  const replaceCurrentRound = useCallback((round: RoundData) => {
    dispatch({ type: 'REPLACE_CURRENT_ROUND', round });
  }, []);

  const submitTimeoutRound = useCallback(
    (hintsUsed = 0) => {
      const round = state.status === 'playing' ? (state.rounds[state.currentRound] ?? null) : null;
      dispatch({ type: 'SUBMIT_TIMEOUT', hintsUsed });

      if (round?.source === 'public') {
        markPublicRoundSeen(round).catch(() => {
          // Ignore seen-ledger write failures; gameplay should continue.
        });
      }
    },
    [state.status, state.rounds, state.currentRound]
  );

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const currentRoundData =
    state.status === 'playing' ? (state.rounds[state.currentRound] ?? null) : null;

  const totalScore = state.results.reduce((sum, r) => sum + r.totalScore, 0);

  return (
    <GameContext.Provider
      value={{
        state,
        startGame,
        replaceCurrentRound,
        submitGuess,
        submitTimeoutRound,
        nextRound,
        resetGame,
        currentRoundData,
        totalScore,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
