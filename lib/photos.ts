import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ROUNDS_PER_GAME } from '@/constants/scoring';
import type { RoundData } from '@/lib/gameState';
import { TEST_ROUNDS } from '@/lib/testPhotos';

export type PhotoSourcePreference = 'public' | 'personal' | 'mixed';
export type PublicImageSource = 'wikimedia' | 'test';
type PublicProvider = 'wikimedia' | 'test';

export interface PublicSelectionFilters {
  requireStreetScene: boolean;
  requirePeopleContext: boolean;
  requireGeoClues: boolean;
  requireTemporalClues: boolean;
  rejectIndoorOnly: boolean;
  rejectLowSignalObjects: boolean;
  enforceGuessabilityThreshold: boolean;
}

export const DEFAULT_PUBLIC_SELECTION_FILTERS: PublicSelectionFilters = {
  requireStreetScene: false,
  requirePeopleContext: false,
  requireGeoClues: false,
  requireTemporalClues: false,
  rejectIndoorOnly: false,
  rejectLowSignalObjects: false,
  enforceGuessabilityThreshold: false,
};

export interface PersonalImportSummary {
  rounds: RoundData[];
  warnings: string[];
}

export interface ClearPublicCacheSummary {
  removedImages: number;
  removedSeenEntries: number;
}

export interface PublicCacheSummary {
  imagesInCache: number;
  seenImagesRecorded: number;
  unseenImagesAvailable: number;
  lastUpdatedAt: number | null;
}

export interface FillPublicCacheSummary extends PublicCacheSummary {
  targetUnseen: number;
  targetReached: boolean;
}

interface BuildRoundsArgs {
  source: PhotoSourcePreference;
  personalRounds: RoundData[];
  publicImageSource: PublicImageSource;
  publicSelectionFilters: PublicSelectionFilters;
  diagnosticsEnabled?: boolean;
  roundsPerGame?: number;
}

interface ReplacementArgs {
  currentRound: RoundData;
  usedRoundIds: string[];
  publicImageSource: PublicImageSource;
  publicSelectionFilters: PublicSelectionFilters;
  diagnosticsEnabled?: boolean;
}

interface PublicPhotoCandidate {
  provider: PublicProvider;
  providerImageId: string;
  imageUri: string;
  location: { lat: number; lng: number };
  locationSource: 'gps_exif' | 'content_inferred';
  locationConfidence: 'high' | 'medium' | 'low';
  year: number;
  yearSource: 'capture_exif' | 'structured_metadata' | 'content_inferred' | 'upload_timestamp';
  yearConfidence: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  categories?: any[];
  contentYearHint?: number;
  historicalContextSignal?: boolean;
  locationConflictDetected?: boolean;
}

interface CandidateExtractionResult {
  candidates: PublicPhotoCandidate[];
  rejectedByReason: Record<string, number>;
}

interface ValidationResult {
  score: number;
  pass: boolean;
  hardFail: boolean;
  reasons: string[];
  warnings: string[];
}

interface CachedPublicImage {
  cacheId: string;
  provider: PublicProvider;
  providerImageId: string;
  remoteUri: string;
  localUri: string;
  location: { lat: number; lng: number };
  year: number;
  title: string;
  displayTitle: string;
  displayLocation: string;
  description?: string;
  fetchedAt: number;
  lastUsedAt?: number;
}

interface CacheState {
  images: CachedPublicImage[];
  seenLedger: string[];
  wikimediaCategoryIndex: number;
  wikimediaCursors: Record<string, string>;
  updatedAt: number;
}

const PUBLIC_PASS_THRESHOLD = 70;
const PUBLIC_REJECT_THRESHOLD = 49;
const PUBLIC_CACHE_MAX = 50;
export const PUBLIC_CACHE_TARGET = 50;
const PUBLIC_FETCH_CAP = 180;
const CACHE_NEARBY_KM_THRESHOLD = 30;
const CACHE_NEARBY_YEAR_THRESHOLD = 5;

const ROUND_DIVERSITY_STAGES = [
  { label: 'strict_30y_1000km', minYearGap: 30, minDistanceKm: 1000 },
  { label: 'relaxed_20y_700km', minYearGap: 20, minDistanceKm: 700 },
  { label: 'relaxed_10y_400km', minYearGap: 10, minDistanceKm: 400 },
  { label: 'fallback_none', minYearGap: 0, minDistanceKm: 0 },
] as const;

const GEO_BUCKET_DEGREES = 1.5;
const DIVERSITY_YEAR_WEIGHT = 120;

/** Minimum year gap between consecutive rounds after alternation reordering */
const MIN_CONSECUTIVE_YEAR_GAP = 30;

/** Maximum images per era bucket in the public cache (prevents modern-era domination) */
const MAX_CACHE_PER_ERA = 12;

/** Soft band caps to avoid over-dominance by very old images. */
const MAX_CACHE_OLDER_BAND = 14;
const MAX_CACHE_NEWER_BAND = 20;

type EraBucket = 'pre_1950' | 'y1950_1979' | 'y1980_1999' | 'y2000_2014' | 'y2015_plus';
type AgeBand = 'older' | 'middle' | 'newer';

const CACHE_STORAGE_KEY = 'timeguesser.public.cache.v3';

const EMPTY_CACHE_STATE: CacheState = {
  images: [],
  seenLedger: [],
  wikimediaCategoryIndex: 0,
  wikimediaCursors: {},
  updatedAt: 0,
};

