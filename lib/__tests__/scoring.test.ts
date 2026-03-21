import { describe, expect, it } from 'vitest';
import {
  distanceKm,
  hintPenalty,
  locationScore,
  roundScore,
  timeScore,
  type Coordinate,
} from '@/lib/scoring';
import {
  HINT_TIER_COSTS,
  MAX_DISTANCE_KM,
  MAX_LOCATION_SCORE,
  MAX_TIME_SCORE,
  MAX_YEARS_DIFF,
} from '@/constants/scoring';

const ORIGIN: Coordinate = { lat: 0, lng: 0 };

describe('scoring', () => {
  it('returns max location score for exact location', () => {
    expect(locationScore(ORIGIN, ORIGIN)).toBe(MAX_LOCATION_SCORE);
  });

  it('returns zero location score at max distance or above', () => {
    const farGuess: Coordinate = { lat: 0, lng: (MAX_DISTANCE_KM / 111.32) * 1.1 };
    expect(locationScore(farGuess, ORIGIN)).toBe(0);
  });

  it('returns max time score for exact year and zero at max diff', () => {
    expect(timeScore(1990, 1990)).toBe(MAX_TIME_SCORE);
    expect(timeScore(1990 + MAX_YEARS_DIFF, 1990)).toBe(0);
  });

  it('computes hint penalty from tier costs', () => {
    expect(hintPenalty(0)).toBe(0);
    expect(hintPenalty(3)).toBe(HINT_TIER_COSTS[0] + HINT_TIER_COSTS[1] + HINT_TIER_COSTS[2]);
  });

  it('applies tier 4 and tier 5 round score rules', () => {
    const base = roundScore(ORIGIN, ORIGIN, 2000, 2000, 0);
    expect(base.total).toBe(MAX_LOCATION_SCORE + MAX_TIME_SCORE);

    const tier4 = roundScore(ORIGIN, ORIGIN, 2000, 2000, 4);
    expect(tier4.locationScore).toBe(0);
    expect(tier4.total).toBe(MAX_TIME_SCORE - hintPenalty(4));

    const tier5 = roundScore(ORIGIN, ORIGIN, 2000, 2000, 5);
    expect(tier5.locationScore).toBe(0);
    expect(tier5.timeScore).toBe(0);
    expect(tier5.total).toBe(0);
  });

  it('computes realistic distance in km', () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const london = { lat: 51.5074, lng: -0.1278 };
    expect(Math.round(distanceKm(paris, london))).toBeGreaterThan(330);
    expect(Math.round(distanceKm(paris, london))).toBeLessThan(360);
  });
});
