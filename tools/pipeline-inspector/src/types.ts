export type Provider = 'wikimedia' | 'loc' | 'europeana';
export type PhotoLicense = 'cc0' | 'public_domain' | 'cc_by' | 'cc_by_sa';
export type EraBucket = 'pre_1950' | 'y1950_1979' | 'y1980_1999' | 'y2000_2014' | 'y2015_plus';

export interface NormalizedCandidate {
  provider: Provider;
  providerImageId: string;
  imageUri: string;
  thumbnailUri?: string;
  location: { lat: number; lng: number };
  locationSource: 'gps_exif' | 'structured_metadata' | 'content_inferred';
  locationConfidence: 'high' | 'medium' | 'low';
  year: number;
  yearSource: 'capture_exif' | 'structured_metadata' | 'content_inferred' | 'upload_timestamp';
  yearConfidence: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  tags?: string[];
  license: PhotoLicense;
  author?: string;
  institutionName?: string;
  originalUrl?: string;
  contentYearHint?: number;
  historicalContextSignal?: boolean;
  locationConflictDetected?: boolean;
}

// ─── Unified scoring ─────────────────────────────────────────────────────────

export interface UnifiedScore {
  /** 0-100 combined score */
  overall: number;
  /** Whether overall >= threshold and no hard fail */
  pass: boolean;
  /** Data quality gate failure */
  hardFail: boolean;
  /** 0-100 CLIP vision component */
  visionScore: number;
  /** 0-100 LLM metadata component (-1 if unavailable) */
  metadataScore: number;
  /** CLIP sub-dimension scores */
  visionDetail: {
    streetScene: number;
    eraClues: number;
    outdoor: number;
    quality: number;
    isArtwork: number;
  };
  /** Raw CLIP prompt scores */
  visionPromptScores: Record<string, number>;
  /** LLM reasoning text */
  llmReasoning: string;
  /** Hard fail reasons */
  hardFailReasons: string[];
  /** Non-blocking warnings */
  warnings: string[];
}

export interface ScoredCandidate {
  candidate: NormalizedCandidate;
  /** Unified score — populated after "Score All" is clicked */
  unifiedScore?: UnifiedScore;
}

export interface FetchResponse {
  candidates: ScoredCandidate[];
  rejectedAtExtraction: Record<string, number>;
  stats: {
    total: number;
    hardFailed: number;
  };
}
