import { describe, expect, it } from 'vitest';
import { ROUNDS_PER_GAME } from '@/constants/scoring';
import { gameReducer, initialGameState, type RoundData } from '@/lib/gameReducer';

function makeRound(id: string): RoundData {
  return {
    id,
    source: 'public',
    location: { lat: 0, lng: 0 },
    year: 2000,
    imageUri: `https://example.com/${id}.jpg`,
    label: id,
    locationLabel: 'Test',
  };
}

describe('game state reducer', () => {
  it('starts a new game in playing status and resets round index/results', () => {
    const rounds = Array.from({ length: ROUNDS_PER_GAME }, (_, i) => makeRound(`r${i + 1}`));
    const started = gameReducer(initialGameState, { type: 'START_GAME', rounds });

    expect(started.status).toBe('playing');
    expect(started.currentRound).toBe(0);
    expect(started.results).toEqual([]);
    expect(started.rounds).toHaveLength(ROUNDS_PER_GAME);
  });

  it('submits a guess and appends a round result', () => {
    const rounds = [makeRound('r1')];
    const started = gameReducer(initialGameState, { type: 'START_GAME', rounds });
    const next = gameReducer(started, {
      type: 'SUBMIT_GUESS',
      guessLocation: { lat: 0, lng: 0 },
      guessYear: 2000,
      hintsUsed: 0,
    });

    expect(next.results).toHaveLength(1);
    expect(next.results[0].totalScore).toBe(10000);
    expect(next.results[0].timedOut).toBeUndefined();
  });

  it('marks timeout rounds as zero-score with timedOut true', () => {
    const rounds = [makeRound('r1')];
    const started = gameReducer(initialGameState, { type: 'START_GAME', rounds });
    const timedOut = gameReducer(started, { type: 'SUBMIT_TIMEOUT', hintsUsed: 3 });

    expect(timedOut.results).toHaveLength(1);
    expect(timedOut.results[0].locationScore).toBe(0);
    expect(timedOut.results[0].timeScore).toBe(0);
    expect(timedOut.results[0].totalScore).toBe(0);
    expect(timedOut.results[0].timedOut).toBe(true);
  });

  it('finishes after the last round boundary', () => {
    const rounds = Array.from({ length: ROUNDS_PER_GAME }, (_, i) => makeRound(`r${i + 1}`));
    let state = gameReducer(initialGameState, { type: 'START_GAME', rounds });

    for (let i = 1; i < ROUNDS_PER_GAME; i++) {
      state = gameReducer(state, { type: 'NEXT_ROUND' });
    }
    expect(state.status).toBe('playing');

    const finished = gameReducer(state, { type: 'NEXT_ROUND' });
    expect(finished.status).toBe('finished');
  });
});