// Interleaved: each modern category is followed by a historical street-scene
// decade category so every refill cycle (5 rotations) hits a mix of both eras.
// Historical categories use "Street scenes in the XXXXs" which are curated
// geocoded street photography — much higher quality than generic decade cats.
const WIKIMEDIA_ROOT_CATEGORIES = [
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

const EXCLUSION_TERMS = [
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

const HISTORICAL_SIGNAL_TERMS = [
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

function shuffle<T>(values: T[]): T[] {
  return [...values].sort(() => Math.random() - 0.5);
}

function pickN<T>(values: T[], count: number): T[] {
  return shuffle(values).slice(0, count);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function geoBucket(lat: number, lng: number): string {
  const latBucket = Math.floor(lat / GEO_BUCKET_DEGREES);
  const lngBucket = Math.floor(lng / GEO_BUCKET_DEGREES);
  return `${latBucket}:${lngBucket}`;
}

function eraBucket(year: number): EraBucket {
  if (year < 1950) return 'pre_1950';
  if (year < 1980) return 'y1950_1979';
  if (year < 2000) return 'y1980_1999';
  if (year < 2015) return 'y2000_2014';
  return 'y2015_plus';
}

function ageBand(year: number): AgeBand {
  if (year < 1950) return 'older';
  if (year < 2000) return 'middle';
  return 'newer';
}

function parseYear(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const year = Math.round(value);
    return year >= 1800 && year <= new Date().getFullYear() ? year : null;
  }
  if (typeof value !== 'string') return null;

  const yearMatch = value.match(/(18|19|20)\d{2}/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[0], 10);
  return year >= 1800 && year <= new Date().getFullYear() ? year : null;
}

function parseLatLng(exif: Record<string, unknown>): { lat: number; lng: number } | null {
  const latRaw = exif.GPSLatitude ?? exif.latitude ?? exif.Latitude ?? exif.lat ?? exif.GPSLat;
  const lngRaw = exif.GPSLongitude ?? exif.longitude ?? exif.Longitude ?? exif.lng ?? exif.GPSLng;

  const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : null;
    }
    if (Array.isArray(value) && value.length > 0) {
      const n = Number(value[0]);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  let lat = toNumber(latRaw);
  let lng = toNumber(lngRaw);
  if (lat == null || lng == null) return null;

  const latRef = String(exif.GPSLatitudeRef ?? exif.latitudeRef ?? '').toUpperCase();
  const lngRef = String(exif.GPSLongitudeRef ?? exif.longitudeRef ?? '').toUpperCase();

  if (latRef === 'S') lat = -Math.abs(lat);
  if (lngRef === 'W') lng = -Math.abs(lng);

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function extractYear(exif: Record<string, unknown>): number | null {
  return (
    parseYear(exif.DateTimeOriginal) ??
    parseYear(exif.DateTimeDigitized) ??
    parseYear(exif.DateTime) ??
    parseYear(exif.CreateDate) ??
    parseYear(exif.ModifyDate)
  );
}

function normalizeAsset(
  asset: ImagePicker.ImagePickerAsset,
  index: number
): { round: RoundData | null; warning: string | null } {
  const exif = (asset.exif ?? {}) as Record<string, unknown>;
  const coords = parseLatLng(exif);
  const year = extractYear(exif);

  if (!coords || !year) {
    const missing = [!coords ? 'location metadata' : null, !year ? 'date metadata' : null]
      .filter(Boolean)
      .join(' and ');
    return {
      round: null,
      warning: `Photo ${index + 1} skipped (missing ${missing}).`,
    };
  }

  return {
    round: {
      id: `personal-${Date.now()}-${index}`,
      source: 'personal',
      location: coords,
      year,
      imageUri: asset.uri,
      label: 'Personal photo',
      locationLabel: 'Unknown location',
    },
    warning: null,
  };
}

function includesAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function seenKey(provider: string, providerImageId: string): string {
  return `${provider}:${providerImageId}`;
}

function cacheId(provider: string, providerImageId: string): string {
  return `public-${provider}-${providerImageId}`;
}

async function readCacheState(): Promise<CacheState> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return EMPTY_CACHE_STATE;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.images) || !Array.isArray(parsed?.seenLedger)) {
      return EMPTY_CACHE_STATE;
    }
    return {
      images: parsed.images,
      seenLedger: parsed.seenLedger,
      wikimediaCategoryIndex:
        typeof parsed.wikimediaCategoryIndex === 'number' ? parsed.wikimediaCategoryIndex : 0,
      wikimediaCursors:
        parsed.wikimediaCursors && typeof parsed.wikimediaCursors === 'object'
          ? parsed.wikimediaCursors
          : {},
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return EMPTY_CACHE_STATE;
  }
}

async function writeCacheState(state: CacheState): Promise<void> {
  await AsyncStorage.setItem(
    CACHE_STORAGE_KEY,
    JSON.stringify({ ...state, updatedAt: Date.now() })
  );
}

function validatePublicCandidate(
  candidate: PublicPhotoCandidate,
  filters: PublicSelectionFilters
): ValidationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (!candidate.imageUri || !candidate.location || !candidate.year) {
    return {
      score: 0,
      pass: false,
      hardFail: true,
      reasons: ['Missing required metadata.'],
      warnings,
    };
  }

  if (candidate.yearSource === 'upload_timestamp') {
    reasons.push('missing_trusted_year');
  }
  if (candidate.yearConfidence === 'low') {
    reasons.push('year_source_low_confidence');
  }
  if (candidate.contentYearHint && Math.abs(candidate.contentYearHint - candidate.year) > 20) {
    reasons.push('content_year_conflict');
  }
  if (candidate.locationConflictDetected) {
    reasons.push('content_location_conflict');
  }
  if (candidate.yearSource === 'upload_timestamp' && candidate.historicalContextSignal) {
    reasons.push('historical_upload_conflict');
  }

  score += 58;

  const contextText = `${candidate.title} ${candidate.description ?? ''}`.toLowerCase();
  const streetWords = ['street', 'road', 'avenue', 'square', 'plaza', 'market', 'city', 'urban'];
  const geoWords = ['sign', 'station', 'cathedral', 'bridge', 'tower', 'monument', 'district'];
  const temporalWords = ['vintage', 'historic', 'old', 'car', 'tram', 'bus', 'fashion'];
  const peopleWords = ['people', 'person', 'crowd', 'pedestrian', 'woman', 'man', 'children'];
  const rejectWords = ['macro', 'close-up', 'flower', 'bird', 'cat', 'dog', 'abstract'];

  const streetScene = includesAny(contextText, streetWords);
  const geoClues = includesAny(contextText, geoWords);
  const temporalClues = includesAny(contextText, temporalWords);
  const peopleContext = includesAny(contextText, peopleWords);
  const rejectedScene = includesAny(contextText, rejectWords);
  const indoorOnly = includesAny(contextText, ['indoor', 'interior', 'room', 'kitchen', 'bedroom']);

  if (streetScene) score += 25;
  if (geoClues) score += 18;
  if (temporalClues) score += 12;
  if (peopleContext) score += 10;

  if (!streetScene) warnings.push('Not clearly a street/public-place context.');
  if (!geoClues && !temporalClues) warnings.push('Insufficient location/time clues.');
  if (!peopleContext) warnings.push('No explicit people context detected.');

  if (filters.requireStreetScene && !streetScene)
    reasons.push('Street/public-place context required.');
  if (filters.requirePeopleContext && !peopleContext) reasons.push('People context required.');
  if (filters.requireGeoClues && !geoClues) reasons.push('Geographic clues required.');
  if (filters.requireTemporalClues && !temporalClues) reasons.push('Temporal clues required.');
  if (filters.rejectIndoorOnly && indoorOnly) reasons.push('Indoor-only scene rejected.');
  if (filters.rejectLowSignalObjects && rejectedScene)
    reasons.push('Low-signal object scene rejected.');
  if (filters.enforceGuessabilityThreshold && score < PUBLIC_PASS_THRESHOLD) {
    reasons.push(`Guessability below ${PUBLIC_PASS_THRESHOLD}.`);
  }

  if (score <= PUBLIC_REJECT_THRESHOLD) {
    return { score: Math.max(0, score), pass: false, hardFail: true, reasons, warnings };
  }

  if (
    reasons.includes('historical_upload_conflict') ||
    reasons.includes('content_year_conflict') ||
    reasons.includes('content_location_conflict') ||
    reasons.includes('missing_trusted_year') ||
    reasons.includes('year_source_low_confidence')
  ) {
    const isRelaxedContentInferredYearCandidate =
      candidate.yearSource === 'content_inferred' && candidate.yearConfidence === 'medium';
    if (isRelaxedContentInferredYearCandidate) {
      warnings.push('relaxed_content_inferred_year_validation');
      return {
        score: Math.max(0, Math.min(100, score)),
        pass: score >= PUBLIC_PASS_THRESHOLD && reasons.length === 0,
        hardFail: false,
        reasons,
        warnings,
      };
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      pass: false,
      hardFail: true,
      reasons,
      warnings,
    };
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    pass: score >= PUBLIC_PASS_THRESHOLD && reasons.length === 0,
    hardFail: false,
    reasons,
    warnings,
  };
}

