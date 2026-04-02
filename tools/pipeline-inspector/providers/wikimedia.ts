import type { NormalizedCandidate, PhotoLicense } from '../src/types.js';
import {
  delay,
  includesAny,
  extractContentYearHint,
  EXCLUSION_TERMS,
  HISTORICAL_SIGNAL_TERMS,
} from '../pipeline.js';

const USER_AGENT = 'TimeGuesserApp/1.0 (https://github.com/timeguesser; contact@timeguesser.app)';

const ROOT_CATEGORIES = [
  'Category:Street scenes',
  'Category:Street scenes in the 2010s',
  'Category:Streets by country',
  'Category:Street scenes in the 1960s',
  'Category:Street photography by city',
  'Category:Street scenes in the 2000s',
  'Category:Road signs by country',
  'Category:Street scenes in the 1970s',
  'Category:Traffic signs by country',
  'Category:Street scenes in the 1980s',
  'Category:Bus stops by country',
  'Category:Street scenes in the 1990s',
  'Category:Railway stations by country',
  'Category:Street scenes in the 1950s',
  'Category:Buildings by country',
  'Category:Street scenes in the 2020s',
  'Category:Storefronts',
  'Category:Street scenes in the 1940s',
  'Category:Markets by country',
  'Category:Street scenes in the 1930s',
  'Category:People by country',
  'Category:Street scenes in the 1920s',
  'Category:Crowds',
  'Category:Street scenes in the 1910s',
  'Category:Festivals by country',
  'Category:Street scenes in the 1900s',
  'Category:Parades',
  'Category:Historic street scenes',
  'Category:Cityscapes by country',
  'Category:Street scenes by decade',
  'Category:Skylines by country',
  'Category:Parks by country',
  'Category:Harbours by country',
];

const PLACE_BBOXES: Record<
  string,
  { minLat: number; maxLat: number; minLng: number; maxLng: number }
> = {
  arizona: { minLat: 31.0, maxLat: 37.1, minLng: -114.9, maxLng: -109.0 },
  kansas: { minLat: 37.0, maxLat: 40.0, minLng: -102.1, maxLng: -94.6 },
  netherlands: { minLat: 50.7, maxLat: 53.8, minLng: 3.0, maxLng: 7.3 },
  belgium: { minLat: 49.4, maxLat: 51.6, minLng: 2.5, maxLng: 6.4 },
  france: { minLat: 41.2, maxLat: 51.2, minLng: -5.5, maxLng: 9.8 },
  germany: { minLat: 47.2, maxLat: 55.2, minLng: 5.9, maxLng: 15.1 },
  'united kingdom': { minLat: 49.8, maxLat: 60.9, minLng: -8.8, maxLng: 1.9 },
  usa: { minLat: 24.3, maxLat: 49.5, minLng: -125.0, maxLng: -66.9 },
  'united states': { minLat: 24.3, maxLat: 49.5, minLng: -125.0, maxLng: -66.9 },
};

interface WikiExtMetadata {
  [key: string]: { value: string; source?: string } | undefined;
}

function parseYear(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const y = Math.round(value);
    return y >= 1800 && y <= new Date().getFullYear() ? y : null;
  }
  if (typeof value !== 'string') return null;
  const m = value.match(/(18|19|20)\d{2}/);
  if (!m) return null;
  const y = parseInt(m[0], 10);
  return y >= 1800 && y <= new Date().getFullYear() ? y : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function mapLicense(ext: WikiExtMetadata): PhotoLicense {
  const licenseShort = String(ext?.LicenseShortName?.value ?? '').toLowerCase();
  const usageTerms = String(ext?.UsageTerms?.value ?? '').toLowerCase();
  const text = `${licenseShort} ${usageTerms}`;
  if (text.includes('cc0') || text.includes('cc-zero')) return 'cc0';
  if (text.includes('public domain')) return 'public_domain';
  if (text.includes('cc by-sa') || text.includes('cc-by-sa')) return 'cc_by_sa';
  return 'cc_by';
}

function hasAllowedLicense(ext: WikiExtMetadata): boolean {
  const licenseShort = String(ext?.LicenseShortName?.value ?? '').toLowerCase();
  const usageTerms = String(ext?.UsageTerms?.value ?? '').toLowerCase();
  const text = `${licenseShort} ${usageTerms}`;
  return (
    text.includes('creative commons') ||
    text.includes('cc-by') ||
    text.includes('public domain') ||
    text.includes('cc0')
  );
}

function containsArtworkMedium(text: string): boolean {
  return /\b(paintings?|drawings?|illustrations?|watercolou?rs?|lithographs?|engravings?|etchings?|woodcuts?|gouache|pastel|oil on canvas|pd-art|in art|works by)\b/i.test(
    text
  );
}

