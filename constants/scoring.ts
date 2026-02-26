export const MAX_LOCATION_SCORE = 5000;
export const MAX_TIME_SCORE = 5000;
export const MAX_ROUND_SCORE = MAX_LOCATION_SCORE + MAX_TIME_SCORE;
export const ROUNDS_PER_GAME = 5;
export const MAX_GAME_SCORE = MAX_ROUND_SCORE * ROUNDS_PER_GAME;

// Distance normalization for location scoring
export const MAX_DISTANCE_KM = 12000;
export const LOCATION_SCORE_CURVE_POWER = 2;

// Maximum year difference for scoring (quadratic curve, matching location scoring style)
// At 120 years off → score = 0. Quadratic (p=2) means near-misses score well,
// but accuracy drops off steeply: 10y off ≈ 3,472, 30y off ≈ 2,813, 60y off ≈ 1,250
export const MAX_YEARS_DIFF = 120;
export const TIME_SCORE_CURVE_POWER = 2.0;

// Hint system
export const MAX_HINTS = 5;

// Hint costs per tier (index 0 = tier 1)
// Tier 1 is free; tiers 2-5 cost 1000 each
export const HINT_TIER_COSTS: readonly number[] = [0, 1000, 1000, 1000, 1000];

// Hint radius sizes (km) for map circle reveals
export const HINT_TIER2_RADIUS_KM = 1000;
export const HINT_TIER3_RADIUS_KM = 250;

// Offset ranges for off-center circle placement (km)
export const HINT_TIER2_OFFSET_MIN_KM = 200;
export const HINT_TIER2_OFFSET_MAX_KM = 600;
export const HINT_TIER3_OFFSET_MIN_KM = 50;
export const HINT_TIER3_OFFSET_MAX_KM = 150;
