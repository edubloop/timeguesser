import { describe, expect, it } from 'vitest';
import { HINT_TIER2_RADIUS_KM, HINT_TIER3_RADIUS_KM } from '@/constants/scoring';
import { generateHint, getHintPreview, totalHintCost } from '@/lib/hints';
import type { RoundData } from '@/lib/gameState';

const ROUND: RoundData = {
  id: 'round-1',
  source: 'public',
  location: { lat: 48.8584, lng: 2.2945 },
  year: 1989,
  imageUri: 'https://example.com/image.jpg',
  label: 'Test round',
  locationLabel: 'Paris, France',
};

describe('hints', () => {
  it('returns deterministic tier 2 and tier 3 circles', () => {
    const t2a = generateHint(ROUND, 2);
    const t2b = generateHint(ROUND, 2);
    expect(t2a.type).toBe('circle');
    expect(t2a.circle?.radiusKm).toBe(HINT_TIER2_RADIUS_KM);
    expect(t2a.circle).toEqual(t2b.circle);

    const t3 = generateHint(ROUND, 3);
    expect(t3.type).toBe('circle');
    expect(t3.circle?.radiusKm).toBe(HINT_TIER3_RADIUS_KM);
  });

  it('returns location reveal at tier 4 and full reveal at tier 5', () => {
    const tier4 = generateHint(ROUND, 4);
    expect(tier4.type).toBe('location_reveal');
    expect(tier4.revealedLocation).toEqual(ROUND.location);

    const tier5 = generateHint(ROUND, 5);
    expect(tier5.type).toBe('full_reveal');
    expect(tier5.revealedLocation).toEqual(ROUND.location);
    expect(tier5.revealedYear).toBe(ROUND.year);
  });

  it('builds user-facing previews with expected warnings', () => {
    expect(getHintPreview(1).costLabel).toBe('Free');
    expect(getHintPreview(4).scoringWarning).toContain('Location score will be 0');
    expect(getHintPreview(5).scoringWarning).toContain('Round score will be 0');
  });

  it('caps total hint cost at max hint tiers', () => {
    expect(totalHintCost(0)).toBe(0);
    expect(totalHintCost(5)).toBe(4000);
    expect(totalHintCost(50)).toBe(4000);
  });
});
