import { type Coordinate, hintPenalty, roundScore } from './scoring';
import { ROUNDS_PER_GAME } from '@/constants/scoring';
import type { PhotoLicense } from './photos';

export interface RoundData {
  id: string;
  source: 'public' | 'personal';
  location: Coordinate;
  year: number;
  imageUri: string;
  label: string;
  locationLabel?: string;
  attribution?: {
    license: PhotoLicense;
    author?: string;
    institutionName?: string;
    originalUrl?: string;
  };
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

export interface GameState {
  status: 'idle' | 'starting' | 'playing' | 'finished';
  currentRound: number;
  rounds: RoundData[];
  results: RoundResult[];
}

export type GameAction =
  | { type: 'START_GAME_BEGIN' }
  | { type: 'START_GAME'; rounds: RoundData[] }
  | { type: 'START_GAME_FAILED' }
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

export const initialGameState: GameState = {
  status: 'idle',
  currentRound: 0,
  rounds: [],
  results: [],
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME_BEGIN':
      return {
        status: 'starting',
        currentRound: 0,
        rounds: [],
        results: [],
      };

    case 'START_GAME':
      return {
        status: 'playing',
        currentRound: 0,
        rounds: action.rounds,
        results: [],
      };

    case 'START_GAME_FAILED':
      return initialGameState;

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
      return initialGameState;

    default:
      return state;
  }
}

function computeDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
