/**
 * Unified scoring — combines CLIP vision + LLM metadata + hard fail gates.
 *
 * Single source of truth for candidate scoring. Runs CLIP and LLM in parallel
 * for each candidate, then combines into one 0-100 score.
 */

import type { NormalizedCandidate } from './src/types.js';
import { scoreImage, type VisionScore } from './vision.js';
import { scoreMetadata, isLLMConfigured, type MetadataScore } from './llm.js';

// ─── Constants ───────────────────────────────────────────────────────────────

export const UNIFIED_PASS_THRESHOLD = 55;

const VISION_WEIGHT = 0.55;
const LLM_WEIGHT = 0.45;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UnifiedScore {
  /** 0-100 combined score */
  overall: number;
  /** Whether overall >= threshold and no hard fail */
  pass: boolean;
  /** Data quality gate failure (missing data, conflicts) */
  hardFail: boolean;
  /** 0-100 CLIP vision component */
  visionScore: number;
  /** 0-100 LLM metadata component (-1 if LLM unavailable) */
  metadataScore: number;
  /** CLIP sub-dimension scores */
  visionDetail: {
    streetScene: number;
    eraClues: number;
    outdoor: number;
    quality: number;
    isArtwork: number;
  };
  /** Raw CLIP prompt scores for debugging */
  visionPromptScores: Record<string, number>;
  /** LLM's reasoning text */
  llmReasoning: string;
  /** Hard fail reasons (data quality gates) */
  hardFailReasons: string[];
  /** Non-blocking warnings */
  warnings: string[];
}

// ─── Hard fail checks (data quality gates) ───────────────────────────────────

function checkHardFails(c: NormalizedCandidate): {
  hardFail: boolean;
  reasons: string[];
  warnings: string[];
} {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!c.imageUri || !c.location || !c.year) {
    reasons.push('Missing required metadata (image, location, or year).');
    return { hardFail: true, reasons, warnings };
  }

  if (c.yearSource === 'upload_timestamp' && c.historicalContextSignal) {
    reasons.push('Historical content with upload timestamp — year unreliable.');
  }

  if (c.contentYearHint && Math.abs(c.contentYearHint - c.year) > 20) {
    reasons.push(
      `Content year conflict: content hints ${c.contentYearHint}, metadata says ${c.year}.`
    );
  }

  if (c.locationConflictDetected) {
    reasons.push('Location conflict detected between metadata sources.');
  }

  if (c.yearSource === 'upload_timestamp') {
    warnings.push('Year from upload timestamp — may not reflect actual photo date.');
  }

  if (c.yearConfidence === 'low') {
    warnings.push('Low year confidence.');
  }

  // Allow relaxed pass for content-inferred years with medium confidence
  if (reasons.length > 0) {
    const isRelaxed = c.yearSource === 'content_inferred' && c.yearConfidence === 'medium';
    if (isRelaxed) {
      warnings.push('Relaxed validation for content-inferred year.');
      return { hardFail: false, reasons: [], warnings };
    }
  }

  return { hardFail: reasons.length > 0, reasons, warnings };
}

// ─── Unified scoring ─────────────────────────────────────────────────────────

/**
 * Score a candidate using both CLIP vision and LLM metadata analysis.
 * Runs both in parallel for speed.
 *
 * @param candidate - The normalized candidate to score
 * @param imageUrl - URL to use for CLIP analysis (typically thumbnailUri)
 */
export async function scoreCandidate(
  candidate: NormalizedCandidate,
  imageUrl: string
): Promise<UnifiedScore> {
  // Check hard fails first (instant, no API calls)
  const { hardFail, reasons, warnings } = checkHardFails(candidate);

  if (hardFail) {
    return {
      overall: 0,
      pass: false,
      hardFail: true,
      visionScore: 0,
      metadataScore: 0,
      visionDetail: { streetScene: 0, eraClues: 0, outdoor: 0, quality: 0, isArtwork: 0 },
      visionPromptScores: {},
      llmReasoning: '',
      hardFailReasons: reasons,
      warnings,
    };
  }

  // Run CLIP and LLM in parallel
  const llmConfigured = isLLMConfigured();

  console.log(`[scoring] Starting CLIP + LLM for ${candidate.providerImageId}`);
  console.log(`[scoring]   imageUrl: ${imageUrl.slice(0, 80)}`);
  console.log(`[scoring]   LLM configured: ${llmConfigured}`);

  const clipPromise = scoreImage(imageUrl).then((r) => {
    console.log('[scoring]   CLIP done');
    return r;
  });
  const llmPromise = llmConfigured
    ? scoreMetadata(candidate).then((r) => {
        console.log('[scoring]   LLM done');
        return r;
      })
    : Promise.resolve({
        score: -1,
        reasoning: 'LLM not configured (no OPENCODE_API_KEY).',
      } as MetadataScore);

  const [visionResult, llmResult] = await Promise.allSettled([clipPromise, llmPromise]);
  console.log(`[scoring] Both settled. Vision: ${visionResult.status}, LLM: ${llmResult.status}`);

  // Extract results with fallbacks
  let vision: VisionScore;
  if (visionResult.status === 'fulfilled') {
    vision = visionResult.value;
  } else {
    warnings.push(`CLIP failed: ${visionResult.reason}`);
    vision = {
      overall: 50,
      streetScene: 0,
      eraClues: 0,
      outdoor: 0,
      quality: 0.5,
      isArtwork: 0,
      promptScores: {},
    };
  }

  let llm: MetadataScore;
  if (llmResult.status === 'fulfilled') {
    llm = llmResult.value;
  } else {
    warnings.push(`LLM failed: ${llmResult.reason}`);
    llm = { score: -1, reasoning: `LLM error: ${llmResult.reason}` };
  }

  // Combine scores
  let overall: number;
  if (llm.score >= 0) {
    // Both available — weighted average
    overall = Math.round(vision.overall * VISION_WEIGHT + llm.score * LLM_WEIGHT);
  } else {
    // LLM unavailable — vision only
    overall = vision.overall;
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    pass: overall >= UNIFIED_PASS_THRESHOLD && !hardFail,
    hardFail: false,
    visionScore: vision.overall,
    metadataScore: llm.score,
    visionDetail: {
      streetScene: vision.streetScene,
      eraClues: vision.eraClues,
      outdoor: vision.outdoor,
      quality: vision.quality,
      isArtwork: vision.isArtwork,
    },
    visionPromptScores: vision.promptScores,
    llmReasoning: llm.reasoning,
    hardFailReasons: reasons,
    warnings,
  };
}
