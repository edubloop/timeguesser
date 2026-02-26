import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Coordinate, hintPenalty, roundScore } from './scoring';
import { ROUNDS_PER_GAME } from '@/constants/scoring';
import { useSettings } from './SettingsContext';
import { buildRoundsForGame, initializePublicImageCache, markPublicRoundSeen } from './photos';

export interface RoundData {
  id: string;
  source: 'public' | 'personal';
  location: Coordinate;
  year: number;
  imageUri: string;
  label: string;
  locationLabel?: string;
}

export interface RoundResult {
  roundData: RoundData;
  guessLocation: Coordinate;
  guessYear: number;
  hintsUsed: number;
  locationScore: number;
  timeScore: number;
  hintPenalty: number;
  totalScore: number;
  distanceKm: number;
  yearDiff: number;
  timedOut?: boolean;
}

interface GameState {
  status: 'idle' | 'playing' | 'finished';
  currentRound: number; // 0-indexed
  rounds: RoundData[];
  results: RoundResult[];
}

type GameAction =
  | { type: 'START_GAME'; rounds: RoundData[] }
  | {
      type: 'SUBMIT_GUESS';
      guessLocation: Coordinate;
      guessYear: number;
      hintsUsed: number;
    }
  | { type: 'REPLACE_CURRENT_ROUND'; round: RoundData }
  | { type: 'NEXT_ROUND' }
  | { type: 'SUBMIT_TIMEOUT'; hintsUsed: number }
  | { type: 'FINISH_GAME' }
  | { type: 'RESET' };

const initialState: GameState = {
  status: 'idle',
  currentRound: 0,
  rounds: [],
  results: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        status: 'playing',
        currentRound: 0,
        rounds: action.rounds,
        results: [],
      };

    case 'SUBMIT_GUESS': {
      const round = state.rounds[state.currentRound];
      const score = roundScore(
        action.guessLocation,
        round.location,
        action.guessYear,
        round.year,
        action.hintsUsed
      );
      const dist = computeDistance(action.guessLocation, round.location);
      const result: RoundResult = {
        roundData: round,
        guessLocation: action.guessLocation,
        guessYear: action.guessYear,
        hintsUsed: action.hintsUsed,
        locationScore: score.locationScore,
        timeScore: score.timeScore,
        hintPenalty: score.hintPenalty,
        totalScore: score.total,
        distanceKm: dist,
        yearDiff: Math.abs(action.guessYear - round.year),
      };
      return {
        ...state,
        results: [...state.results, result],
      };
    }

    case 'REPLACE_CURRENT_ROUND': {
      const rounds = [...state.rounds];
      rounds[state.currentRound] = action.round;
      return { ...state, rounds };
    }

    case 'NEXT_ROUND': {
      const nextRound = state.currentRound + 1;
      if (nextRound >= ROUNDS_PER_GAME) {
        return { ...state, status: 'finished' };
      }
      return { ...state, currentRound: nextRound };
    }

    case 'SUBMIT_TIMEOUT': {
      const round = state.rounds[state.currentRound];
      const penalty = hintPenalty(action.hintsUsed);
      const result: RoundResult = {
        roundData: round,
        guessLocation: round.location,
        guessYear: round.year,
        hintsUsed: action.hintsUsed,
        locationScore: 0,
        timeScore: 0,
        hintPenalty: penalty,
        totalScore: 0,
        distanceKm: 0,
        yearDiff: 0,
        timedOut: true,
      };
      return {
        ...state,
        results: [...state.results, result],
      };
    }

    case 'FINISH_GAME':
      return { ...state, status: 'finished' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Inline distance computation to avoid circular import
function computeDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

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
  const [state, dispatch] = useReducer(gameReducer, initialState);
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
      const round =
        state.status === 'playing' ? state.rounds[state.currentRound] ?? null : null;
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
      const round =
        state.status === 'playing' ? state.rounds[state.currentRound] ?? null : null;
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
    state.status === 'playing' ? state.rounds[state.currentRound] ?? null : null;

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
      }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
