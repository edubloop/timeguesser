/**
 * LLM-based metadata scoring via Big Pickle (OpenCode Zen API).
 *
 * Sends photo metadata (title, description, tags, year, location) to the LLM
 * and asks it to assess guessability for a geography/era guessing game.
 * Returns a 0-100 score with reasoning.
 */

import OpenAI from 'openai';
import type { NormalizedCandidate } from './src/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetadataScore {
  /** 0-100 guessability score based on metadata context */
  score: number;
  /** LLM's reasoning for the score */
  reasoning: string;
}

interface ParsedMetadataScore {
  score?: unknown;
  reasoning?: unknown;
}

// ─── Client ──────────────────────────────────────────────────────────────────

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENCODE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENCODE_API_KEY not set. Add it to .env.local to enable LLM metadata scoring.'
      );
    }
    client = new OpenAI({
      baseURL: 'https://opencode.ai/zen/v1',
      apiKey,
    });
  }
  return client;
}

/** Check if the LLM is configured (API key present). */
export function isLLMConfigured(): boolean {
  return Boolean(process.env.OPENCODE_API_KEY);
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(c: NormalizedCandidate): string {
  const tags = c.tags?.length ? c.tags.join(', ') : 'none';
  const desc = c.description?.slice(0, 500) ?? 'none';

  return `You are scoring a historical photograph for a geography/era guessing game called TimeGuesser.
Players see ONLY the image and must guess WHERE (city/country) and WHEN (decade) it was taken.

Here is the metadata for this photograph:
- Title: "${c.title}"
- Description: "${desc}"
- Tags: ${tags}
- Year: ${c.year} (source: ${c.yearSource}, confidence: ${c.yearConfidence})
- Location: ${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)} (source: ${c.locationSource}, confidence: ${c.locationConfidence})
- Provider: ${c.provider}
- License: ${c.license}
${c.author ? `- Author: ${c.author}` : ''}
${c.institutionName ? `- Institution: ${c.institutionName}` : ''}

Based on the metadata alone, score this photo's GUESSABILITY from 0-100:
- HIGH (70-100): Metadata suggests a recognizable street scene, landmark, or distinctive place with clear era markers. Title/description contain specific location names, architectural references, or cultural context.
- MEDIUM (40-69): Some location/era clues but ambiguous or generic. Could be anywhere or anytime without visual confirmation.
- LOW (0-39): Indoor scene, abstract subject, close-up detail, artwork/painting, document, or metadata gives no useful geographic/temporal context for guessing.

Consider: Does the title name a specific place? Do tags suggest outdoor/urban scenes? Is the description informative about the setting? Would a player gain useful context from what the metadata implies about the image?

Respond with ONLY a JSON object, no other text:
{"score": <number 0-100>, "reasoning": "<one sentence explanation>"}`;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Score a candidate's metadata using the LLM.
 * Returns a 0-100 score and reasoning string.
 */
export async function scoreMetadata(candidate: NormalizedCandidate): Promise<MetadataScore> {
  const ai = getClient();

  // Wrap in a timeout to prevent hanging on rate limits or slow responses
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await ai.chat.completions.create(
      {
        model: process.env.OPENCODE_MODEL ?? 'mimo-v2-pro-free',
        messages: [{ role: 'user', content: buildPrompt(candidate) }],
        temperature: 0.1,
        max_tokens: 150,
      },
      { signal: controller.signal }
    );

    const content = response.choices[0]?.message?.content?.trim() ?? '';

    // Parse JSON response — handle markdown code blocks if present
    const jsonStr = content.replace(/^```json?\s*/, '').replace(/\s*```$/, '');

    try {
      const parsed = JSON.parse(jsonStr) as ParsedMetadataScore;
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      const reasoning = String(parsed.reasoning || 'No reasoning provided.');
      return { score, reasoning };
    } catch {
      // If JSON parsing fails, try to extract a number from the response
      const numMatch = content.match(/\b(\d{1,3})\b/);
      if (numMatch) {
        return {
          score: Math.max(0, Math.min(100, parseInt(numMatch[1], 10))),
          reasoning: `(Parse fallback) ${content.slice(0, 200)}`,
        };
      }
      return { score: 50, reasoning: `(LLM response unparseable) ${content.slice(0, 200)}` };
    }
  } catch (err: unknown) {
    // Handle rate limits, timeouts, and other API errors gracefully
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Rate limit') || msg.includes('FreeUsageLimitError')) {
      return { score: -1, reasoning: 'Rate limited — try again later.' };
    }
    if ((err instanceof Error && err.name === 'AbortError') || msg.includes('abort')) {
      return { score: -1, reasoning: 'LLM request timed out (30s).' };
    }
    return { score: -1, reasoning: `LLM error: ${msg.slice(0, 200)}` };
  } finally {
    clearTimeout(timeout);
  }
}
