/**
 * Pipeline utilities — helpers used by provider modules.
 *
 * The old keyword-based scoring (validateCandidate) has been removed.
 * Scoring is now handled by scoring.ts (unified CLIP + LLM).
 * Hard fail checks are in scoring.ts.
 */

// ─── Term lists (used by providers for extraction/filtering) ─────────────────

export const EXCLUSION_TERMS = [
  'logo',
  'diagram',
  'map',
  'chart',
  'flag',
  'coat of arms',
  'icon',
  'symbol',
  'painting',
  'drawing',
  'illustration',
  'scan',
  'screenshot',
  'studio',
  'still life',
  'microscopy',
  'x-ray',
  'satellite',
];

export const HISTORICAL_SIGNAL_TERMS = [
  'historic',
  'historical',
  'dedication',
  'territory',
  'opening',
  'archive',
  'ceremony',
  'roosevelt dam',
  '19th century',
  'early 1900',
  '1910s',
  '1920s',
  '1930s',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function includesAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((w) => normalized.includes(w));
}

export function extractContentYearHint(text: string): number | null {
  const yearMatch = text.match(/\b(18|19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    if (year >= 1800 && year <= new Date().getFullYear()) return year;
  }
  const decadeMatch = text.match(/\b(18|19|20)\d0s\b/);
  if (decadeMatch) {
    const decade = parseInt(decadeMatch[0].slice(0, 4), 10);
    if (decade >= 1800 && decade <= new Date().getFullYear()) return decade + 5;
  }
  return null;
}

export function eraBucket(year: number) {
  if (year < 1950) return 'pre_1950';
  if (year < 1980) return 'y1950_1979';
  if (year < 2000) return 'y1980_1999';
  if (year < 2015) return 'y2000_2014';
  return 'y2015_plus';
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
