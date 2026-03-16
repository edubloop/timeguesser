import type { RoundData } from '@/lib/gameState';
import type { Coordinate } from '@/lib/scoring';
import {
  HINT_TIER2_RADIUS_KM,
  HINT_TIER3_RADIUS_KM,
  HINT_TIER2_OFFSET_MIN_KM,
  HINT_TIER2_OFFSET_MAX_KM,
  HINT_TIER3_OFFSET_MIN_KM,
  HINT_TIER3_OFFSET_MAX_KM,
  HINT_TIER_COSTS,
  MAX_HINTS,
} from '@/constants/scoring';

export type HintTier = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// LLM provider types (retained for future use, currently disabled)
// ---------------------------------------------------------------------------

export type LlmProvider = 'anthropic' | 'openai' | 'google' | 'mock';

export const PROVIDER_MODELS: Record<LlmProvider, string[]> = {
  anthropic: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  google: ['gemini-2.0-flash', 'gemini-1.5-flash'],
  mock: ['fallback-v1'],
};

// ---------------------------------------------------------------------------
// Macro-region definitions for Tier 1
// ---------------------------------------------------------------------------

interface MacroRegion {
  name: string;
  bounds: { north: number; south: number; west: number; east: number };
}

const MACRO_REGIONS: MacroRegion[] = [
  { name: 'North & Central America', bounds: { north: 72, south: 7, west: -170, east: -50 } },
  { name: 'South America', bounds: { north: 13, south: -56, west: -82, east: -34 } },
  { name: 'Western Europe', bounds: { north: 72, south: 35, west: -12, east: 25 } },
  { name: 'Eastern Europe', bounds: { north: 72, south: 35, west: 25, east: 60 } },
  { name: 'Northern Africa & Middle East', bounds: { north: 38, south: 10, west: -18, east: 60 } },
  { name: 'Sub-Saharan Africa', bounds: { north: 10, south: -35, west: -18, east: 52 } },
  { name: 'Central & South Asia', bounds: { north: 55, south: 5, west: 60, east: 100 } },
  { name: 'East Asia', bounds: { north: 55, south: 18, west: 100, east: 150 } },
  { name: 'Southeast Asia', bounds: { north: 28, south: -12, west: 92, east: 155 } },
  { name: 'Oceania', bounds: { north: -5, south: -48, west: 110, east: 180 } },
];