function hasPhotoSignal(text: string): boolean {
  return /\b(photographs?|photo|albumen|gelatin silver|silver gelatin|negative|film)\b/i.test(text);
}

function isHistoricalDecadeStreetCategory(text: string): boolean {
  return /\bstreet scenes in the ((18|19)\d0)s\b/i.test(text);
}

function detectLocationConflict(text: string, point: { lat: number; lng: number }): boolean {
  const haystack = text.toLowerCase();
  for (const [place, bbox] of Object.entries(PLACE_BBOXES)) {
    if (!haystack.includes(place)) continue;
    const inside =
      point.lat >= bbox.minLat &&
      point.lat <= bbox.maxLat &&
      point.lng >= bbox.minLng &&
      point.lng <= bbox.maxLng;
    if (!inside) return true;
  }
  return false;
}

function extractYearWithProvenance(args: {
  ext: WikiExtMetadata;
  timestamp: unknown;
  title: string;
  description?: string;
  categoryText: string;
}) {
  const captureDate = parseYear(args.ext?.DateTimeOriginal?.value);
  if (captureDate) {
    return {
      year: captureDate,
      yearSource: 'capture_exif' as const,
      yearConfidence: 'high' as const,
      contentYearHint: null,
      historicalContextSignal: false,
    };
  }

  const structuredDate =
    parseYear(args.ext?.DateTime?.value) ??
    parseYear(args.ext?.DateTimeDigitized?.value) ??
    parseYear(args.ext?.ObjectName?.value) ??
    parseYear(args.ext?.ImageDescription?.value);
  if (structuredDate) {
    return {
      year: structuredDate,
      yearSource: 'structured_metadata' as const,
      yearConfidence: 'medium' as const,
      contentYearHint: null,
      historicalContextSignal: false,
    };
  }

  const contentText = `${args.title} ${args.description ?? ''} ${args.categoryText}`.toLowerCase();
  const contentYearHint = extractContentYearHint(contentText);
  const historicalContextSignal =
    includesAny(contentText, HISTORICAL_SIGNAL_TERMS) ||
    (contentYearHint !== null && contentYearHint < 1975);

  if (contentYearHint) {
    return {
      year: contentYearHint,
      yearSource: 'content_inferred' as const,
      yearConfidence: 'medium' as const,
      contentYearHint,
      historicalContextSignal,
    };
  }

  const uploadDate = parseYear(args.timestamp);
  if (uploadDate) {
    return {
      year: uploadDate,
      yearSource: 'upload_timestamp' as const,
      yearConfidence: 'low' as const,
      contentYearHint,
      historicalContextSignal,
    };
  }

  return {
    year: null,
    yearSource: 'upload_timestamp' as const,
    yearConfidence: 'low' as const,
    contentYearHint,
    historicalContextSignal,
  };
}