function candidateToRound(candidate: CachedPublicImage): RoundData {
  const label =
    typeof candidate.displayTitle === 'string' && candidate.displayTitle.trim().length > 0
      ? candidate.displayTitle
      : sanitizeDisplayTitle(candidate.title);
  const locationLabel =
    typeof candidate.displayLocation === 'string' && candidate.displayLocation.trim().length > 0
      ? candidate.displayLocation
      : 'Unknown location';

  return {
    id: candidate.cacheId,
    source: 'public',
    location: candidate.location,
    year: candidate.year,
    imageUri: candidate.localUri,
    label,
    locationLabel,
  };
}

function sanitizeDisplayTitle(raw: string): string {
  if (!raw) return 'Wikimedia photo';

  let title = raw.trim();
  title = title.replace(/^file:/i, '');
  title = title.replace(/\.(jpe?g|png)$/i, '');
  title = title.replace(/[_]+/g, ' ');
  title = title.replace(/\(([^)]*\d[^)]*)\)$/g, '');
  title = title.replace(/\s{2,}/g, ' ').trim();

  if (title.length === 0) return 'Wikimedia photo';
  return title;
}

function inferLocationLabel(
  title: string,
  description: string | undefined,
  categories: any[]
): string {
  const categoryTitles = categories
    .map((category) => String(category?.title ?? '').replace(/^Category:/, ''))
    .filter((value) => value.length > 0);

  const text = `${title} ${description ?? ''} ${categoryTitles.join(' ')}`;

  const inMatch = text.match(/\bin\s+([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){0,3})\b/);
  if (inMatch && inMatch[1]) {
    return inMatch[1].trim();
  }

  const byCountry = categoryTitles.find((value) => /\bby country\b/i.test(value));
  if (byCountry) {
    return byCountry.replace(/\bby country\b/i, '').trim() || 'Unknown location';
  }

  const countryCategory = categoryTitles.find((value) => /\bcountry\b/i.test(value));
  if (countryCategory) {
    return countryCategory.trim();
  }

  return 'Unknown location';
}

function extractContentYearHint(text: string): number | null {
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

function extractYearWithProvenance(args: {
  ext: any;
  timestamp: unknown;
  title: string;
  description?: string;
  categoryText: string;
}): {
  year: number | null;
  yearSource: PublicPhotoCandidate['yearSource'];
  yearConfidence: PublicPhotoCandidate['yearConfidence'];
  contentYearHint: number | null;
  historicalContextSignal: boolean;
} {
  const captureDate = parseYear(args.ext?.DateTimeOriginal?.value);
  if (captureDate) {
    return {
      year: captureDate,
      yearSource: 'capture_exif',
      yearConfidence: 'high',
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
      yearSource: 'structured_metadata',
      yearConfidence: 'medium',
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
      yearSource: 'content_inferred',
      yearConfidence: 'medium',
      contentYearHint,
      historicalContextSignal,
    };
  }

  const uploadDate = parseYear(args.timestamp);
  if (uploadDate) {
    return {
      year: uploadDate,
      yearSource: 'upload_timestamp',
      yearConfidence: 'low',
      contentYearHint,
      historicalContextSignal,
    };
  }

  return {
    year: null,
    yearSource: 'upload_timestamp',
    yearConfidence: 'low',
    contentYearHint,
    historicalContextSignal,
  };
}

function detectLocationConflictFromText(
  text: string,
  point: { lat: number; lng: number }
): boolean {
  const haystack = text.toLowerCase();
  for (const [place, bbox] of Object.entries(PLACE_BBOXES)) {
    if (!haystack.includes(place)) continue;
    const inside =
      point.lat >= bbox.minLat &&
      point.lat <= bbox.maxLat &&
      point.lng >= bbox.minLng &&
      point.lng <= bbox.maxLng;
    if (!inside) {
      return true;
    }
  }
  return false;
}

function minYearGapForRounds(rounds: RoundData[]): number {
  if (rounds.length < 2) return 999;
  let minGap = Infinity;
  for (let i = 0; i < rounds.length; i += 1) {
    for (let j = i + 1; j < rounds.length; j += 1) {
      minGap = Math.min(minGap, Math.abs(rounds[i].year - rounds[j].year));
    }
  }
  return Number.isFinite(minGap) ? minGap : 0;
}

function minDistanceForRounds(rounds: RoundData[]): number {
  if (rounds.length < 2) return 99999;
  let minDistance = Infinity;
  for (let i = 0; i < rounds.length; i += 1) {
    for (let j = i + 1; j < rounds.length; j += 1) {
      minDistance = Math.min(minDistance, distanceKm(rounds[i].location, rounds[j].location));
    }
  }
  return Number.isFinite(minDistance) ? Math.round(minDistance) : 0;
}

function uniqueGeoBucketCount(rounds: RoundData[]): number {
  return new Set(rounds.map((round) => geoBucket(round.location.lat, round.location.lng))).size;
}

function uniqueEraBucketCount(rounds: RoundData[]): number {
  return new Set(rounds.map((round) => eraBucket(round.year))).size;
}

function ageBandCounts(rounds: RoundData[]): Record<AgeBand, number> {
  const counts: Record<AgeBand, number> = { older: 0, middle: 0, newer: 0 };
  for (const round of rounds) {
    counts[ageBand(round.year)] += 1;
  }
  return counts;
}

function maxAgeBandRun(rounds: RoundData[]): number {
  if (rounds.length === 0) return 0;
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < rounds.length; i++) {
    if (ageBand(rounds[i].year) === ageBand(rounds[i - 1].year)) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }
  return maxRun;
}