function findMacroRegion(coord: Coordinate): MacroRegion {
  for (const region of MACRO_REGIONS) {
    const { north, south, west, east } = region.bounds;
    if (coord.lat <= north && coord.lat >= south && coord.lng >= west && coord.lng <= east) {
      return region;
    }
  }
  // Fallback: return the nearest region by center distance
  let best = MACRO_REGIONS[0];
  let bestDist = Infinity;
  for (const region of MACRO_REGIONS) {
    const cLat = (region.bounds.north + region.bounds.south) / 2;
    const cLng = (region.bounds.west + region.bounds.east) / 2;
    const d = Math.pow(coord.lat - cLat, 2) + Math.pow(coord.lng - cLng, 2);
    if (d < bestDist) {
      bestDist = d;
      best = region;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Circle reveal geometry for Tiers 2 & 3
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random from a string seed (0..1) */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

/** Offset a coordinate by distance (km) at a given bearing (degrees) */
function offsetCoordinate(coord: Coordinate, distanceKm: number, bearingDeg: number): Coordinate {
  const R = 6371;
  const lat1 = (coord.lat * Math.PI) / 180;
  const lng1 = (coord.lng * Math.PI) / 180;
  const bearing = (bearingDeg * Math.PI) / 180;
  const angDist = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

export interface CircleReveal {
  center: Coordinate;
  radiusKm: number;
}

function computeCircleReveal(
  target: Coordinate,
  radiusKm: number,
  offsetMinKm: number,
  offsetMaxKm: number,
  seed: string
): CircleReveal {
  const r1 = seededRandom(seed + ':bearing');
  const r2 = seededRandom(seed + ':offset');
  const bearing = r1 * 360;
  const offset = offsetMinKm + r2 * (offsetMaxKm - offsetMinKm);
  const center = offsetCoordinate(target, offset, bearing);
  return { center, radiusKm };
}

// ---------------------------------------------------------------------------
// Hint result types
// ---------------------------------------------------------------------------

export type HintType = 'region' | 'circle' | 'location_reveal' | 'full_reveal';

export interface HintResult {
  tier: HintTier;
  type: HintType;
  text: string;
  cost: number;
  /** For tier 1: macro-region bounding box */
  regionBounds?: { north: number; south: number; west: number; east: number };
  /** For tiers 2-3: circle on map */
  circle?: CircleReveal;
  /** For tier 4-5: exact location */
  revealedLocation?: Coordinate;
  /** For tier 5: exact year */
  revealedYear?: number;
}

// ---------------------------------------------------------------------------
// Hint descriptions for the confirmation modal
// ---------------------------------------------------------------------------

export interface HintPreview {
  tier: HintTier;
  title: string;
  description: string;
  cost: number;
  costLabel: string;
  scoringWarning?: string;
}

export function getHintPreview(nextTier: HintTier): HintPreview {
  const cost = HINT_TIER_COSTS[nextTier - 1];
  const costLabel = cost === 0 ? 'Free' : `-${cost.toLocaleString('de-DE')} pts`;

  switch (nextTier) {
    case 1:
      return {
        tier: 1,
        title: 'Coarse Location',
        description: 'Reveals the continent or sub-continent where this photo was taken.',
        cost,
        costLabel,
      };
    case 2:
      return {
        tier: 2,
        title: 'Regional Area',
        description: 'Shows an approximate 1,000 km search radius on the map.',
        cost,
        costLabel,
      };
    case 3:
      return {
        tier: 3,
        title: 'Tight Area',
        description: 'Narrows to an approximate 250 km search radius on the map.',
        cost,
        costLabel,
      };
    case 4:
      return {
        tier: 4,
        title: 'Exact Location',
        description: 'Reveals the exact location pin on the map.',
        cost,
        costLabel,
        scoringWarning: 'Location score will be 0 for this round.',
      };
    case 5:
      return {
        tier: 5,
        title: 'Full Answer',
        description: 'Reveals the exact location and year. Year picker will be skipped.',
        cost,
        costLabel,
        scoringWarning: 'Round score will be 0.',
      };
  }
}

// ---------------------------------------------------------------------------
// Hint generation (deterministic, no LLM)
// ---------------------------------------------------------------------------

export function generateHint(round: RoundData, tier: HintTier): HintResult {
  const cost = HINT_TIER_COSTS[tier - 1];
  const seed = `${round.id}-${tier}`;

  switch (tier) {
    case 1: {
      const region = findMacroRegion(round.location);
      return {
        tier,
        type: 'region',
        text: `Somewhere in ${region.name}`,
        cost,
        regionBounds: region.bounds,
      };
    }
    case 2: {
      const circle = computeCircleReveal(
        round.location,
        HINT_TIER2_RADIUS_KM,
        HINT_TIER2_OFFSET_MIN_KM,
        HINT_TIER2_OFFSET_MAX_KM,
        seed
      );
      return {
        tier,
        type: 'circle',
        text: `Within ~${HINT_TIER2_RADIUS_KM.toLocaleString('de-DE')} km of this area`,
        cost,
        circle,
      };
    }
    case 3: {
      const circle = computeCircleReveal(
        round.location,
        HINT_TIER3_RADIUS_KM,
        HINT_TIER3_OFFSET_MIN_KM,
        HINT_TIER3_OFFSET_MAX_KM,
        seed
      );
      return {
        tier,
        type: 'circle',
        text: `Within ~${HINT_TIER3_RADIUS_KM} km of this area`,
        cost,
        circle,
      };
    }
    case 4:
      return {
        tier,
        type: 'location_reveal',
        text: `Exact location revealed`,
        cost,
        revealedLocation: round.location,
      };
    case 5:
      return {
        tier,
        type: 'full_reveal',
        text: `Full answer: ${round.year}`,
        cost,
        revealedLocation: round.location,
        revealedYear: round.year,
      };
  }
}

/** Total hint cost for tiers used so far */
export function totalHintCost(hintsUsed: number): number {
  let total = 0;
  for (let i = 0; i < Math.min(hintsUsed, MAX_HINTS); i++) {
    total += HINT_TIER_COSTS[i];
  }
  return total;
}
