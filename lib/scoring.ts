import {
  MAX_LOCATION_SCORE,
  MAX_TIME_SCORE,
  MAX_DISTANCE_KM,
  LOCATION_SCORE_CURVE_POWER,
  MAX_YEARS_DIFF,
  TIME_SCORE_CURVE_POWER,
  HINT_TIER_COSTS,
} from '@/constants/scoring';

export interface Coordinate {
  lat: number;
  lng: number;
}

/** Haversine distance between two coordinates in km */
export function distanceKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Location score: 0–5000 based on distance */
export function locationScore(guess: Coordinate, actual: Coordinate): number {
  const dist = distanceKm(guess, actual);
  const normalized = Math.max(0, 1 - dist / MAX_DISTANCE_KM);
  return Math.round(MAX_LOCATION_SCORE * Math.pow(normalized, LOCATION_SCORE_CURVE_POWER));
}

/** Time score: 0–5000 based on year difference */
export function timeScore(guessYear: number, actualYear: number): number {
  const diff = Math.abs(guessYear - actualYear);
  const normalized = Math.max(0, 1 - diff / MAX_YEARS_DIFF);
  return Math.round(MAX_TIME_SCORE * Math.pow(normalized, TIME_SCORE_CURVE_POWER));
}

/** Total hint cost for the number of tiers used */
export function hintPenalty(hintsUsed: number): number {
  let total = 0;
  for (let i = 0; i < hintsUsed; i++) {
    total += HINT_TIER_COSTS[i] ?? 0;
  }
  return total;
}

/**
 * Total round score.
 * - maxTierUsed >= 5: round total is forced to 0
 * - maxTierUsed >= 4: location score is forced to 0
 */
export function roundScore(
  guess: Coordinate,
  actual: Coordinate,
  guessYear: number,
  actualYear: number,
  hintsUsed: number
): { locationScore: number; timeScore: number; hintPenalty: number; total: number } {
  // Tier 5: full answer revealed -> round is 0
  if (hintsUsed >= 5) {
    return { locationScore: 0, timeScore: 0, hintPenalty: 0, total: 0 };
  }

  // Tier 4: exact location revealed -> location score is 0
  const loc = hintsUsed >= 4 ? 0 : locationScore(guess, actual);
  const time = timeScore(guessYear, actualYear);
  const penalty = hintPenalty(hintsUsed);
  const total = Math.max(0, loc + time - penalty);
  return { locationScore: loc, timeScore: time, hintPenalty: penalty, total };
}