function meetsBandMixConstraints(
  selected: RoundData[],
  pool: RoundData[],
  targetCount: number
): boolean {
  if (targetCount < 5) return true;

  const selectedCounts = ageBandCounts(selected);
  const poolCounts = ageBandCounts(pool);

  const olderAvailable = poolCounts.older > 0;
  const middleAvailable = poolCounts.middle > 0;
  const newerAvailable = poolCounts.newer > 0;

  // If a band is available in pool, require at least one pick from it.
  if (olderAvailable && selectedCounts.older < 1) return false;
  if (middleAvailable && selectedCounts.middle < 1) return false;
  if (newerAvailable && selectedCounts.newer < 1) return false;

  // Keep games less predictable: avoid heavy very-old runs and over-clustering.
  if (selectedCounts.older > 2) return false;
  if (maxAgeBandRun(selected) > 2) return false;

  return true;
}

function isRoundCompatible(
  candidate: RoundData,
  selected: RoundData[],
  stage: { minYearGap: number; minDistanceKm: number }
): boolean {
  for (const round of selected) {
    const yearGap = Math.abs(candidate.year - round.year);
    const km = distanceKm(candidate.location, round.location);
    if (yearGap < stage.minYearGap || km < stage.minDistanceKm) {
      return false;
    }
  }
  return true;
}

function diversityScore(candidate: RoundData, selected: RoundData[]): number {
  if (selected.length === 0) return Math.random() * 100;

  let minYearGap = Infinity;
  let minDistanceGap = Infinity;
  const selectedBuckets = new Set(
    selected.map((round) => geoBucket(round.location.lat, round.location.lng))
  );
  for (const round of selected) {
    minYearGap = Math.min(minYearGap, Math.abs(candidate.year - round.year));
    minDistanceGap = Math.min(minDistanceGap, distanceKm(candidate.location, round.location));
  }
  const bucketBonus = selectedBuckets.has(geoBucket(candidate.location.lat, candidate.location.lng))
    ? 0
    : 500;
  return minDistanceGap + minYearGap * DIVERSITY_YEAR_WEIGHT + bucketBonus + Math.random() * 40;
}

function eraBalanceScore(candidate: RoundData, selected: RoundData[], targetCount: number): number {
  if (selected.length === 0) return 0;

  const minDistinctBuckets = targetCount >= 5 ? 3 : Math.min(2, targetCount);
  const maxDistinctBuckets = targetCount >= 5 ? 4 : Math.min(3, targetCount);

  const selectedEraCounts = new Map<EraBucket, number>();
  for (const round of selected) {
    const bucket = eraBucket(round.year);
    selectedEraCounts.set(bucket, (selectedEraCounts.get(bucket) ?? 0) + 1);
  }

  const candidateBucket = eraBucket(candidate.year);
  const distinctEraCount = selectedEraCounts.size;
  const hasBucketAlready = selectedEraCounts.has(candidateBucket);
  const thisBucketCount = selectedEraCounts.get(candidateBucket) ?? 0;

  let bonus = 0;
  if (!hasBucketAlready && distinctEraCount < minDistinctBuckets) {
    bonus += 2000;
  }
  if (hasBucketAlready && distinctEraCount < minDistinctBuckets) {
    bonus -= 1500;
  }
  if (!hasBucketAlready && distinctEraCount >= maxDistinctBuckets) {
    bonus -= 250;
  }
  bonus -= thisBucketCount * 350;

  return bonus;
}

function alternateRoundsByYear(rounds: RoundData[]): RoundData[] {
  if (rounds.length <= 2) return rounds;

  const sorted = [...rounds].sort((a, b) => a.year - b.year);
  const split = Math.ceil(sorted.length / 2);
  const older = sorted.slice(0, split);
  const newer = sorted.slice(split).reverse();

  const alternated: RoundData[] = [];
  while (older.length > 0 || newer.length > 0) {
    const old = older.shift();
    if (old) alternated.push(old);
    const modern = newer.shift();
    if (modern) alternated.push(modern);
  }

  return alternated.slice(0, rounds.length);
}

/**
 * Check that every pair of consecutive rounds in the sequence
 * has at least `minGap` years between them.
 */
function meetsConsecutiveYearGap(rounds: RoundData[], minGap: number): boolean {
  for (let i = 0; i < rounds.length - 1; i++) {
    if (Math.abs(rounds[i].year - rounds[i + 1].year) < minGap) {
      return false;
    }
  }
  return true;
}

/**
 * Try multiple orderings to find one that satisfies the consecutive year gap.
 * Returns the best ordering, or null if none satisfy the gap.
 */
function findBestConsecutiveOrdering(rounds: RoundData[], minGap: number): RoundData[] | null {
  // First try the default alternation
  const alternated = alternateRoundsByYear(rounds);
  if (meetsConsecutiveYearGap(alternated, minGap)) return alternated;

  // Try reverse alternation (newer first)
  const reversed = [...alternated].reverse();
  if (meetsConsecutiveYearGap(reversed, minGap)) return reversed;

  // Try sorting by year descending then interleaving differently
  const sorted = [...rounds].sort((a, b) => a.year - b.year);

  // Try zigzag: pick from extremes inward (oldest, newest, 2nd oldest, 2nd newest...)
  const zigzag: RoundData[] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    if (lo === hi) {
      zigzag.push(sorted[lo]);
    } else {
      zigzag.push(sorted[lo]);
      zigzag.push(sorted[hi]);
    }
    lo++;
    hi--;
  }
  if (meetsConsecutiveYearGap(zigzag, minGap)) return zigzag;

  // Try reverse zigzag
  const revZigzag = [...zigzag].reverse();
  if (meetsConsecutiveYearGap(revZigzag, minGap)) return revZigzag;

  // Brute force for small sets (5 rounds = 120 permutations max)
  if (rounds.length <= 6) {
    const perms = permutations(rounds);
    for (const perm of perms) {
      if (meetsConsecutiveYearGap(perm, minGap)) return perm;
    }
  }

  return null;
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