async function fetchFileMembers(category: string, limit = 40): Promise<string[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmtype=file&cmlimit=${Math.min(50, limit)}`;
  await delay(200);
  try {
    const res = await fetch(url, { headers: { 'Api-User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json();
    const members = Array.isArray(data?.query?.categorymembers) ? data.query.categorymembers : [];
    return members
      .map((m: { title?: string }) => m?.title)
      .filter((t: unknown): t is string => typeof t === 'string' && t.startsWith('File:'));
  } catch {
    return [];
  }
}

async function fetchSubcategoryMembers(category: string, limit = 8): Promise<string[]> {
  await delay(200);
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmtype=subcat&cmlimit=${Math.min(20, limit)}`,
      { headers: { 'Api-User-Agent': USER_AGENT } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const members = Array.isArray(data?.query?.categorymembers) ? data.query.categorymembers : [];
    return members
      .map((m: { title?: string }) => m?.title)
      .filter((t: unknown): t is string => typeof t === 'string' && t.startsWith('Category:'));
  } catch {
    return [];
  }
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function fetchWikimediaCandidates(
  categoryIndex = 0,
  limit = 40
): Promise<{ candidates: NormalizedCandidate[]; rejectedByReason: Record<string, number> }> {
  const category = ROOT_CATEGORIES[categoryIndex % ROOT_CATEGORIES.length];
  const candidates: NormalizedCandidate[] = [];
  const rejectedByReason: Record<string, number> = {};

  // Fetch direct files + subcategory files
  const directTitles = await fetchFileMembers(category, Math.ceil(limit * 0.6));
  const subcats = await fetchSubcategoryMembers(category, 10);
  const subcatTitles: string[] = [];
  for (const sub of shuffle(subcats).slice(0, 4)) {
    const files = await fetchFileMembers(sub, 12);
    subcatTitles.push(...files);
  }
  const allTitles = Array.from(new Set([...directTitles, ...subcatTitles])).slice(0, limit * 2);

  if (allTitles.length === 0) return { candidates, rejectedByReason };

  // Fetch image info in chunks of 25
  for (let i = 0; i < allTitles.length; i += 25) {
    const chunk = allTitles.slice(i, i + 25);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      titles: chunk.join('|'),
      prop: 'imageinfo|categories',
      iiprop: 'url|timestamp|extmetadata|size|mime',
      iiurlwidth: '1600',
      cllimit: '20',
    });

    await delay(200);
    try {
      const res = await fetch('https://commons.wikimedia.org/w/api.php', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Api-User-Agent': USER_AGENT,
        },
        body: params.toString(),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const pages = Object.values(data?.query?.pages ?? {}) as Record<string, unknown>[];

      for (const page of pages) {
        const info = (page as Record<string, unknown>)?.imageinfo as
          | Record<string, unknown>[]
          | undefined;
        const ii = info?.[0] as Record<string, unknown> | undefined;
        if (!ii?.url) continue;
        const ext = (ii?.extmetadata ?? {}) as WikiExtMetadata;

        const lat = parseFloat(String(ext?.GPSLatitude?.value ?? ''));
        const lng = parseFloat(String(ext?.GPSLongitude?.value ?? ''));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        const width = Number(ii?.width ?? 0);
        const height = Number(ii?.height ?? 0);
        if (Math.max(width, height) < 1024) continue;

        const mime = String(ii?.mime ?? '').toLowerCase();
        if (mime !== 'image/jpeg' && mime !== 'image/png') continue;
        if (!hasAllowedLicense(ext)) continue;

        const title = String((page as Record<string, unknown>)?.title ?? 'Wikimedia image').replace(
          /^File:/,
          ''
        );
        const description =
          typeof ext?.ImageDescription?.value === 'string' ? ext.ImageDescription.value : undefined;

        const categories = Array.isArray((page as Record<string, unknown>)?.categories)
          ? ((page as Record<string, unknown>).categories as { title: string }[])
          : [];
        const pageCategoryText = categories
          .map((c) => String(c?.title ?? ''))
          .join(' ')
          .toLowerCase();
        const extCategoryText = String(ext?.Categories?.value ?? '').toLowerCase();
        const categoryText = `${pageCategoryText} ${extCategoryText}`.trim();
        const haystack = `${title.toLowerCase()} ${String(description ?? '').toLowerCase()} ${categoryText}`;

        if (EXCLUSION_TERMS.some((t) => haystack.includes(t))) continue;

        if (containsArtworkMedium(haystack)) {
          rejectedByReason.rejected_artwork_medium =
            (rejectedByReason.rejected_artwork_medium ?? 0) + 1;
          continue;
        }

        if (isHistoricalDecadeStreetCategory(categoryText) && !hasPhotoSignal(haystack)) {
          rejectedByReason.rejected_non_photo_historical_media =
            (rejectedByReason.rejected_non_photo_historical_media ?? 0) + 1;
          continue;
        }

        const yearMeta = extractYearWithProvenance({
          ext,
          timestamp: ii?.timestamp,
          title,
          description,
          categoryText,
        });
        if (!yearMeta.year) continue;

        const locationConflictDetected = detectLocationConflict(haystack, { lat, lng });
        const pageTitle = String((page as Record<string, unknown>).title ?? '');

        candidates.push({
          provider: 'wikimedia',
          providerImageId: String((page as Record<string, unknown>).pageid),
          imageUri: String(ii.url),
          location: { lat, lng },
          locationSource: 'gps_exif',
          locationConfidence: 'high',
          year: yearMeta.year,
          yearSource: yearMeta.yearSource,
          yearConfidence: yearMeta.yearConfidence,
          title,
          description: description ? stripHtml(description) : undefined,
          tags: categories.map((c) => c.title),
          license: mapLicense(ext),
          author: ext?.Artist?.value ? stripHtml(String(ext.Artist.value)) : undefined,
          institutionName: 'Wikimedia Commons',
          originalUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
          contentYearHint: yearMeta.contentYearHint ?? undefined,
          historicalContextSignal: yearMeta.historicalContextSignal,
          locationConflictDetected,
        });
      }
    } catch {
      // Skip chunk on network error
    }
  }

  return { candidates: shuffle(candidates).slice(0, limit), rejectedByReason };
}

export function getWikimediaCategoryCount(): number {
  return ROOT_CATEGORIES.length;
}

export function getWikimediaCategoryLabels(): string[] {
  return ROOT_CATEGORIES.map((c) => c.replace('Category:', ''));
}
