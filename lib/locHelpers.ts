import type { PhotoLicense } from '@/lib/photos';

export type GeoRegion =
  | 'north_america'
  | 'latin_america'
  | 'western_europe'
  | 'eastern_europe'
  | 'middle_east'
  | 'africa'
  | 'south_asia'
  | 'east_asia'
  | 'southeast_asia'
  | 'oceania'
  | 'unknown';

/**
 * Classify a lat/lng coordinate into a broad geographic region using
 * approximate bounding boxes. Pure function — no React Native imports.
 */
export function classifyRegion(lat: number, lng: number): GeoRegion {
  // southeast_asia checked before east_asia due to overlapping lng range
  if (lat >= -10 && lat <= 25 && lng >= 92 && lng <= 141) return 'southeast_asia';
  if (lat >= 18 && lat <= 53 && lng >= 92 && lng <= 145) return 'east_asia';
  if (lat >= 15 && lat <= 72 && lng >= -168 && lng <= -52) return 'north_america';
  if (lat >= -56 && lat <= 15 && lng >= -82 && lng <= -34) return 'latin_america';
  if (lat >= 35 && lat <= 72 && lng >= -11 && lng <= 20) return 'western_europe';
  if (lat >= 35 && lat <= 72 && lng >= 20 && lng <= 45) return 'eastern_europe';
  if (lat >= 12 && lat <= 42 && lng >= 25 && lng <= 63) return 'middle_east';
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return 'africa';
  if (lat >= 5 && lat <= 37 && lng >= 60 && lng <= 92) return 'south_asia';
  if (lat >= -47 && lat <= -10 && lng >= 110 && lng <= 180) return 'oceania';
  return 'unknown';
}

/** Parse LOC date strings: "1937", "ca. 1920", "1930-1940" → earliest 4-digit year. */
export function parseLOCDate(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.match(/\b(1[89]\d\d|20[012]\d)\b/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  return year >= 1800 && year <= new Date().getFullYear() ? year : null;
}

/** Parse LOC latlong field: "38.8921, -77.0241" → { lat, lng }. */
export function parseLOCLatLng(
  raw: string | undefined | null
): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && parts.every(Number.isFinite)) {
    const [lat, lng] = parts;
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

/** Map LOC rights_information text → PhotoLicense, or null to reject the image. */
export function mapLOCRights(rights: string | undefined | null): PhotoLicense | null {
  if (!rights) return null;
  const r = rights.toLowerCase();
  if (r.includes('no known copyright') || r.includes('public domain')) return 'public_domain';
  if (r.includes('cc0')) return 'cc0';
  // Rights-managed or unknown — reject
  return null;
}

/** Map Europeana rights URI → PhotoLicense, or null to reject. */
export function mapEuropeanaRights(rights: string | undefined | null): PhotoLicense | null {
  if (!rights) return null;
  const r = rights.toLowerCase();
  if (r.includes('creativecommons.org/publicdomain/zero') || r.includes('/cc0')) return 'cc0';
  if (r.includes('creativecommons.org/licenses/by-sa')) return 'cc_by_sa';
  if (r.includes('creativecommons.org/licenses/by/')) return 'cc_by';
  if (r.includes('rightsstatements.org/vocab/noc') || r.includes('publicdomain'))
    return 'public_domain';
  return null;
}
