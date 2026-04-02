/**
 * Vision-based image scoring using CLIP embeddings.
 *
 * Uses @xenova/transformers (ONNX Runtime) to run CLIP locally — no API keys,
 * no external services. Scores each image against text prompts that describe
 * desirable and undesirable qualities for the TimeGuesser game.
 */

import { pipeline, env, type ImageClassificationPipeline } from '@xenova/transformers';

// Disable local model check — always fetch from hub on first run
env.allowLocalModels = false;

// ─── Text prompts ────────────────────────────────────────────────────────────

const POSITIVE_PROMPTS = [
  'a street scene with buildings and vehicles',
  'a photograph of a city street with pedestrians',
  'an outdoor scene with visible signage and architecture',
  'a historical photograph with era-specific details',
] as const;

const NEGATIVE_PROMPTS = [
  'a blurry or low quality photograph',
  'an indoor scene or interior room',
  'a close-up or zoomed in detail',
  'a painting, drawing, or illustration',
  'a document, map, or diagram',
] as const;

// All prompts combined — order matters: positives first, then negatives
const ALL_PROMPTS = [...POSITIVE_PROMPTS, ...NEGATIVE_PROMPTS];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineProgressEvent {
  status?: string;
  progress?: number;
  file?: string;
}

export interface VisionScore {
  /** 0-100 composite vision score */
  overall: number;
  /** Similarity to "street scene" prompts (0-1) */
  streetScene: number;
  /** Similarity to "era clues" prompt (0-1) */
  eraClues: number;
  /** Similarity to "outdoor/architecture" prompt (0-1) */
  outdoor: number;
  /** Inverse similarity to "blurry/low quality" (0-1, higher = better quality) */
  quality: number;
  /** Similarity to "painting/illustration" (0-1, higher = more likely artwork) */
  isArtwork: number;
  /** Raw prompt probabilities for debugging */
  promptScores: Record<string, number>;
}

// ─── Singleton classifier ────────────────────────────────────────────────────

let classifierPromise: Promise<ImageClassificationPipeline> | null = null;
let loadProgress = '';

function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
      progress_callback: (progress: PipelineProgressEvent) => {
        if (progress.status === 'downloading') {
          const pct = progress.progress != null ? ` ${progress.progress.toFixed(0)}%` : '';
          loadProgress = `Downloading ${progress.file ?? 'model'}${pct}`;
        } else if (progress.status === 'ready') {
          loadProgress = 'Model ready';
        }
      },
    });
  }
  return classifierPromise;
}

/** Returns current model loading status for progress display. */
export function getLoadProgress(): string {
  return loadProgress;
}

// ─── Image scoring ───────────────────────────────────────────────────────────

/**
 * Score a single image against our prompt battery.
 *
 * @param imageUrl - Public URL of the image to score
 * @returns VisionScore with 0-100 overall and per-dimension scores
 */
export async function scoreImage(imageUrl: string): Promise<VisionScore> {
  const classifier = await getClassifier();

  // zero-shot-image-classification returns an array of { score, label }
  // sorted by score descending. We pass all prompts at once.
  const results: Array<{ score: number; label: string }> = await classifier(
    imageUrl,
    ALL_PROMPTS as unknown as string[]
  );

  // Build a lookup: prompt → probability (softmax-normalized by transformers.js)
  const scoreMap: Record<string, number> = {};
  for (const r of results) {
    scoreMap[r.label] = r.score;
  }

  // Extract dimension scores (average the two street prompts)
  const streetScene =
    ((scoreMap[POSITIVE_PROMPTS[0]] ?? 0) + (scoreMap[POSITIVE_PROMPTS[1]] ?? 0)) / 2;
  const eraClues = scoreMap[POSITIVE_PROMPTS[3]] ?? 0;
  const outdoor = scoreMap[POSITIVE_PROMPTS[2]] ?? 0;

  const blurScore = scoreMap[NEGATIVE_PROMPTS[0]] ?? 0;
  const quality = 1 - blurScore;

  const isArtwork = scoreMap[NEGATIVE_PROMPTS[3]] ?? 0;
  const isDocument = scoreMap[NEGATIVE_PROMPTS[4]] ?? 0;
  const isIndoor = scoreMap[NEGATIVE_PROMPTS[1]] ?? 0;
  const isCloseup = scoreMap[NEGATIVE_PROMPTS[2]] ?? 0;

  // Composite: weighted sum of positive signals minus negative signals
  // Positive: street scene (40%), outdoor/architecture (25%), era clues (20%), quality (15%)
  // Then penalize for negative signals
  const positiveScore = streetScene * 0.4 + outdoor * 0.25 + eraClues * 0.2 + quality * 0.15;

  const negativePenalty = isArtwork * 0.3 + isDocument * 0.25 + isIndoor * 0.25 + isCloseup * 0.2;

  // Scale to 0-100: positiveScore is already 0-1 (softmax probabilities),
  // but with 9 prompts competing, typical max positive sums are ~0.4-0.6
  // So we scale up and clamp
  const raw = (positiveScore - negativePenalty * 0.5) * 200;
  const overall = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    overall,
    streetScene,
    eraClues,
    outdoor,
    quality,
    isArtwork,
    promptScores: scoreMap,
  };
}

/**
 * Pre-warm the model (download + load into memory).
 * Call this optionally at server start to avoid cold-start latency.
 */
export async function warmUp(): Promise<void> {
  await getClassifier();
}