function selectRoundsWithStage(
  candidates: RoundData[],
  count: number,
  stage: { minYearGap: number; minDistanceKm: number }
): RoundData[] {
  const pool = shuffle(candidates);
  const selected: RoundData[] = [];

  while (selected.length < count && pool.length > 0) {
    const eligible =
      selected.length === 0
        ? [...pool]
        : pool.filter((candidate) => isRoundCompatible(candidate, selected, stage));
    if (eligible.length === 0) break;

    const best = [...eligible].sort(
      (a, b) =>
        diversityScore(b, selected) +
        eraBalanceScore(b, selected, count) -
        (diversityScore(a, selected) + eraBalanceScore(a, selected, count))
    )[0];
    selected.push(best);

    const idx = pool.findIndex((candidate) => candidate.id === best.id);
    if (idx >= 0) pool.splice(idx, 1);
  }

  return selected;
}

function selectDiverseRounds(
  candidates: RoundData[],
  count: number
): { selected: RoundData[]; stageLabel: string } {
  if (candidates.length === 0) return { selected: [], stageLabel: 'none' };

  for (const stage of ROUND_DIVERSITY_STAGES) {
    const selected = selectRoundsWithStage(candidates, count, stage);
    if (selected.length >= count) {
      const trimmed = selected.slice(0, count);
      // Try to find an ordering that meets the consecutive year gap target
      const ordered = findBestConsecutiveOrdering(trimmed, MIN_CONSECUTIVE_YEAR_GAP);
      if (ordered && meetsBandMixConstraints(ordered, candidates, count)) {
        return { selected: ordered, stageLabel: stage.label };
      }
      // If no ordering satisfies the gap, still return with default alternation
      // but continue to next stage to see if a different selection works better
    }
  }

  // Second pass: accept whatever the strictest feasible stage gives us
  for (const stage of ROUND_DIVERSITY_STAGES) {
    const selected = selectRoundsWithStage(candidates, count, stage);
    if (selected.length >= count) {
      const alternated = alternateRoundsByYear(selected.slice(0, count));
      if (!meetsBandMixConstraints(alternated, candidates, count)) {
        continue;
      }
      return {
        selected: alternated,
        stageLabel: `${stage.label}_no_consecutive_gap`,
      };
    }
  }

  return {
    selected: alternateRoundsByYear(pickN(candidates, count)),
    stageLabel: 'fallback_random',
  };
}

function isNearDuplicate(candidate: PublicPhotoCandidate, existing: CachedPublicImage): boolean {
  const km = distanceKm(candidate.location, existing.location);
  const yearGap = Math.abs(candidate.year - existing.year);
  return km <= CACHE_NEARBY_KM_THRESHOLD && yearGap <= CACHE_NEARBY_YEAR_THRESHOLD;
}

async function downloadToLocal(uri: string, id: string): Promise<string | null> {
  try {
    const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!base) return null;
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${base}timeguesser-public-${safe}.jpg`;
    const res = await FileSystem.downloadAsync(uri, path);
    return res.uri;
  } catch {
    return null;
  }
}

interface WikimediaFetchResult {
  candidates: PublicPhotoCandidate[];
  rejectedByReason: Record<string, number>;
  nextCursor: string;
  category: string;
}

function asWikiCategoriesText(categories: any[]): string {
  return categories
    .map((category) => String(category?.title ?? ''))
    .join(' ')
    .toLowerCase();
}

function containsExclusionTerm(text: string): boolean {
  return EXCLUSION_TERMS.some((term) => text.includes(term));
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

function hasAllowedMime(mime: string): boolean {
  return mime === 'image/jpeg' || mime === 'image/png';
}

function hasAllowedLicense(ext: any): boolean {
  const licenseShort = String(ext?.LicenseShortName?.value ?? '').toLowerCase();
  const usageTerms = String(ext?.UsageTerms?.value ?? '').toLowerCase();
  const licenseText = `${licenseShort} ${usageTerms}`;
  return (
    licenseText.includes('creative commons') ||
    licenseText.includes('cc-by') ||
    licenseText.includes('public domain') ||
    licenseText.includes('cc0')
  );
}

async function fetchWikimediaFileMembers(
  category: string,
  cursor: string,
  limit = 40
): Promise<{ titles: string[]; nextCursor: string }> {
  const continueParam = cursor ? `&cmcontinue=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=categorymembers&cmtitle=${encodeURIComponent(
      category
    )}&cmtype=file&cmlimit=${Math.min(50, Math.max(10, limit))}${continueParam}`
  );
  if (!response.ok) return { titles: [], nextCursor: '' };
  const data = await response.json();
  const members = Array.isArray(data?.query?.categorymembers) ? data.query.categorymembers : [];
  return {
    titles: members
      .map((member: any) => member?.title)
      .filter(
        (title: unknown): title is string => typeof title === 'string' && title.startsWith('File:')
      ),
    nextCursor: String(data?.continue?.cmcontinue ?? ''),
  };
}

async function fetchWikimediaSubcategoryMembers(category: string, limit = 8): Promise<string[]> {
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=categorymembers&cmtitle=${encodeURIComponent(
      category
    )}&cmtype=subcat&cmlimit=${Math.min(20, Math.max(5, limit))}`
  );
  if (!response.ok) return [];
  const data = await response.json();
  const members = Array.isArray(data?.query?.categorymembers) ? data.query.categorymembers : [];
  return members
    .map((member: any) => member?.title)
    .filter(
      (title: unknown): title is string =>
        typeof title === 'string' && title.startsWith('Category:')
    );
}

