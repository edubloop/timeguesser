import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  fetchWikimediaCandidates,
  getWikimediaCategoryCount,
  getWikimediaCategoryLabels,
} from './providers/wikimedia.js';
import { fetchLOCCandidates, getLOCQueryCount, getLOCQueryLabels } from './providers/loc.js';
import {
  fetchEuropeanaCandidates,
  getEuropeanaQueryCount,
  getEuropeanaQueryLabels,
} from './providers/europeana.js';
import { scoreCandidate, UNIFIED_PASS_THRESHOLD } from './scoring.js';
import { getLoadProgress } from './vision.js';
import { isLLMConfigured } from './llm.js';
import type {
  ScoredCandidate,
  FetchResponse,
  NormalizedCandidate,
  UnifiedScore,
} from './src/types.js';

function hasUnifiedScore(value: UnifiedScore | { error: string }): value is UnifiedScore {
  return 'overall' in value;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from the main project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// ─── Fetch (no scoring — just candidates) ────────────────────────────────────

app.get('/api/fetch', async (req, res) => {
  try {
    const provider = String(req.query.provider ?? 'wikimedia');
    const queryIndex = parseInt(String(req.query.queryIndex ?? '0'), 10);
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10)));

    let rawCandidates: Awaited<ReturnType<typeof fetchWikimediaCandidates>>;

    switch (provider) {
      case 'wikimedia':
        rawCandidates = await fetchWikimediaCandidates(queryIndex, limit);
        break;
      case 'loc':
        rawCandidates = await fetchLOCCandidates(queryIndex, page, limit);
        break;
      case 'europeana': {
        const apiKey = process.env.EXPO_PUBLIC_EUROPEANA_API_KEY ?? '';
        rawCandidates = await fetchEuropeanaCandidates(apiKey, queryIndex, page, limit);
        break;
      }
      default:
        res.status(400).json({ error: `Unknown provider: ${provider}` });
        return;
    }

    // Wrap candidates — no scoring yet
    const scored: ScoredCandidate[] = rawCandidates.candidates.map((candidate) => ({
      candidate,
    }));

    const stats = {
      total: scored.length,
      hardFailed: 0, // Will be populated after scoring
    };

    const response: FetchResponse = {
      candidates: scored,
      rejectedAtExtraction: rawCandidates.rejectedByReason,
      stats,
    };

    res.json(response);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ─── Metadata ────────────────────────────────────────────────────────────────

app.get('/api/meta', (_req, res) => {
  res.json({
    wikimedia: {
      categoryCount: getWikimediaCategoryCount(),
      categoryLabels: getWikimediaCategoryLabels(),
    },
    loc: { queryCount: getLOCQueryCount(), queryLabels: getLOCQueryLabels() },
    europeana: {
      queryCount: getEuropeanaQueryCount(),
      queryLabels: getEuropeanaQueryLabels(),
      hasApiKey: Boolean(process.env.EXPO_PUBLIC_EUROPEANA_API_KEY),
    },
    llmConfigured: isLLMConfigured(),
    passThreshold: UNIFIED_PASS_THRESHOLD,
  });
});

// ─── Unified scoring (CLIP + LLM) ───────────────────────────────────────────

app.post('/api/score-batch', async (req, res) => {
  try {
    const { candidates } = req.body as {
      candidates: Array<{
        key: string;
        imageUrl: string;
        candidate: NormalizedCandidate;
      }>;
    };

    if (!Array.isArray(candidates) || candidates.length === 0) {
      res.status(400).json({ error: 'candidates array is required' });
      return;
    }

    console.log(`[score-batch] Starting scoring for ${candidates.length} candidates`);

    // Use JSON response instead of SSE to avoid streaming issues
    const results: Record<string, UnifiedScore | { error: string }> = {};
    let completed = 0;
    const CONCURRENCY = 4;

    // Process in parallel batches
    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
      const batch = candidates.slice(i, i + CONCURRENCY);
      console.log(
        `[score-batch] Batch ${Math.floor(i / CONCURRENCY) + 1}: scoring ${batch.length} candidates...`
      );

      const batchResults = await Promise.allSettled(
        batch.map(async ({ key, imageUrl, candidate }) => {
          try {
            const score = await scoreCandidate(candidate, imageUrl);
            return { key, score };
          } catch (err) {
            console.error(`[score-batch] Error scoring ${key}:`, err);
            return { key, score: { error: String(err) } };
          }
        })
      );

      for (const result of batchResults) {
        completed++;
        if (result.status === 'fulfilled') {
          results[result.value.key] = result.value.score;
          console.log(
            `[score-batch] ${completed}/${candidates.length} — ${result.value.key}: ${
              hasUnifiedScore(result.value.score) ? result.value.score.overall : 'error'
            }`
          );
        } else {
          console.error(
            `[score-batch] ${completed}/${candidates.length} — rejected:`,
            result.reason
          );
        }
      }
    }

    console.log(`[score-batch] Done. Sending ${Object.keys(results).length} results.`);
    res.json({ results });
  } catch (err) {
    console.error('Score batch error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/scoring-status', (_req, res) => {
  res.json({
    loadProgress: getLoadProgress(),
    llmConfigured: isLLMConfigured(),
  });
});

// ─── Annotations persistence ─────────────────────────────────────────────────

const ANNOTATIONS_FILE = path.resolve(__dirname, 'annotations.json');

function readAnnotations(): Record<string, unknown> {
  try {
    if (fs.existsSync(ANNOTATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(ANNOTATIONS_FILE, 'utf-8'));
    }
  } catch {
    /* start fresh */
  }
  return {};
}

function writeAnnotations(data: Record<string, unknown>): void {
  fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/annotations', (_req, res) => {
  res.json(readAnnotations());
});

app.put('/api/annotations/:key', (req, res) => {
  const key = decodeURIComponent(req.params.key);
  const annotations = readAnnotations();
  annotations[key] = req.body;
  writeAnnotations(annotations);
  res.json({ ok: true });
});

app.delete('/api/annotations/:key', (req, res) => {
  const key = decodeURIComponent(req.params.key);
  const annotations = readAnnotations();
  delete annotations[key];
  writeAnnotations(annotations);
  res.json({ ok: true });
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = 3847;
app.listen(PORT, () => {
  console.log(`Pipeline Inspector API running on http://localhost:${PORT}`);
  console.log(
    `LLM (Big Pickle): ${isLLMConfigured() ? 'configured' : 'NOT configured — set OPENCODE_API_KEY in .env.local'}`
  );
});