async function fetchWikimediaImageInfoByTitles(
  titles: string[]
): Promise<CandidateExtractionResult> {
  if (titles.length === 0) return { candidates: [], rejectedByReason: {} };

  const chunks: string[][] = [];
  for (let i = 0; i < titles.length; i += 25) {
    chunks.push(titles.slice(i, i + 25));
  }

  const candidates: PublicPhotoCandidate[] = [];
  const rejectedByReason: Record<string, number> = {};

  for (const chunk of chunks) {
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

    const response = await fetch('https://commons.wikimedia.org/w/api.php', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
    });
    if (!response.ok) continue;
    const data = await response.json();
    const pages = Object.values(data?.query?.pages ?? {}) as any[];

    pages.forEach((page) => {
      const info = page?.imageinfo?.[0];
      if (!info?.url) return;
      const ext = info?.extmetadata ?? {};

      const lat = parseFloat(String(ext?.GPSLatitude?.value ?? ''));
      const lng = parseFloat(String(ext?.GPSLongitude?.value ?? ''));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const width = Number(info?.width ?? 0);
      const height = Number(info?.height ?? 0);
      const longestEdge = Math.max(width, height);
      if (!Number.isFinite(longestEdge) || longestEdge < 1024) return;

      const mime = String(info?.mime ?? '').toLowerCase();
      if (!hasAllowedMime(mime)) return;

      if (!hasAllowedLicense(ext)) return;

      const title = String(page?.title ?? 'Wikimedia image').replace(/^File:/, '');
      const description =
        typeof ext?.ImageDescription?.value === 'string' ? ext.ImageDescription.value : undefined;

      const categories = Array.isArray(page?.categories) ? page.categories : [];
      const pageCategoryText = asWikiCategoriesText(categories);
      const extCategoryText = String(ext?.Categories?.value ?? '').toLowerCase();
      const categoryText = `${pageCategoryText} ${extCategoryText}`.trim();
      const haystack = `${title.toLowerCase()} ${String(description ?? '').toLowerCase()} ${categoryText}`;
      if (containsExclusionTerm(haystack)) return;

      if (containsArtworkMedium(haystack)) {
        rejectedByReason.rejected_artwork_medium =
          (rejectedByReason.rejected_artwork_medium ?? 0) + 1;
        return;
      }

      if (isHistoricalDecadeStreetCategory(categoryText) && !hasPhotoSignal(haystack)) {
        rejectedByReason.rejected_non_photo_historical_media =
          (rejectedByReason.rejected_non_photo_historical_media ?? 0) + 1;
        return;
      }

      const yearMeta = extractYearWithProvenance({
        ext,
        timestamp: info?.timestamp,
        title,
        description,
        categoryText,
      });
      if (!yearMeta.year) return;

      const locationConflictDetected = detectLocationConflictFromText(haystack, { lat, lng });

      candidates.push({
        provider: 'wikimedia',
        providerImageId: String(page.pageid),
        imageUri: info.url,
        location: { lat, lng },
        locationSource: 'gps_exif',
        locationConfidence: 'high',
        year: yearMeta.year,
        yearSource: yearMeta.yearSource,
        yearConfidence: yearMeta.yearConfidence,
        title,
        description,
        categories,
        contentYearHint: yearMeta.contentYearHint ?? undefined,
        historicalContextSignal: yearMeta.historicalContextSignal,
        locationConflictDetected,
      });
    });
  }

  return { candidates, rejectedByReason };
}

function nextCategoryIndex(current: number): number {
  if (WIKIMEDIA_ROOT_CATEGORIES.length === 0) return 0;
  return (current + 1) % WIKIMEDIA_ROOT_CATEGORIES.length;
}

async function fetchWikimediaCandidatesFromCategory(
  category: string,
  cursor: string,
  limit = 80
): Promise<WikimediaFetchResult> {
  const direct = await fetchWikimediaFileMembers(category, cursor, Math.ceil(limit * 0.6));
  const subcategories = await fetchWikimediaSubcategoryMembers(category, 10);

  const subcategoryTitles: string[] = [];
  for (const subcategory of pickN(subcategories, Math.min(4, subcategories.length))) {
    const files = await fetchWikimediaFileMembers(subcategory, '', 12);
    subcategoryTitles.push(...files.titles);
  }

  const uniqueTitles = Array.from(new Set([...direct.titles, ...subcategoryTitles]));
  const extraction = await fetchWikimediaImageInfoByTitles(uniqueTitles.slice(0, limit * 2));

  return {
    candidates: shuffle(extraction.candidates).slice(0, limit),
    rejectedByReason: extraction.rejectedByReason,
    nextCursor: direct.nextCursor,
    category,
  };
}

function providersForSource(source: PublicImageSource): PublicProvider[] {
  if (source === 'wikimedia') return ['wikimedia'];
  return ['test'];
}

async function cleanupSeenAssets(state: CacheState): Promise<CacheState> {
  const seen = new Set(state.seenLedger);
  const kept: CachedPublicImage[] = [];

  for (const image of state.images) {
    const key = seenKey(image.provider, image.providerImageId);
    if (seen.has(key)) {
      try {
        await FileSystem.deleteAsync(image.localUri, { idempotent: true });
      } catch {
        // Ignore file cleanup errors.
      }
      continue;
    }
    kept.push(image);
  }

  return { ...state, images: kept };
}

async function refillPublicCache(
  state: CacheState,
  publicImageSource: PublicImageSource,
  filters: PublicSelectionFilters,
  diagnosticsEnabled: boolean
): Promise<CacheState> {
  if (publicImageSource === 'test') {
    return state;
  }

  const seen = new Set(state.seenLedger);
  const existing = new Set(state.images.map((img) => seenKey(img.provider, img.providerImageId)));
  const providers = providersForSource(publicImageSource);
  let fetchedCandidates = 0;
  let metadataPass = 0;
  let strictPass = 0;
  let skippedAsSeen = 0;
  let downloaded = 0;
  const rejectedByReason: Record<string, number> = {};
  const acceptedByConfidence = { high: 0, medium: 0, low: 0 };
  let wikimediaCategoryIndex = state.wikimediaCategoryIndex;
  const wikimediaCursors = { ...state.wikimediaCursors };
  const usedCategories: string[] = [];

  const nextImages = [...state.images];
  for (const provider of providers) {
    if (nextImages.length >= PUBLIC_CACHE_TARGET) break;

    let candidates: PublicPhotoCandidate[] = [];
    if (provider === 'wikimedia') {
      for (
        let rotation = 0;
        rotation < 5 && nextImages.length < PUBLIC_CACHE_TARGET;
        rotation += 1
      ) {
        const category = WIKIMEDIA_ROOT_CATEGORIES[wikimediaCategoryIndex];
        const cursor = wikimediaCursors[category] ?? '';
        const fetched = await fetchWikimediaCandidatesFromCategory(
          category,
          cursor,
          Math.min(PUBLIC_FETCH_CAP, Math.max(90, PUBLIC_CACHE_TARGET * 2))
        );

        usedCategories.push(fetched.category);
        for (const [reason, count] of Object.entries(fetched.rejectedByReason)) {
          rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + count;
        }
        wikimediaCursors[fetched.category] = fetched.nextCursor;
        wikimediaCategoryIndex = nextCategoryIndex(wikimediaCategoryIndex);
        candidates.push(...fetched.candidates);
      }
    }

    fetchedCandidates += candidates.length;

    for (const candidate of candidates) {
      if (nextImages.length >= PUBLIC_CACHE_TARGET) break;
      metadataPass += 1;

      const key = seenKey(candidate.provider, candidate.providerImageId);
      if (seen.has(key) || existing.has(key)) {
        skippedAsSeen += 1;
        continue;
      }

      const nearDuplicate = nextImages.some((cached) => isNearDuplicate(candidate, cached));
      if (nearDuplicate) {
        continue;
      }

      // Era quota: prevent any single era bucket from dominating the cache
      const candidateEra = eraBucket(candidate.year);
      const eraCount = nextImages.filter((img) => eraBucket(img.year) === candidateEra).length;
      if (eraCount >= MAX_CACHE_PER_ERA) {
        continue;
      }

      // Band caps: keep old/new from crowding out middle decades.
      const candidateBand = ageBand(candidate.year);
      const bandCounts = ageBandCounts(nextImages.map(candidateToRound));
      if (candidateBand === 'older' && bandCounts.older >= MAX_CACHE_OLDER_BAND) {
        continue;
      }
      if (candidateBand === 'newer' && bandCounts.newer >= MAX_CACHE_NEWER_BAND) {
        continue;
      }

      const validation = validatePublicCandidate(candidate, filters);
      if (validation.hardFail) {
        for (const reason of validation.reasons) {
          rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
        }
        continue;
      }
      if (validation.pass) strictPass += 1;
      if (filters.enforceGuessabilityThreshold && !validation.pass) continue;

      const cid = cacheId(candidate.provider, candidate.providerImageId);
      const localUri = await downloadToLocal(candidate.imageUri, cid);
      if (!localUri) continue;

      downloaded += 1;
      acceptedByConfidence[candidate.yearConfidence] += 1;
      existing.add(key);
      const displayTitle = sanitizeDisplayTitle(candidate.title);
      const displayLocation = inferLocationLabel(
        displayTitle,
        candidate.description,
        candidate.categories ?? []
      );
      nextImages.push({
        cacheId: cid,
        provider: candidate.provider,
        providerImageId: candidate.providerImageId,
        remoteUri: candidate.imageUri,
        localUri,
        location: candidate.location,
        year: candidate.year,
        title: candidate.title,
        displayTitle,
        displayLocation,
        description: candidate.description,
        fetchedAt: Date.now(),
      });
    }
  }

  const trimmed = nextImages
    .sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0))
    .slice(0, PUBLIC_CACHE_MAX);

  if (__DEV__ && diagnosticsEnabled) {
    const eraDistribution: Record<string, number> = {};
    const bandDistribution: Record<AgeBand, number> = { older: 0, middle: 0, newer: 0 };
    for (const img of trimmed) {
      const era = eraBucket(img.year);
      eraDistribution[era] = (eraDistribution[era] ?? 0) + 1;
      bandDistribution[ageBand(img.year)] += 1;
    }

    console.info('[photos] cache refill diagnostics', {
      publicImageSource,
      fetchedCandidates,
      metadataPass,
      strictPass,
      skippedAsSeen,
      downloaded,
      acceptedByConfidence,
      rejectedByReason,
      cacheSize: trimmed.length,
      eraDistribution,
      bandDistribution,
      wikimediaCategoryIndex,
      usedCategories,
    });
  }

  return {
    ...state,
    images: trimmed,
    wikimediaCategoryIndex,
    wikimediaCursors,
  };
}

async function ensureCacheReady(
  publicImageSource: PublicImageSource,
  filters: PublicSelectionFilters,
  diagnosticsEnabled: boolean,
  minUnseen = 1
): Promise<CacheState> {
  let state = await readCacheState();
  state = await cleanupSeenAssets(state);
  let attempts = 0;
  while (attempts < 4) {
    const unseenCount = state.images.length;
    if (
      unseenCount >= minUnseen &&
      state.images.length >= Math.min(PUBLIC_CACHE_TARGET, minUnseen)
    ) {
      break;
    }
    if (state.images.length >= PUBLIC_CACHE_TARGET) {
      break;
    }

    const beforeCount = state.images.length;
    const beforeCursorSnapshot = JSON.stringify(state.wikimediaCursors);
    const beforeCategoryIndex = state.wikimediaCategoryIndex;
    state = await refillPublicCache(state, publicImageSource, filters, diagnosticsEnabled);
    attempts += 1;

    const noProgress =
      state.images.length === beforeCount &&
      JSON.stringify(state.wikimediaCursors) === beforeCursorSnapshot &&
      state.wikimediaCategoryIndex === beforeCategoryIndex;
    if (noProgress) {
      break;
    }
  }
  await writeCacheState(state);
  return state;
}

async function markPublicRoundsSeen(rounds: RoundData[]): Promise<void> {
  const state = await readCacheState();
  const seen = new Set(state.seenLedger);
  const updatedImages = state.images.map((image) => {
    const selected = rounds.find((round) => round.id === image.cacheId);
    if (!selected) return image;

    seen.add(seenKey(image.provider, image.providerImageId));
    return { ...image, lastUsedAt: Date.now() };
  });

  await writeCacheState({ ...state, images: updatedImages, seenLedger: [...seen] });
}

export async function markPublicRoundSeen(round: RoundData): Promise<void> {
  if (round.source !== 'public') return;
  await markPublicRoundsSeen([round]);
}

async function getPublicRoundsFromCache(
  count: number,
  publicImageSource: PublicImageSource,
  filters: PublicSelectionFilters,
  diagnosticsEnabled: boolean,
  markSeen = false
): Promise<RoundData[]> {
  const state = await ensureCacheReady(publicImageSource, filters, diagnosticsEnabled, count);
  const seen = new Set(state.seenLedger);

  const unseenRounds = state.images
    .filter((img) => !seen.has(seenKey(img.provider, img.providerImageId)))
    .map(candidateToRound);

  if (unseenRounds.length >= count) {
    const { selected, stageLabel } = selectDiverseRounds(unseenRounds, count);
    const selectedYears = selected.map((round) => round.year).sort((a, b) => a - b);

    if (__DEV__ && diagnosticsEnabled) {
      console.info('[photos] round diversity diagnostics', {
        selectedYears,
        minYearGapAchieved: minYearGapForRounds(selected),
        minPairwiseDistanceKmAchieved: minDistanceForRounds(selected),
        geoBucketCount: uniqueGeoBucketCount(selected),
        eraBucketCount: uniqueEraBucketCount(selected),
        bandDistribution: ageBandCounts(selected),
        maxSameBandRun: maxAgeBandRun(selected),
        relaxationStageUsed: stageLabel,
      });
    }

    if (markSeen) {
      await markPublicRoundsSeen(selected);
    }
    return selected;
  }

  if (__DEV__) {
    console.info('[photos] insufficient unseen cached images', {
      requested: count,
      unseen: unseenRounds.length,
      source: publicImageSource,
    });
  }

  const fallback = pickN(TEST_ROUNDS, count);
  return fallback;
}

export async function initializePublicImageCache(options: {
  publicImageSource: PublicImageSource;
  publicSelectionFilters: PublicSelectionFilters;
  diagnosticsEnabled?: boolean;
}): Promise<void> {
  const diagnosticsEnabled = options.diagnosticsEnabled ?? false;
  await ensureCacheReady(
    options.publicImageSource,
    options.publicSelectionFilters,
    diagnosticsEnabled
  );
}

export async function clearPublicImageCache(): Promise<ClearPublicCacheSummary> {
  const state = await readCacheState();

  for (const image of state.images) {
    try {
      await FileSystem.deleteAsync(image.localUri, { idempotent: true });
    } catch {
      // Ignore file cleanup errors; cache keys are still cleared below.
    }
  }

  await AsyncStorage.multiRemove([
    CACHE_STORAGE_KEY,
    'timeguesser.public.cache.v2',
    'timeguesser.public.cache.v1',
  ]);

  return {
    removedImages: state.images.length,
    removedSeenEntries: state.seenLedger.length,
  };
}

export async function getPublicCacheSummary(): Promise<PublicCacheSummary> {
  let state = await readCacheState();
  state = await cleanupSeenAssets(state);
  await writeCacheState(state);

  const seen = new Set(state.seenLedger);
  const unseenImagesAvailable = state.images.filter(
    (img) => !seen.has(seenKey(img.provider, img.providerImageId))
  ).length;

  return {
    imagesInCache: state.images.length,
    seenImagesRecorded: state.seenLedger.length,
    unseenImagesAvailable,
    lastUpdatedAt: state.updatedAt > 0 ? state.updatedAt : null,
  };
}

export async function fillPublicImageCacheToTarget(options: {
  publicImageSource: PublicImageSource;
  publicSelectionFilters: PublicSelectionFilters;
  diagnosticsEnabled?: boolean;
  targetUnseen?: number;
}): Promise<FillPublicCacheSummary> {
  const targetUnseen = options.targetUnseen ?? PUBLIC_CACHE_TARGET;
  const diagnosticsEnabled = options.diagnosticsEnabled ?? false;

  let state = await ensureCacheReady(
    options.publicImageSource,
    options.publicSelectionFilters,
    diagnosticsEnabled,
    targetUnseen
  );

  state = await cleanupSeenAssets(state);
  await writeCacheState(state);

  const seen = new Set(state.seenLedger);
  const unseenImagesAvailable = state.images.filter(
    (img) => !seen.has(seenKey(img.provider, img.providerImageId))
  ).length;

  return {
    imagesInCache: state.images.length,
    seenImagesRecorded: state.seenLedger.length,
    unseenImagesAvailable,
    lastUpdatedAt: state.updatedAt > 0 ? state.updatedAt : null,
    targetUnseen,
    targetReached: unseenImagesAvailable >= targetUnseen,
  };
}

export async function importPersonalPhotosFromLibrary(): Promise<PersonalImportSummary> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      rounds: [],
      warnings: ['Photo import cancelled: media library permission was not granted.'],
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: true,
    allowsMultipleSelection: true,
    selectionLimit: 30,
  });

  if (result.canceled) return { rounds: [], warnings: [] };

  const warnings: string[] = [];
  const rounds: RoundData[] = [];

  result.assets.forEach((asset, index) => {
    const normalized = normalizeAsset(asset, index);
    if (normalized.round) rounds.push(normalized.round);
    if (normalized.warning) warnings.push(normalized.warning);
  });

  return { rounds, warnings };
}

export async function buildRoundsForGame({
  source,
  personalRounds,
  publicImageSource,
  publicSelectionFilters,
  diagnosticsEnabled = false,
  roundsPerGame = ROUNDS_PER_GAME,
}: BuildRoundsArgs): Promise<RoundData[]> {
  const publicRounds = await getPublicRoundsFromCache(
    roundsPerGame,
    publicImageSource,
    publicSelectionFilters,
    diagnosticsEnabled
  );

  if (source === 'public') {
    return publicRounds;
  }

  if (source === 'personal') {
    if (personalRounds.length >= roundsPerGame) {
      return pickN(personalRounds, roundsPerGame);
    }
    return shuffle([
      ...personalRounds,
      ...pickN(publicRounds, roundsPerGame - personalRounds.length),
    ]).slice(0, roundsPerGame);
  }

  const mixedPool = [...personalRounds, ...publicRounds];
  if (mixedPool.length >= roundsPerGame) {
    return pickN(mixedPool, roundsPerGame);
  }
  return [...mixedPool, ...pickN(publicRounds, roundsPerGame - mixedPool.length)].slice(
    0,
    roundsPerGame
  );
}

export async function getReplacementPublicRound({
  currentRound,
  usedRoundIds,
  publicImageSource,
  publicSelectionFilters,
  diagnosticsEnabled = false,
}: ReplacementArgs): Promise<RoundData | null> {
  if (currentRound.source !== 'public') return null;

  const candidates = await getPublicRoundsFromCache(
    8,
    publicImageSource,
    publicSelectionFilters,
    diagnosticsEnabled,
    false
  );
  const eligible = candidates.filter(
    (candidate) => candidate.id !== currentRound.id && !usedRoundIds.includes(candidate.id)
  );
  const fallbackEligible = candidates.filter((candidate) => candidate.id !== currentRound.id);

  const ranked = (eligible.length > 0 ? eligible : fallbackEligible)
    .map((candidate) => ({
      candidate,
      score:
        distanceKm(candidate.location, currentRound.location) +
        Math.abs(candidate.year - currentRound.year) * 25 +
        Math.random() * 20,
    }))
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0]?.candidate ?? null;
  return selected;
}
